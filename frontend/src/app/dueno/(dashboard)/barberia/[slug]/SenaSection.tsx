'use client';

import { useState, useMemo } from 'react';
import { formatPeso, formatPesoInput } from '@/lib/format';
import { supabase } from '@/lib/supabase/client';
import styles from './SenaSection.module.css';

const MP_PERCENT = 10.61;
const ROUND_STEP = 50;

function calcClientePaga(montoNeto: number): number {
  if (montoNeto <= 0) return 0;
  const exacto = montoNeto / (1 - MP_PERCENT / 100);
  return Math.ceil(exacto / ROUND_STEP) * ROUND_STEP;
}

function calcRecibeOwnerAbsorbe(monto: number): number {
  return monto * (1 - MP_PERCENT / 100);
}

export function SenaSection({
  barbershopId,
  initialRequiereSena,
  initialSenaOpcional,
  initialMontoSena,
  initialComisionCliente,
}: {
  barbershopId: string;
  initialRequiereSena: boolean;
  initialSenaOpcional: boolean;
  initialMontoSena: number;
  initialComisionCliente: boolean;
}) {
  const [requiereSena, setRequiereSena] = useState(initialRequiereSena);
  const [senaOpcional, setSenaOpcional] = useState(initialSenaOpcional);
  const [montoRaw, setMontoRaw] = useState(initialMontoSena > 0 ? String(initialMontoSena) : '');
  const [comisionCliente, setComisionCliente] = useState(initialComisionCliente);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const monto = parseInt(montoRaw.replace(/\D/g, ''), 10) || 0;
  const clientePaga = comisionCliente ? calcClientePaga(monto) : monto;
  const ownerRecibe = comisionCliente ? monto : calcRecibeOwnerAbsorbe(monto);

  const hasChanges = useMemo(() => {
    if (requiereSena !== initialRequiereSena) return true;
    if (!requiereSena) return false;
    return (
      senaOpcional !== initialSenaOpcional ||
      monto !== initialMontoSena ||
      comisionCliente !== initialComisionCliente
    );
  }, [requiereSena, senaOpcional, monto, comisionCliente, initialRequiereSena, initialSenaOpcional, initialMontoSena, initialComisionCliente]);

  async function handleSave() {
    setError('');
    if (requiereSena && monto <= 0) {
      setError('Ingresá un monto de seña');
      return;
    }
    setSaving(true);
    const { error: dbError } = await supabase
      .from('barbershops')
      .update({
        requiere_sena: requiereSena,
        sena_opcional: requiereSena ? senaOpcional : false,
        monto_sena: requiereSena ? monto : 0,
        sena_comision_cliente: requiereSena ? comisionCliente : false,
      })
      .eq('id', barbershopId);

    setSaving(false);
    if (dbError) {
      setError('Error al guardar');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Seña</h3>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={requiereSena}
          onChange={(e) => setRequiereSena(e.target.checked)}
        />
        <span>Cobrar seña</span>
      </label>

      {!requiereSena && (
        <p className={styles.hint} style={{ marginTop: '0.4rem' }}>
          Los clientes podrán reservar sin pagar seña.
        </p>
      )}

      {requiereSena && (
        <div className={styles.config}>
          <div className={styles.group}>
            <p className={styles.groupLabel}>Tipo de seña</p>
            <div className={styles.radioGroup}>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name={`sena_tipo_${barbershopId}`}
                  checked={!senaOpcional}
                  onChange={() => setSenaOpcional(false)}
                />
                Obligatoria
              </label>
              <label className={styles.radio}>
                <input
                  type="radio"
                  name={`sena_tipo_${barbershopId}`}
                  checked={senaOpcional}
                  onChange={() => setSenaOpcional(true)}
                />
                Opcional
              </label>
            </div>
            <p className={styles.hint}>
              {senaOpcional
                ? 'El cliente elige si pagar la seña o reservar gratis.'
                : 'El cliente debe pagar la seña para poder reservar.'}
            </p>
          </div>

          <div className={styles.group}>
            <p className={styles.groupLabel}>Monto que querés recibir</p>
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

          <div className={styles.group}>
            <p className={styles.groupLabel}>¿Quién paga la comisión de Mercado Pago?</p>
            <div className={styles.comisionBtns}>
              <button
                type="button"
                className={`${styles.comisionBtn} ${!comisionCliente ? styles.comisionBtnActive : ''}`}
                onClick={() => setComisionCliente(false)}
              >
                Yo (dueño)
              </button>
              <button
                type="button"
                className={`${styles.comisionBtn} ${comisionCliente ? styles.comisionBtnActive : ''}`}
                onClick={() => setComisionCliente(true)}
              >
                El cliente
              </button>
            </div>
          </div>

          {monto > 0 && (
            <div className={styles.preview}>
              {comisionCliente ? (
                <>
                  <div className={styles.previewRow}>
                    <span>El cliente paga</span>
                    <strong>{formatPeso(clientePaga)}</strong>
                  </div>
                  <div className={styles.previewRow}>
                    <span>Vos recibís</span>
                    <strong className={styles.previewGreen}>~{formatPeso(ownerRecibe)}</strong>
                  </div>
                  <p className={styles.previewNote}>
                    Redondeado a ${ROUND_STEP} para un monto limpio. El excedente se suma a la comisión de la plataforma.
                  </p>
                </>
              ) : (
                <>
                  <div className={styles.previewRow}>
                    <span>El cliente paga</span>
                    <strong>{formatPeso(clientePaga)}</strong>
                  </div>
                  <div className={styles.previewRow}>
                    <span>Vos recibís</span>
                    <strong>~{formatPeso(ownerRecibe)}</strong>
                  </div>
                  <p className={styles.previewNote}>
                    Mercado Pago descuenta {MP_PERCENT}% del monto cobrado.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {hasChanges && (
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      )}

      {saved && !hasChanges && (
        <span className={styles.savedMsg}>Cambios guardados</span>
      )}
    </section>
  );
}
