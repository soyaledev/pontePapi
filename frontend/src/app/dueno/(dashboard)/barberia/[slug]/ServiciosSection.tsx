'use client';

import { useState, useEffect } from 'react';
import { formatPeso, formatServiceName, parsePesoInput } from '@/lib/format';
import { supabase } from '@/lib/supabase/client';
import { dispatchPanelVisibilityUpdate } from './VisibilityNotice';
import styles from './ServiciosSection.module.css';

type Service = {
  id: string;
  name: string;
  price: number;
  duracion_min: number;
};

export function ServiciosSection({
  barbershopId,
  services: initialServices,
}: {
  barbershopId: string;
  services: Service[];
}) {
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', duracion_min: '' });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', duracion_min: '' });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setEditingService(null);
    }
    if (editingService) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [editingService]);

  function openEditModal(s: Service) {
    setEditingService(s);
    setEditForm({
      name: s.name,
      price: s.price.toString(),
      duracion_min: s.duracion_min.toString(),
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    if (!editingService) return;
    e.preventDefault();
    setEditLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .update({
          name: formatServiceName(editForm.name),
          price: parsePesoInput(editForm.price),
          duracion_min: Math.min(120, Math.max(5, parseInt(editForm.duracion_min, 10) || 30)),
        })
        .eq('id', editingService.id)
        .select()
        .single();
      if (error) throw error;
      setServices((s) => s.map((x) => (x.id === data.id ? data : x)));
      setEditingService(null);
      dispatchPanelVisibilityUpdate();
    } catch {
      // Error al actualizar
    } finally {
      setEditLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('services').insert({
        barbershop_id: barbershopId,
        name: formatServiceName(form.name),
        price: parsePesoInput(form.price),
        duracion_min: Math.min(120, Math.max(5, parseInt(form.duracion_min, 10) || 30)),
      }).select().single();
      if (error) throw error;
      setServices((s) => [...s, data]);
      setForm({ name: '', price: '', duracion_min: '' });
      setShowForm(false);
      dispatchPanelVisibilityUpdate();
    } catch {
      // Error al agregar servicio
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (!error) {
      setServices((s) => s.filter((x) => x.id !== id));
      dispatchPanelVisibilityUpdate();
    }
  }

  return (
    <section className={styles.section}>
      <h2>Servicios</h2>
      <ul className={styles.list}>
        {services.map((s) => (
          <li key={s.id} className={styles.item}>
            <div
              className={styles.itemContent}
              role="button"
              tabIndex={0}
              onClick={() => openEditModal(s)}
              onKeyDown={(e) =>
                (e.key === 'Enter' || e.key === ' ') &&
                (e.preventDefault(), openEditModal(s))
              }
              aria-label={`Editar ${s.name}`}
            >
              <span className={styles.itemName}>{s.name}</span>
              <span className={styles.itemPrice}>{formatPeso(s.price)}</span>
              <span className={styles.itemDur}>{s.duracion_min} min</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(s.id);
              }}
              className={styles.delete}
              aria-label={`Eliminar ${s.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {showForm ? (
        <form onSubmit={handleAdd} className={styles.form}>
          <input
            type="text"
            placeholder="Nombre (máx 50 caracteres)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.slice(0, 50) }))}
            className={styles.input}
            maxLength={50}
            required
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Precio (ej: 13.000 o $5000)"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className={styles.input}
            required
          />
          <input
            type="number"
            placeholder="Duración (5-120 min)"
            value={form.duracion_min}
            onChange={(e) => setForm((f) => ({ ...f, duracion_min: e.target.value }))}
            className={styles.input}
            min={5}
            max={120}
            required
          />
          <div className={styles.formActions}>
            <button type="submit" disabled={loading}>
              {loading ? '...' : 'Agregar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className={styles.addBtn}>
          + Agregar servicio
        </button>
      )}

      {editingService && (
        <div
          className={styles.modalOverlay}
          onClick={() => !editLoading && setEditingService(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-servicio-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="edit-servicio-title" className={styles.modalTitle}>
              Editar servicio
            </h3>
            <form onSubmit={handleUpdate} className={styles.modalForm}>
              <label htmlFor="edit-name" className={styles.modalLabel}>
                Nombre
              </label>
              <input
                id="edit-name"
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value.slice(0, 50) }))
                }
                className={styles.input}
                maxLength={50}
                required
              />
              <label htmlFor="edit-price" className={styles.modalLabel}>
                Precio
              </label>
              <input
                id="edit-price"
                type="text"
                inputMode="numeric"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, price: e.target.value }))
                }
                className={styles.input}
                placeholder="ej: 13.000 o $5000"
                required
              />
              <label htmlFor="edit-duracion" className={styles.modalLabel}>
                Duración (5-120 min)
              </label>
              <input
                id="edit-duracion"
                type="number"
                value={editForm.duracion_min}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, duracion_min: e.target.value }))
                }
                className={styles.input}
                min={5}
                max={120}
                required
              />
              <div className={styles.formActions}>
                <button type="submit" disabled={editLoading}>
                  {editLoading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => !editLoading && setEditingService(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
