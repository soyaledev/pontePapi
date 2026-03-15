'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { authErrorToSpanish } from '@/lib/auth/error-messages';
import { PasswordInput } from '@/components/PasswordInput/PasswordInput';
import styles from './Login.module.css';

export function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'auth') setError('Hubo un error al iniciar sesión. Intentá de nuevo.');
    else if (err === 'verification_expired') setError('El enlace de verificación venció. Solicitá uno nuevo desde el panel.');
    else if (err === 'verification_missing') setError('Faltó el enlace de verificación.');
  }, [searchParams]);

  const verifiedSuccess = searchParams.get('verified') === '1';

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = '/dueno/turnos';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(authErrorToSpanish(msg, 'login'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dueno/turnos`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setError(authErrorToSpanish(msg, 'google'));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.body}>
        {verifiedSuccess && (
          <div className={styles.successBanner} role="alert">
            Correo verificado. Ya podés iniciar sesión.
          </div>
        )}
        <div className={styles.card}>
          <h1 className={styles.title}>Ingresar</h1>
          <p className={styles.subtitle}>Panel de dueños de barbería</p>
          <form onSubmit={handleEmailLogin} className={styles.form}>
            {error && <p className={styles.error}>{error}</p>}
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              autoComplete="email"
              required
            />
            <PasswordInput
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              autoComplete="current-password"
              required
            />
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar con correo'}
            </button>
          </form>
          <div className={styles.divider}>o</div>
          <div className={styles.form}>
            <button
              type="button"
              className={styles.googleButton}
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <span className={styles.googleSpinner} aria-hidden />
              ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              )}
              {googleLoading ? 'Redirigiendo...' : 'Continuar con Google'}
            </button>
          </div>
          <p className={styles.footer}>
            ¿No tenés cuenta? <Link href="/dueno/registro">Registrarse</Link>
          </p>
        </div>
        <Link href="/" className={styles.back}>
          Volver al panel cliente
        </Link>
      </div>
    </div>
  );
}
