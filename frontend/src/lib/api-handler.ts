/**
 * Wrapper para API route handlers con try/catch automático que registra errores.
 */

import { NextResponse } from 'next/server';
import { logError } from '@/lib/error-logger';

type RouteContext = { params?: Promise<Record<string, string>> };
type Handler = (req: Request, context?: RouteContext) => Promise<Response>;

export function withErrorLogging(
  handler: Handler,
  path: string,
  method: string
): Handler {
  return async (req: Request, context?: RouteContext) => {
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
