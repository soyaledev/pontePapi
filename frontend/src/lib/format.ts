/** Primera letra de cada palabra en mayúscula */
export function toTitleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/** Formato $x.xxx.xxx para montos en pesos */
export function formatPeso(monto: number): string {
  return (
    '$' +
    Math.round(monto)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

/** Formato x.xxx para display en input (solo la parte numérica con puntos) */
export function formatPesoInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const n = parseInt(digits, 10);
  if (isNaN(n)) return '';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Detecta si es un link (http/https o maps) */
export function isLink(text: string): boolean {
  const t = text.trim();
  return /^https?:\/\//i.test(t) || /^(maps\.google|goo\.gl|maps\.app\.goo\.gl)/i.test(t);
}

/** Valida que sea un link de Google Maps */
export function isGoogleMapsLink(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return (
    /google\.com(\.[a-z]{2})?\/maps/i.test(t) ||
    /maps\.google/i.test(t) ||
    /goo\.gl\/maps/i.test(t) ||
    /maps\.app\.goo\.gl/i.test(t)
  );
}

/** Aplica toTitleCase solo si no es un link */
export function formatAddress(str: string): string {
  const t = str.trim();
  return isLink(t) ? t : toTitleCase(t);
}

/** Instagram: siempre con @ al inicio y minúsculas */
export function formatInstagram(str: string): string {
  const t = str.trim().replace(/^@+/, '').toLowerCase();
  return t ? `@${t}` : '';
}

/** Nombre de servicio: primera palabra en mayúscula, resto como escribió el usuario. Máx 50 chars. */
export function formatServiceName(str: string): string {
  const trimmed = str.trim().slice(0, 50);
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1);
  }
  const first = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return [first, ...words.slice(1)].join(' ');
}

/** Parsea input de precio: acepta 13.000 ($), $13.000, 13,50, etc. Dots = miles, coma = decimales. */
export function parsePesoInput(raw: string): number {
  const cleaned = raw.replace(/[$€\s]/g, '').trim();
  if (!cleaned) return 0;
  const hasComma = cleaned.includes(',');
  let numStr: string;
  if (hasComma) {
    numStr = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    const lastDot = cleaned.lastIndexOf('.');
    if (lastDot === -1) {
      numStr = cleaned;
    } else {
      const afterDot = cleaned.slice(lastDot + 1);
      if (afterDot.length === 3 && /^\d+$/.test(afterDot)) {
        numStr = cleaned.replace(/\./g, '');
      } else {
        numStr = cleaned;
      }
    }
  }
  const n = parseFloat(numStr);
  return isNaN(n) ? 0 : Math.max(0, n);
}
