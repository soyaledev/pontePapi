'use client';

import { useCallback, useState } from 'react';
import { formatPeso } from '@/lib/format';
import styles from './PagosSection.module.css';

type PagoItem = {
  id: string;
  fecha: string;
  slot_time: string;
  cliente_nombre: string;
  monto: number;
};

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

function formatFechaPago(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export function PagosSection({
  barbershopId,
  requiereSena,
  mpLinked,
  pagos = [],
  montoSena = 0,
}: {
  barbershopId: string;
  requiereSena: boolean;
  mpLinked: boolean;
  pagos?: PagoItem[];
  montoSena?: number;
}) {
  const [historialOpen, setHistorialOpen] = useState(false);

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

  const clientId =
    process.env.NEXT_PUBLIC_MP_CLIENT_ID ?? process.env.MP_CLIENT_ID;

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Pagos</h3>

      {mpLinked ? (
        <div className={styles.linkedCard}>
          <div className={styles.linkedTop}>
            <div className={styles.linkedIcon}>
              <svg viewBox="0 0 24 24" fill="none" className={styles.mpLogo}>
                <rect width="24" height="24" rx="6" fill="#009EE3" />
                <path d="M6.5 14.5c0-2.5 2-4.5 4.5-4.5 1.5 0 2.8.7 3.6 1.8.8-1.1 2.1-1.8 3.6-1.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <path d="M13.5 14.5c0-2.5 2-4.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity=".6"/>
              </svg>
            </div>
            <div className={styles.linkedInfo}>
              <span className={styles.linkedLabel}>Mercado Pago</span>
              <span className={styles.linkedBadge}>
                <span className={styles.linkedDot} />
                Vinculada
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.unlinkCard}>
          <div className={styles.unlinkContent}>
            <svg viewBox="0 0 24 24" fill="none" className={styles.mpLogoLg}>
              <rect width="24" height="24" rx="6" fill="#009EE3" />
              <path d="M6.5 14.5c0-2.5 2-4.5 4.5-4.5 1.5 0 2.8.7 3.6 1.8.8-1.1 2.1-1.8 3.6-1.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              <path d="M13.5 14.5c0-2.5 2-4.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity=".6"/>
            </svg>
            <div className={styles.unlinkText}>
              <p className={styles.unlinkTitle}>Vincular Mercado Pago</p>
              <p className={styles.unlinkDesc}>Conectá tu cuenta para recibir las señas de tus clientes de forma automática.</p>
            </div>
          </div>
          {clientId ? (
            <button
              type="button"
              onClick={handleClick}
              className={styles.linkBtn}
            >
              <svg viewBox="0 0 24 24" fill="none" className={styles.linkBtnIcon}>
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Vincular cuenta
            </button>
          ) : (
            <p className={styles.error}>Mercado Pago no configurado</p>
          )}
        </div>
      )}

      {pagos.length > 0 && (
        <div className={styles.historial}>
          <button
            type="button"
            className={styles.historialToggle}
            onClick={() => setHistorialOpen((o) => !o)}
            aria-expanded={historialOpen}
          >
            <span className={styles.historialToggleText}>
              Historial de señas
              <span className={styles.historialBadge}>{pagos.length}</span>
            </span>
            <svg
              className={`${styles.historialChevron} ${historialOpen ? styles.historialChevronOpen : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {historialOpen && (
            <div className={styles.historialContent}>
              <ul className={styles.historialList}>
                {pagos.map((p) => (
                  <li key={p.id} className={styles.historialItem}>
                    <div className={styles.historialItemLeft}>
                      <span className={styles.historialNombre}>{p.cliente_nombre}</span>
                      <span className={styles.historialMeta}>
                        {formatFechaPago(p.fecha)} · {p.slot_time.slice(0, 5)}
                      </span>
                    </div>
                    <span className={styles.historialMonto}>
                      {formatPeso(p.monto)}
                    </span>
                  </li>
                ))}
              </ul>
              {pagos.length > 0 && (
                <div className={styles.historialTotal}>
                  <span>Total recibido</span>
                  <strong>{formatPeso(pagos.reduce((s, p) => s + p.monto, 0))}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
