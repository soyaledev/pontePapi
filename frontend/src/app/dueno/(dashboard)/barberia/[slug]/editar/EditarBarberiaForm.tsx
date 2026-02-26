'use client';

import { useState } from 'react';
import { toTitleCase, formatAddress, formatPesoInput } from '@/lib/format';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { PhotoUpload } from '@/components/PhotoUpload';
import { SenaComisionesInfo } from '@/components/SenaComisionesInfo';
import styles from '../../nueva/NuevaBarberia.module.css';

type Barber = { id: string; name: string; photo_url: string };

type Barberia = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  photo_url: string | null;
  requiere_sena: boolean;
  monto_sena: string;
};

export function EditarBarberiaForm({
  barbershop,
  initialBarbers,
}: {
  barbershop: Barberia;
  initialBarbers: Barber[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: barbershop.name,
    barbers: initialBarbers,
    address: barbershop.address ?? '',
    city: barbershop.city ?? '',
    phone: barbershop.phone ?? '',
    photo_url: barbershop.photo_url ?? '',
    requiere_sena: barbershop.requiere_sena,
    monto_sena: barbershop.monto_sena,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const validBarbers = form.barbers
      .map((b) => ({ ...b, name: b.name.trim() }))
      .filter((b) => b.name);
    if (validBarbers.length === 0) {
      setError('Agregá al menos un barbero');
      return;
    }
    if (!form.photo_url.trim()) {
      setError('La foto de la barbería es obligatoria');
      return;
    }
    setLoading(true);
    try {
      const phoneOnly = form.phone.replace(/\D/g, '').slice(0, 10);
      const { error: shopError } = await supabase
        .from('barbershops')
        .update({
          name: form.name.trim(),
          address: form.address.trim() ? formatAddress(form.address.trim()) : null,
          city: form.city.trim() ? toTitleCase(form.city.trim()) : null,
          phone: phoneOnly || null,
          photo_url: form.photo_url.trim() || null,
          requiere_sena: form.requiere_sena,
          monto_sena: form.requiere_sena ? parseFloat(form.monto_sena) || 0 : 0,
        })
        .eq('id', barbershop.id);

      if (shopError) throw shopError;

      const existingIds = new Set(form.barbers.filter((b) => b.id).map((b) => b.id));
      const currentValidIds = new Set(validBarbers.filter((b) => b.id).map((b) => b.id));

      const toDelete = Array.from(existingIds).filter((id) => !currentValidIds.has(id));
      for (const id of toDelete) {
        await supabase.from('barbers').delete().eq('id', id);
      }

      for (let i = 0; i < validBarbers.length; i++) {
        const b = validBarbers[i];
        if (b.id) {
          await supabase
            .from('barbers')
            .update({ name: b.name, photo_url: b.photo_url || null, order: i })
            .eq('id', b.id);
        } else {
          await supabase.from('barbers').insert({
            barbershop_id: barbershop.id,
            name: b.name,
            photo_url: b.photo_url || null,
            order: i,
          });
        }
      }

      router.push(`/dueno/barberia/${barbershop.slug}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link href={`/dueno/barberia/${barbershop.slug}`} className={styles.back}>
        ← Volver
      </Link>
      <h1 className={styles.title}>Editar barbería</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Nombre de la barbería *
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={styles.input}
            required
          />
        </label>
        <div className={styles.label}>
          <span className={styles.fieldLabel}>Barberos *</span>
          {form.barbers.map((barber, i) => (
            <div key={barber.id || `new-${i}`} className={styles.barberCard}>
              <div className={styles.barberRow}>
                <input
                  type="text"
                  value={barber.name}
                  onChange={(e) => {
                    const next = [...form.barbers];
                    next[i] = { ...next[i], name: e.target.value };
                    setForm((f) => ({ ...f, barbers: next }));
                  }}
                  className={styles.input}
                  placeholder="Nombre del barbero"
                  required={i === 0}
                />
                <button
                  type="button"
                  onClick={() =>
                    form.barbers.length > 1 &&
                    setForm((f) => ({
                      ...f,
                      barbers: f.barbers.filter((_, j) => j !== i),
                    }))
                  }
                  className={styles.removeEmployee}
                  aria-label="Quitar"
                  disabled={form.barbers.length === 1}
                >
                  ×
                </button>
              </div>
              <div className={styles.barberPhotoWrap}>
                <PhotoUpload
                  value={barber.photo_url}
                  onChange={(url) => {
                    const next = [...form.barbers];
                    next[i] = { ...next[i], photo_url: url };
                    setForm((f) => ({ ...f, barbers: next }));
                  }}
                  barbershopId={barbershop.id}
                  label="Foto"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                barbers: [...f.barbers, { id: '', name: '', photo_url: '' }],
              }))
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
          />
        </label>
        <label className={styles.label}>
          Teléfono (máx. 10 números)
          <input
            type="tel"
            inputMode="numeric"
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
            barbershopId={barbershop.id}
            label="Foto (portada / logo) *"
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
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
