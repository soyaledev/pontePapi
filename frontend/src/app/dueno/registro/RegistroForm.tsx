'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authErrorToSpanish } from '@/lib/auth/error-messages';
import { PasswordInput } from '@/components/PasswordInput/PasswordInput';
import styles from '../login/Login.module.css';

export function RegistroForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      const res = await fetch('/api/dueno/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? 'Error al registrarse');
      }
      router.replace(`/dueno/verificar-correo?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrarse';
      setError(authErrorToSpanish(msg, 'signup'));
    } finally {
      setLoading(false);
    }
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
      <PasswordInput
        placeholder="Contraseña (mín. 6)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={styles.input}
        autoComplete="new-password"
        required
        minLength={6}
      />
      <PasswordInput
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
