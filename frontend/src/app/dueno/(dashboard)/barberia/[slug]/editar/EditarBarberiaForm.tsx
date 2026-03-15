'use client';

import { useState } from 'react';
import { toTitleCase, isGoogleMapsLink } from '@/lib/format';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { PhotoUpload } from '@/components/PhotoUpload';
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
    address: isGoogleMapsLink(barbershop.address ?? '') ? (barbershop.address ?? '') : '',
    city: barbershop.city ?? '',
    phone: barbershop.phone ?? '',
    photo_url: barbershop.photo_url ?? '',
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
    const addressTrimmed = form.address.trim();
    if (!addressTrimmed) {
      setError('La ubicación es obligatoria');
      return;
    }
    if (!isGoogleMapsLink(addressTrimmed)) {
      setError('La ubicación debe ser un link de Google Maps (ej: maps.google.com o goo.gl/maps)');
      return;
    }
    if (!form.city.trim()) {
      setError('La ciudad es obligatoria');
      return;
    }
    const phoneOnly = form.phone.replace(/\D/g, '').slice(0, 10);
    if (phoneOnly.length < 6) {
      setError('El teléfono es obligatorio (mín. 6 números)');
      return;
    }
    setLoading(true);
    try {
      const { error: shopError } = await supabase
        .from('barbershops')
        .update({
          name: form.name.trim(),
          address: addressTrimmed,
          city: toTitleCase(form.city.trim()),
          phone: phoneOnly,
          photo_url: form.photo_url.trim() || null,
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
          Ubicación *
          <input
            type="url"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className={styles.input}
            placeholder="https://maps.google.com/... o https://goo.gl/maps/..."
            required
          />
          <span className={styles.hint}>
            Pegá el link de Google Maps de tu barbería (Compartir → Copiar enlace)
          </span>
        </label>
        <label className={styles.label}>
          Ciudad *
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className={styles.input}
            placeholder="Buenos Aires"
            required
          />
        </label>
        <label className={styles.label}>
          Teléfono (mín. 6, máx. 10 números) *
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
            minLength={6}
            required
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
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
