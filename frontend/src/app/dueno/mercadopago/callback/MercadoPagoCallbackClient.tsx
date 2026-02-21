'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function MercadoPagoCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      router.replace('/dueno/dashboard?error=mp_invalid');
      return;
    }

    const stored = sessionStorage.getItem(`mp_oauth_${state}`);
    if (!stored) {
      router.replace('/dueno/dashboard?error=mp_session');
      return;
    }

    let data: { barbershopId: string; codeVerifier: string };
    try {
      data = JSON.parse(stored);
    } catch {
      router.replace('/dueno/dashboard?error=mp_session');
      return;
    }

    sessionStorage.removeItem(`mp_oauth_${state}`);

    fetch('/api/mercadopago/oauth-callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: data.codeVerifier,
        barbershopId: data.barbershopId,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.slug) {
          setStatus('ok');
          router.replace(`/dueno/barberia/${json.slug}?mp_linked=1`);
        } else {
          setStatus('error');
          router.replace(
            json.slug
              ? `/dueno/barberia/${json.slug}?error=mp_token`
              : '/dueno/dashboard?error=mp_token'
          );
        }
      })
      .catch(() => {
        setStatus('error');
        router.replace('/dueno/dashboard?error=mp_token');
      });
  }, [searchParams, router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text)' }}>
      {status === 'loading' && <p>Vincular cuenta Mercado Pago...</p>}
    </div>
  );
}
