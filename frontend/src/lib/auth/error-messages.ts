/**
 * Traduce mensajes de error de Supabase Auth al español.
 */
export function authErrorToSpanish(
  message: string,
  context: 'login' | 'google' | 'signup' = 'login'
): string {
  const msg = message?.toLowerCase() ?? '';
  if (msg.includes('email not confirmed')) return 'El correo no está confirmado. Revisá tu bandeja y hacé clic en el enlace que te enviamos.';
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('user not found')) return 'No existe una cuenta con ese correo.';
  if (msg.includes('email rate limit') || msg.includes('too many requests')) return 'Demasiados intentos. Intentá de nuevo en unos minutos.';
  if (msg.includes('signup_disabled')) return 'El registro está deshabilitado.';
  if (msg.includes('user_already_exists') || msg.includes('already been registered')) return 'Ya existe una cuenta con ese correo.';
  if (msg.includes('weak password')) return 'La contraseña no cumple los requisitos.';
  if (msg.includes('session_expired')) return 'La sesión expiró. Iniciá sesión de nuevo.';
  if (msg.includes('oauth')) return 'Error al iniciar sesión con Google. Intentá de nuevo.';
  const fallback = context === 'google' ? 'Error al iniciar sesión con Google' : context === 'signup' ? 'Error al registrarse' : 'Error al iniciar sesión';
  return message || fallback;
}
