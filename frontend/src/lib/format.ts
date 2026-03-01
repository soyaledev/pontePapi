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
