'use client';

import { useState } from 'react';
import { toTitleCase, isGoogleMapsLink } from '@/lib/format';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { PhotoUpload } from '@/components/PhotoUpload';
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

export function NuevaBarberiaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    barbers: [{ id: '', name: '', photo_url: '' }] as { id: string; name: string; photo_url: string }[],
    address: '',
    city: '',
    phone: '',
    photo_url: '',
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
      const addressTrimmed = form.address.trim();
      if (!addressTrimmed) {
        setError('La ubicación es obligatoria');
        setLoading(false);
        return;
      }
      if (!isGoogleMapsLink(addressTrimmed)) {
        setError('La ubicación debe ser un link de Google Maps (ej: maps.google.com o goo.gl/maps)');
        setLoading(false);
        return;
      }
      if (!form.city.trim()) {
        setError('La ciudad es obligatoria');
        setLoading(false);
        return;
      }
      const phoneOnly = form.phone.replace(/\D/g, '').slice(0, 10);
      if (phoneOnly.length < 6) {
        setError('El teléfono es obligatorio (mín. 6 números)');
        setLoading(false);
        return;
      }
      const { data: newShop, error: shopError } = await supabase
        .from('barbershops')
        .insert({
          owner_id: user.id,
          name: form.name.trim(),
          barberos: [],
          slug,
          address: addressTrimmed,
          city: toTitleCase(form.city.trim()),
          phone: phoneOnly,
          photo_url: form.photo_url.trim() || null,
        })
        .select('id')
        .single();

      if (shopError) throw shopError;
      if (!newShop) throw new Error('Error al crear barbería');

      for (let i = 0; i < validBarbers.length; i++) {
        const b = validBarbers[i];
        await supabase.from('barbers').insert({
          barbershop_id: newShop.id,
          name: b.name,
          photo_url: b.photo_url || null,
          order: i,
        });
      }

      router.push(`/dueno/barberia/${slug}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear barbería');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link href="/dueno/dashboard" className={styles.back}>
        ← Volver
      </Link>
      <h1 className={styles.title}>Registrar barbería</h1>
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
            label="Foto (portada / logo) *"
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? 'Creando...' : 'Crear barbería'}
        </button>
      </form>
    </div>
  );
}
