'use client';

import { formatPeso } from '@/lib/format';

const MP_PERCENT = 10.61;
const FACTOR_NETO = 1 - MP_PERCENT / 100;

export function SenaComisionesInfo({ monto }: { monto: number }) {
  if (monto <= 0) return null;

  const recibis = monto * FACTOR_NETO;
  const redondeo = Math.ceil(recibis / 500) * 500 || 500;
  const montoParaRedondeo = Math.ceil(redondeo / FACTOR_NETO);

  return (
    <p className="sena-comisiones-info" style={{
      fontSize: '0.85rem',
      color: 'var(--text-muted, #666)',
      marginTop: '-0.5rem',
      marginBottom: '1rem',
      lineHeight: 1.5,
    }}>
      Si cobrás {formatPeso(monto)}, recibís aprox. {formatPeso(recibis)} (descontando {MP_PERCENT}% Mercado Pago). Si querés recibir {formatPeso(redondeo)} netos, cobrá {formatPeso(montoParaRedondeo)} de seña.
    </p>
  );
}
