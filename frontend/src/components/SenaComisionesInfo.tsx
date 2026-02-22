'use client';

const MP_PERCENT = 7.61;
const PLATAFORMA_PERCENT = 3;
const FACTOR_NETO = 1 - MP_PERCENT / 100 - PLATAFORMA_PERCENT / 100;

function formatPeso(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

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
      Si cobrás ${formatPeso(monto)}, recibís aprox. ${formatPeso(recibis)} (descontando {MP_PERCENT}% Mercado Pago + {PLATAFORMA_PERCENT}% plataforma). Si querés recibir ${formatPeso(redondeo)} netos, cobrá ${formatPeso(montoParaRedondeo)} de seña.
    </p>
  );
}
