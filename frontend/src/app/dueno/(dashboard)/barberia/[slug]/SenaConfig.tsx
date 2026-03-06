'use client';

import { useState, useMemo, useCallback } from 'react';
import { formatPeso, formatPesoInput } from '@/lib/format';
import { supabase } from '@/lib/supabase/client';
import { dispatchPanelVisibilityUpdate } from './VisibilityNotice';
import styles from './SenaConfig.module.css';

const MP_FEE_PERCENT = 10.61;
const ROUND_STEP = 50;

function calcClientePaga(montoNeto: number): number {
  if (montoNeto <= 0) return 0;
  const exacto = montoNeto / (1 - MP_FEE_PERCENT / 100);
  return Math.ceil(exacto / ROUND_STEP) * ROUND_STEP;
}

function calcOwnerRecibe(montoBruto: number): number {
  return montoBruto * (1 - MP_FEE_PERCENT / 100);
}

function formatFechaPago(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 128);
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

type PagoItem = {
  id: string;
  fecha: string;
  slot_time: string;
  cliente_nombre: string;
  monto: number;
};

export function SenaConfig({
  barbershopId,
  initialRequiereSena,
  initialSenaOpcional,
  initialMontoSena,
  initialComisionCliente,
  initialMpLinked,
  pagos = [],
}: {
  barbershopId: string;
  initialRequiereSena: boolean;
  initialSenaOpcional: boolean;
  initialMontoSena: number;
  initialComisionCliente: boolean;
  initialMpLinked: boolean;
  pagos?: PagoItem[];
}) {
  const [requiereSena, setRequiereSena] = useState(initialRequiereSena);
  const [senaOpcional, setSenaOpcional] = useState(initialSenaOpcional);
  const [montoRaw, setMontoRaw] = useState(
    initialMontoSena > 0 ? String(initialMontoSena) : ''
  );
  const [comisionCliente, setComisionCliente] = useState(initialComisionCliente);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [historialOpen, setHistorialOpen] = useState(false);

  const monto = parseInt(montoRaw.replace(/\D/g, ''), 10) || 0;
  const clientePaga = comisionCliente ? calcClientePaga(monto) : monto;
  const ownerRecibe = comisionCliente ? monto : calcOwnerRecibe(monto);

  const hasConfigChanges = useMemo(() => {
    return (
      senaOpcional !== initialSenaOpcional ||
      monto !== initialMontoSena ||
      comisionCliente !== initialComisionCliente
    );
  }, [senaOpcional, monto, comisionCliente, initialSenaOpcional, initialMontoSena, initialComisionCliente]);

  async function handleToggle(checked: boolean) {
    setRequiereSena(checked);
    setToggling(true);
    const update: { requiere_sena: boolean; monto_sena?: number } = {
      requiere_sena: checked,
    };
    if (!checked) update.monto_sena = 0;
    await supabase.from('barbershops').update(update).eq('id', barbershopId);
    setToggling(false);
    dispatchPanelVisibilityUpdate();
  }

  async function handleSaveConfig() {
    setError('');
    if (monto <= 0) {
      setError('Ingresá un monto de seña');
      return;
    }
    setSaving(true);
    const { error: dbError } = await supabase
      .from('barbershops')
      .update({
        sena_opcional: senaOpcional,
        monto_sena: monto,
        sena_comision_cliente: comisionCliente,
      })
      .eq('id', barbershopId);
    setSaving(false);
    if (dbError) {
      setError('Error al guardar');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    dispatchPanelVisibilityUpdate();
  }

  const handleMpConnect = useCallback(async () => {
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

    window.location.href = `https://auth.mercadopago.com.ar/authorization?client_id=${encodeURIComponent(clientId)}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;
  }, [barbershopId]);

  const clientId =
    process.env.NEXT_PUBLIC_MP_CLIENT_ID ?? process.env.MP_CLIENT_ID;

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Seña</h3>

      {/* ── Toggle ── */}
      <div className={styles.toggle}>
        <button
          type="button"
          className={`${styles.toggleBtn} ${!requiereSena ? styles.toggleBtnActive : ''}`}
          onClick={() => handleToggle(false)}
          disabled={toggling}
        >
          No cobrar
        </button>
        <button
          type="button"
          className={`${styles.toggleBtn} ${requiereSena ? styles.toggleBtnActive : ''}`}
          onClick={() => handleToggle(true)}
          disabled={toggling}
        >
          Cobrar seña
        </button>
      </div>

      {!requiereSena && (
        <p className={styles.hint}>
          Los clientes reservan sin pagar seña.
        </p>
      )}

      {/* ── Config (solo si requiereSena) ── */}
      {requiereSena && (
        <div className={styles.config}>
          {/* Tipo */}
          <div className={styles.group}>
            <label className={styles.groupLabel}>Tipo de seña</label>
            <div className={styles.segmented}>
              <button
                type="button"
                className={`${styles.segmentedBtn} ${!senaOpcional ? styles.segmentedBtnActive : ''}`}
                onClick={() => setSenaOpcional(false)}
              >
                Obligatoria
              </button>
              <button
                type="button"
                className={`${styles.segmentedBtn} ${senaOpcional ? styles.segmentedBtnActive : ''}`}
                onClick={() => setSenaOpcional(true)}
              >
                Opcional
              </button>
            </div>
            <p className={styles.hint}>
              {senaOpcional
                ? 'El cliente elige si pagar la seña o reservar gratis.'
                : 'El cliente debe pagar la seña para reservar.'}
            </p>
          </div>

          {/* Monto */}
          <div className={styles.group}>
            <label className={styles.groupLabel}>Monto de seña</label>
            <div className={styles.montoWrap}>
              <span className={styles.montoPrefix}>$</span>
              <input
                type="text"
                inputMode="numeric"
                value={montoRaw ? formatPesoInput(montoRaw) : ''}
                onChange={(e) => setMontoRaw(e.target.value.replace(/\D/g, ''))}
                className={styles.montoInput}
                placeholder="2.000"
              />
            </div>
          </div>

          {/* Comisión */}
          <div className={styles.group}>
            <label className={styles.groupLabel}>
              Costos de Mercado Pago
            </label>
            <div className={styles.segmented}>
              <button
                type="button"
                className={`${styles.segmentedBtn} ${!comisionCliente ? styles.segmentedBtnActive : ''}`}
                onClick={() => setComisionCliente(false)}
              >
                Los absorbo yo
              </button>
              <button
                type="button"
                className={`${styles.segmentedBtn} ${comisionCliente ? styles.segmentedBtnActive : ''}`}
                onClick={() => setComisionCliente(true)}
              >
                Los paga el cliente
              </button>
            </div>
          </div>

          {/* Preview */}
          {monto > 0 && (
            <div className={styles.preview}>
              <div className={styles.previewRow}>
                <span>El cliente paga</span>
                <strong>{formatPeso(clientePaga)}</strong>
              </div>
              <div className={styles.previewRow}>
                <span>Vos recibís</span>
                <strong className={styles.previewGreen}>
                  ~{formatPeso(ownerRecibe)}
                </strong>
              </div>
              <p className={styles.previewNote}>
                {comisionCliente
                  ? `Se redondea a $${ROUND_STEP} para un monto limpio.`
                  : `Mercado Pago descuenta ~${MP_FEE_PERCENT}% del cobro.`}
              </p>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          {hasConfigChanges && (
            <button
              type="button"
              className={`${styles.saveBtn} ${saved ? styles.saveBtnSaved : ''}`}
              onClick={handleSaveConfig}
              disabled={saving}
            >
              {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
            </button>
          )}
          {saved && !hasConfigChanges && (
            <span className={styles.savedMsg}>Cambios guardados</span>
          )}

          {/* ── Mercado Pago ── */}
          <div className={styles.mpSection}>
            <label className={styles.groupLabel}>Cuenta de cobro</label>
            {initialMpLinked ? (
              <div className={styles.mpLinked}>
                <img
                  src="/images/mercadopago-logo.svg"
                  alt="Mercado Pago"
                  className={styles.mpLogo}
                />
                <div className={styles.mpLinkedInfo}>
                  <span className={styles.mpLinkedLabel}>Mercado Pago</span>
                  <span className={styles.mpLinkedBadge}>
                    <span className={styles.mpDot} />
                    Vinculada
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.mpUnlinked}>
                <div className={styles.mpUnlinkedTop}>
                  <img
                    src="/images/mercadopago-logo.svg"
                    alt="Mercado Pago"
                    className={styles.mpLogoLg}
                  />
                  <div>
                    <p className={styles.mpUnlinkedTitle}>Vincular Mercado Pago</p>
                    <p className={styles.mpUnlinkedDesc}>
                      Conectá tu cuenta para recibir las señas automáticamente.
                    </p>
                  </div>
                </div>
                {clientId ? (
                  <button
                    type="button"
                    onClick={handleMpConnect}
                    className={styles.mpConnectBtn}
                  >
                    Vincular cuenta
                  </button>
                ) : (
                  <p className={styles.error}>Mercado Pago no configurado</p>
                )}
              </div>
            )}
          </div>

          {/* ── Historial ── */}
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
                          <span className={styles.historialNombre}>
                            {p.cliente_nombre}
                          </span>
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
                  <div className={styles.historialTotal}>
                    <span>Total recibido</span>
                    <strong>
                      {formatPeso(pagos.reduce((s, p) => s + p.monto, 0))}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
