'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import styles from './Configuracion.module.css';

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function ConfiguracionClient({
  userEmail,
  hasMpLinked,
}: {
  userEmail: string;
  hasMpLinked: boolean;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess('Contraseña actualizada.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar contraseña');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleUnlinkMp() {
    setMpError('');
    setMpLoading(true);
    try {
      const res = await fetch('/api/dueno/desvincular-mp', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error');
      window.location.reload();
    } catch (err) {
      setMpError(err instanceof Error ? err.message : 'Error al desvincular');
    } finally {
      setMpLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError('');
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/dueno/eliminar-cuenta', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error');
      await supabase.auth.signOut();
      window.location.href = '/dueno/login';
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Correo</h2>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Email</span>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>{userEmail}</p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cambiar contraseña</h2>
        <form onSubmit={handleChangePassword}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="new-password">
              Nueva contraseña
            </label>
            <div className={styles.inputWrap}>
              <input
                id="new-password"
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowNewPass((s) => !s)}
                aria-label={showNewPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <EyeIcon show={!showNewPass} />
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="confirm-password">
              Confirmar contraseña
            </label>
            <div className={styles.inputWrap}>
              <input
                id="confirm-password"
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="Repetí la contraseña"
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirmPass((s) => !s)}
                aria-label={showConfirmPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <EyeIcon show={!showConfirmPass} />
              </button>
            </div>
          </div>
          {passwordError && <p className={styles.error}>{passwordError}</p>}
          {passwordSuccess && <p className={styles.success}>{passwordSuccess}</p>}
          <button
            type="submit"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={passwordLoading || !newPassword || !confirmPassword}
          >
            {passwordLoading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>

      {hasMpLinked && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Mercado Pago</h2>
          <p className={styles.warning}>
            Tenés una cuenta de Mercado Pago vinculada. Si la desvinculás, no podrás recibir señas hasta que la vuelvas a vincular.
          </p>
          {mpError && <p className={styles.error}>{mpError}</p>}
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={handleUnlinkMp}
            disabled={mpLoading}
          >
            {mpLoading ? 'Desvinculando...' : 'Desvincular Mercado Pago'}
          </button>
        </section>
      )}

      <section className={`${styles.section} ${styles.dangerZoneSubtle}`}>
        <p className={styles.dangerZoneText}>
          Esta acción es irreversible. Se eliminarán todas tus barberías, turnos y datos asociados de forma permanente.
        </p>
        {deleteError && <p className={styles.error}>{deleteError}</p>}
        <button
          type="button"
          className={styles.btnLinkDanger}
          onClick={() => setDeleteModalOpen(true)}
        >
          Eliminar mi cuenta
        </button>
      </section>

      {deleteModalOpen && (
        <div className={styles.modalOverlay} onClick={() => !deleteLoading && setDeleteModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>¿Eliminar cuenta?</h3>
            <p className={styles.modalText}>
              Se eliminarán todos tus datos de forma permanente: barberías, barberos, turnos y reservas. No se puede deshacer.
            </p>
            {deleteError && <p className={styles.error}>{deleteError}</p>}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalBtnCancel}
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.modalBtnConfirm}
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Eliminando...' : 'Sí, eliminar todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
