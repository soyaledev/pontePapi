'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { authErrorToSpanish } from '@/lib/auth/error-messages';
import styles from '../login/Login.module.css';

export function RegistroForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dueno/turnos`,
        },
      });
      if (err) throw err;
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrarse';
      setError(authErrorToSpanish(msg, 'signup'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className={styles.form}>
        <p className={styles.success}>
          Revisá tu correo. Te enviamos un enlace para confirmar tu cuenta.
        </p>
        <p className={styles.subtitle} style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Si no aparece, revisá la carpeta de spam.
        </p>
        <Link href="/dueno/login" className={styles.button} style={{ display: 'inline-block', textAlign: 'center', marginTop: '1rem' }}>
          Ir al login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
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
      <input
        type="password"
        placeholder="Contraseña (mín. 6)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.input}
        autoComplete="new-password"
        required
        minLength={6}
      />
      <input
        type="password"
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className={styles.input}
        autoComplete="new-password"
        required
      />
      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
      <p className={styles.footer}>
        ¿Tenés cuenta? <Link href="/dueno/login">Inicia sesión</Link>
      </p>
    </form>
  );
}
