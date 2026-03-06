/**
 * Wrapper para API route handlers con try/catch automático que registra errores.
 */

import { NextResponse } from 'next/server';
import { logError } from '@/lib/error-logger';

type RouteContextBase = { params?: Promise<Record<string, string>> };

export function withErrorLogging<C extends RouteContextBase>(
  handler: (req: Request, context: C) => Promise<Response>,
  path: string,
  method: string
): (req: Request, context: C) => Promise<Response> {
  return async (req: Request, context: C) => {
    try {
      return await handler(req, context);
    } catch (err: unknown) {
      await logError({
        source: 'api',
        path,
        method,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        statusCode: 500,
      });
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  };
}
