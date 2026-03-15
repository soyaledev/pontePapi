'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import styles from './VerificarCorreo.module.css';

function VerificarCorreoContent() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendError, setResendError] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setUserEmail(emailParam);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail('');
      }
    });
  }, [searchParams]);

  async function handleResend() {
    if (!userEmail) return;
    setLoading(true);
    setResendError('');
    try {
      const res = await fetch('/api/dueno/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSent(true);
      } else {
        setResendError(data.error ?? 'Error al reenviar');
      }
    } finally {
      setLoading(false);
    }
  }

  if (userEmail === null) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.subtitle}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (userEmail === '') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Verificá tu correo</h1>
          <p className={styles.subtitle}>
            Ingresá a tu correo para ver el enlace de verificación. Si no lo encontrás, <Link href="/dueno/login">iniciá sesión</Link> y te redirigiremos.
          </p>
          <Link href="/dueno/login" className={styles.button}>
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Verificá tu correo</h1>
        <p className={styles.subtitle}>
          Te enviamos un enlace a <strong>{userEmail}</strong> para activar tu cuenta.
        </p>
        {sent ? (
          <p className={styles.success}>¡Correo reenviado! Revisá tu bandeja.</p>
        ) : (
          <>
            {resendError && <p className={styles.error}>{resendError}</p>}
            <button
              type="button"
              onClick={handleResend}
              className={styles.button}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Reenviar correo'}
            </button>
          </>
        )}
        <p className={styles.footer}>
          ¿Ya verificaste? <Link href="/dueno/login">Iniciar sesión</Link>
        </p>
      </div>
      <Link href="/dueno/login" className={styles.back}>
        Volver al login
      </Link>
    </div>
  );
}

export default function VerificarCorreoPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.card}><p className={styles.subtitle}>Cargando...</p></div>
      </div>
    }>
      <VerificarCorreoContent />
    </Suspense>
  );
}
