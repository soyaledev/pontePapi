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

type ModalMode = 'add' | Service;

export function ServiciosSection({
  barbershopId,
  services: initialServices,
}: {
  barbershopId: string;
  services: Service[];
}) {
  const [services, setServices] = useState(initialServices);
  const [modalService, setModalService] = useState<ModalMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', duracion_min: '' });

  const isEdit = modalService !== null && modalService !== 'add';
  const isAdd = modalService === 'add';

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalService(null);
    }
    if (modalService) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [modalService]);

  function openAddModal() {
    setModalService('add');
    setForm({ name: '', price: '', duracion_min: '30' });
  }

  function openEditModal(s: Service) {
    setModalService(s);
    setForm({
      name: s.name,
      price: s.price.toString(),
      duracion_min: s.duracion_min.toString(),
    });
  }

  function closeModal() {
    if (!loading) setModalService(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formatServiceName(form.name),
        price: parsePesoInput(form.price),
        duracion_min: Math.min(120, Math.max(5, parseInt(form.duracion_min, 10) || 30)),
      };
      if (isAdd) {
        const { data, error } = await supabase
          .from('services')
          .insert({ barbershop_id: barbershopId, ...payload })
          .select()
          .single();
        if (error) throw error;
        setServices((s) => [...s, data]);
      } else if (isEdit) {
        const { data, error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', modalService.id)
          .select()
          .single();
        if (error) throw error;
        setServices((s) => s.map((x) => (x.id === data.id ? data : x)));
      }
      setModalService(null);
      dispatchPanelVisibilityUpdate();
    } catch {
      // Error
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
      <button onClick={openAddModal} className={styles.addBtn}>
        + Agregar servicio
      </button>

      {modalService && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="servicio-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="servicio-modal-title" className={styles.modalTitle}>
              {isAdd ? 'Agregar servicio' : 'Editar servicio'}
            </h3>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <label htmlFor="servicio-name" className={styles.modalLabel}>
                Nombre
              </label>
              <input
                id="servicio-name"
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value.slice(0, 50) }))
                }
                className={styles.input}
                maxLength={50}
                required
              />
              <label htmlFor="servicio-price" className={styles.modalLabel}>
                Precio
              </label>
              <input
                id="servicio-price"
                type="text"
                inputMode="numeric"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                className={styles.input}
                placeholder="ej: 13.000 o $5000"
                required
              />
              <label htmlFor="servicio-duracion" className={styles.modalLabel}>
                Duración (5-120 min)
              </label>
              <input
                id="servicio-duracion"
                type="number"
                value={form.duracion_min}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duracion_min: e.target.value }))
                }
                className={styles.input}
                min={5}
                max={120}
                required
              />
              <div className={styles.formActions}>
                <button type="submit" disabled={loading}>
                  {loading
                    ? 'Guardando...'
                    : isAdd
                      ? 'Agregar'
                      : 'Guardar'}
                </button>
                <button type="button" onClick={closeModal} disabled={loading}>
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
