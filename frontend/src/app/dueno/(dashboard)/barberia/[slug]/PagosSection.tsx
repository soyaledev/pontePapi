'use client';

import { useCallback } from 'react';
import styles from './PagosSection.module.css';

function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, 128);
}

async function sha256Base64Url(verifier: string): Promise<string> {
  const buf = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = Array.from(new Uint8Array(hash));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function PagosSection({
  barbershopId,
  requiereSena,
  mpLinked,
}: {
  barbershopId: string;
  requiereSena: boolean;
  mpLinked: boolean;
}) {
  const handleClick = useCallback(async () => {
    const clientId =
      process.env.NEXT_PUBLIC_MP_CLIENT_ID ?? process.env.MP_CLIENT_ID;
    const redirectUri =
      process.env.NEXT_PUBLIC_MP_REDIRECT_URI ??
      process.env.MP_REDIRECT_URI ??
      (typeof window !== 'undefined'
        ? `${window.location.origin}/dueno/mercadopago/callback`
        : 'http://localhost:3000/dueno/mercadopago/callback');

    if (!clientId) return;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await sha256Base64Url(codeVerifier);
    const state = crypto.randomUUID();
    sessionStorage.setItem(
      `mp_oauth_${state}`,
      JSON.stringify({ barbershopId, codeVerifier })
    );

    const authUrl =
      `https://auth.mercadopago.com.ar/authorization?client_id=${encodeURIComponent(clientId)}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;
    window.location.href = authUrl;
  }, [barbershopId]);

  if (!requiereSena) return null;

  if (mpLinked) {
    return (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Pagos</h3>
        <p className={styles.linked}>Cuenta Mercado Pago vinculada</p>
      </section>
    );
  }

  const clientId =
    process.env.NEXT_PUBLIC_MP_CLIENT_ID ?? process.env.MP_CLIENT_ID;

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Pagos</h3>
      <p className={styles.warning}>
        Para recibir las señas debés vincular tu cuenta Mercado Pago.
      </p>
      {clientId ? (
        <button
          type="button"
          onClick={handleClick}
          className={styles.linkBtn}
        >
          Vincular cuenta Mercado Pago
        </button>
      ) : (
        <p className={styles.error}>Mercado Pago no configurado</p>
      )}
    </section>
  );
}
