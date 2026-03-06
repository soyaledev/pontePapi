import { NextResponse } from 'next/server';
import { sendComprobanteEmail } from '@/lib/email/send-comprobante';
import { withErrorLogging } from '@/lib/api-handler';

async function postSendComprobante(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  const result = await sendComprobanteEmail(id);

  if (!result.ok) {
    if (result.error === 'Ultramail no configurado') {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    if (result.error === 'Turno no encontrado') {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    if (result.error === 'Sin correo del cliente') {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ error: result.error ?? 'Error al enviar el correo' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export const POST = withErrorLogging(
  postSendComprobante,
  '/api/appointments/[id]/send-comprobante-email',
  'POST'
);
