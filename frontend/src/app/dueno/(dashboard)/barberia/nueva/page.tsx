'use client';

import { useState } from 'react';
import { toTitleCase, formatAddress, formatPesoInput } from '@/lib/format';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { PhotoUpload } from '@/components/PhotoUpload';
import { SenaComisionesInfo } from '@/components/SenaComisionesInfo';
import styles from './NuevaBarberia.module.css';

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() || 'barberia'
  ) + '-' + Math.random().toString(36).slice(2, 10);
}

export default function NuevaBarberiaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    barberos: [''] as string[],
    address: '',
    city: '',
    phone: '',
    photo_url: '',
    requiere_sena: false,
    monto_sena: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const barberos = form.barberos.map((n) => n.trim()).filter(Boolean);
    if (barberos.length === 0) {
      setError('Agregá al menos un barbero');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No estás logueado');

      const slug = generateSlug(form.name);

      if (!form.photo_url.trim()) {
        setError('La foto es obligatoria');
        setLoading(false);
        return;
      }
      const phoneOnly = form.phone.replace(/\D/g, '').slice(0, 10);
      const { error } = await supabase.from('barbershops').insert({
        owner_id: user.id,
        name: form.name.trim(),
        barberos,
        slug,
        address: form.address.trim() ? formatAddress(form.address.trim()) : null,
        city: form.city.trim() ? toTitleCase(form.city.trim()) : null,
        phone: phoneOnly || null,
        photo_url: form.photo_url.trim() || null,
        requiere_sena: form.requiere_sena,
        monto_sena: form.requiere_sena ? parseFloat(form.monto_sena) || 0 : 0,
      });

      if (error) throw error;
      router.push(`/dueno/barberia/${slug}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link href="/dueno/dashboard" className={styles.back}>
        ← Volver
      </Link>
      <h1 className={styles.title}>Nueva barbería</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Nombre de la barbería *
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={styles.input}
            required
            placeholder="Ej: Barbería Don Juan"
          />
        </label>
        <div className={styles.label}>
          <span className={styles.fieldLabel}>Barberos *</span>
          {form.barberos.map((_, i) => (
            <div key={i} className={styles.employeeRow}>
              <input
                type="text"
                value={form.barberos[i]}
                onChange={(e) => {
                  const next = [...form.barberos];
                  next[i] = e.target.value;
                  setForm((f) => ({ ...f, barberos: next }));
                }}
                className={styles.input}
                placeholder="Nombre del barbero"
                required={i === 0}
              />
              <button
                type="button"
                onClick={() =>
                  form.barberos.length > 1 &&
                  setForm((f) => ({
                    ...f,
                    barberos: f.barberos.filter((_, j) => j !== i),
                  }))
                }
                className={styles.removeEmployee}
                aria-label="Quitar"
                disabled={form.barberos.length === 1}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({ ...f, barberos: [...f.barberos, ''] }))
            }
            className={styles.addEmployee}
          >
            + Agregar barbero
          </button>
        </div>
        <label className={styles.label}>
          Dirección
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className={styles.input}
            placeholder="Calle, número o link de Google Maps"
          />
          <span className={styles.hint}>
            Para mejorar que se encuentre la barbería, podés pegar un link de Google Maps
          </span>
        </label>
        <label className={styles.label}>
          Ciudad
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className={styles.input}
            placeholder="Buenos Aires"
          />
        </label>
        <label className={styles.label}>
          Teléfono (máx. 10 números)
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 10);
              setForm((f) => ({ ...f, phone: v }));
            }}
            className={styles.input}
            placeholder="1112345678"
            maxLength={12}
          />
        </label>
        <div className={styles.label}>
          <PhotoUpload
            value={form.photo_url}
            onChange={(url) => setForm((f) => ({ ...f, photo_url: url }))}
            label="Foto (portada / logo) *"
            required
          />
        </div>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={form.requiere_sena}
            onChange={(e) => setForm((f) => ({ ...f, requiere_sena: e.target.checked }))}
          />
          Requiere seña
        </label>
        {form.requiere_sena && (
          <>
            <label className={styles.label}>
              Monto seña (ARS)
              <div className={styles.senaInputWrap}>
                <span className={styles.senaPrefix}>$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.monto_sena ? formatPesoInput(form.monto_sena) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setForm((f) => ({ ...f, monto_sena: raw }));
                  }}
                  className={styles.input}
                  placeholder="1.500"
                />
              </div>
            </label>
            <SenaComisionesInfo monto={parseFloat(form.monto_sena) || 0} />
          </>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? 'Creando...' : 'Crear barbería'}
        </button>
      </form>
    </div>
  );
}
