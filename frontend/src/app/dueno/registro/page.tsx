'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import styles from '../login/Login.module.css';

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        router.push('/dueno/login');
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <Link href="/" className={styles.back}>
            Volver al panel cliente
          </Link>
        </header>
        <div className={styles.body}>
          <div className={styles.card}>
          <h1 className={styles.title}>¡Cuenta creada!</h1>
          <p className={styles.subtitle}>
            Redirigiendo al login...
          </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          Volver al panel cliente
        </Link>
      </header>
      <div className={styles.body}>
        <div className={styles.card}>
        <h1 className={styles.title}>Registrarse</h1>
        <p className={styles.subtitle}>Crear cuenta como dueño de barbería</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className={styles.input}
            required
            minLength={6}
            autoComplete="new-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className={styles.footer}>
          ¿Ya tenés cuenta? <Link href="/dueno/login">Ingresar</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
