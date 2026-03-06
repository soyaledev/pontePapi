import { NextResponse } from 'next/server';
import { logError } from '@/lib/error-logger';

/**
 * Recibe errores del frontend (ErrorBoundary, etc).
 * Rate limit: máximo 20 requests por minuto por IP (simple in-memory).
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry) return false;
  if (now > entry.resetAt) {
    rateLimitMap.delete(ip);
    return false;
  }
  return entry.count >= RATE_LIMIT;
}

function incrementRateLimit(ip: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count++;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  try {
    const body = (await req.json()) as {
      message?: string;
      stack?: string;
      path?: string;
      userId?: string;
      userEmail?: string;
      metadata?: Record<string, unknown>;
    };

    const message = body?.message?.slice(0, 2000) ?? 'Error desconocido';
    incrementRateLimit(ip);

    await logError({
      source: 'client',
      path: body?.path ?? req.url,
      method: 'POST',
      message,
      stack: body?.stack?.slice(0, 8000) ?? undefined,
      userId: body?.userId,
      userEmail: body?.userEmail,
      metadata: body?.metadata,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 });
  }
}
