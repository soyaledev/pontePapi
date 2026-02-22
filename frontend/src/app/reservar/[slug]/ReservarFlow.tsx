'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import styles from './ReservarFlow.module.css';

type Barberia = {
  id: string;
  name: string;
  slug: string;
  barberos: string[] | null;
  slot_minutes: number;
  requiere_sena?: boolean;
  monto_sena?: number;
};

type Service = {
  id: string;
  name: string;
  price: number;
  duracion_min: number;
};

type Schedule = {
  day_of_week: number;
  open_time: string;
  close_time: string;
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getSlotsForDate(
  schedules: Schedule[],
  date: Date,
  nroBarberos: number,
  takenCount: Record<string, number>,
  slotMinutes: number
): string[] {
  const day = date.getDay();
  const s = schedules.find((x) => x.day_of_week === day);
  if (!s) return [];
  const open = timeToMinutes(s.open_time.slice(0, 5));
  const close = timeToMinutes(s.close_time.slice(0, 5));
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const sameDay = isSameDay(date, now);

  const slots: string[] = [];
  for (let m = open; m + slotMinutes <= close; m += slotMinutes) {
    if (sameDay && m <= nowMinutes) continue;
    const t = minutesToTime(m);
    const key = normalizeSlot(t);
    const count = takenCount[key] ?? takenCount[t] ?? 0;
    if (count < nroBarberos) slots.push(t);
  }
  return slots;
}

function getNextDays(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

/** Fecha en YYYY-MM-DD según hora local (evita bugs de timezone con toISOString) */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Normaliza slot_time a HH:MM:00 para comparación consistente con la base de datos */
function normalizeSlot(slot: string): string {
  const s = String(slot ?? '');
  const match = s.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}:00`;
  }
  return s.slice(0, 8) || s;
}

export function ReservarFlow({
  barbershop,
  services,
}: {
  barbershop: Barberia;
  services: Service[];
}) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [instagram, setInstagram] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [takenBySlot, setTakenBySlot] = useState<Record<string, number>>({});
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    supabase
      .from('schedules')
      .select('day_of_week, open_time, close_time')
      .eq('barbershop_id', barbershop.id)
      .then(({ data }) => setSchedules(data ?? []));
  }, [barbershop.id]);

  useEffect(() => {
    if (!fecha) return;
    supabase
      .from('appointments')
      .select('slot_time')
      .eq('barbershop_id', barbershop.id)
      .eq('fecha', fecha)
      .in('estado', ['pending', 'pending_payment', 'confirmed'])
      .then(({ data }) => {
        const count: Record<string, number> = {};
        (data ?? []).forEach((r) => {
          const t = normalizeSlot(r.slot_time);
          count[t] = (count[t] ?? 0) + 1;
        });
        setTakenBySlot(count);
      });
  }, [fecha, barbershop.id, fetchTrigger]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
        setFetchTrigger((n) => n + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [router]);

  const slotMinutes = service?.duracion_min ?? barbershop.slot_minutes ?? 30;

  const dateForSlots = fecha ? new Date(fecha + 'T12:00:00') : null;

  const nroBarberos = Math.max(1, barbershop.barberos?.length ?? 1);
  const availableSlots = fecha && dateForSlots
    ? getSlotsForDate(
        schedules,
        dateForSlots,
        nroBarberos,
        takenBySlot,
        slotMinutes
      )
    : [];

  const nextDays = getNextDays(28).filter((d) => {
    const day = d.getDay();
    return schedules.some((s) => s.day_of_week === day);
  });

  const requiereSena =
    barbershop.requiere_sena && (barbershop.monto_sena ?? 0) > 0;

  async function handleConfirm() {
    if (!service || !fecha || !slot || !nombre.trim() || !telefono.trim()) {
      setError('Completá todos los datos');
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (requiereSena) {
        const { data: appointment, error: insertError } = await supabase
          .from('appointments')
          .insert({
            barbershop_id: barbershop.id,
            service_id: service.id,
            fecha,
            slot_time: slot,
            cliente_nombre: nombre.trim(),
            cliente_telefono: telefono.trim(),
            cliente_instagram: instagram.trim() || null,
            estado: 'pending_payment',
          })
          .select('id')
          .single();
        if (insertError) throw insertError;
        if (!appointment) throw new Error('Error al crear turno');

        const frontendUrl =
          typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_VERCEL_URL
              ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
              : 'http://localhost:3000';

        const res = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: appointment.id,
            barbershopId: barbershop.id,
            amount: barbershop.monto_sena ?? 0,
            description: `Seña - ${service.name} - ${barbershop.name}`,
            backUrlSuccess: `${frontendUrl}/reservar/confirmado?barberia=${encodeURIComponent(barbershop.name)}&fecha=${fecha}&hora=${slot}&slug=${encodeURIComponent(barbershop.slug)}`,
            backUrlFailure: `${frontendUrl}/reservar/error?slug=${encodeURIComponent(barbershop.slug)}&appointmentId=${encodeURIComponent(appointment.id)}`,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          if (res.status === 400 && json.error?.includes('vinculada')) {
            throw new Error('Esta barbería aún no configuró los pagos. Contactá a la barbería.');
          }
          throw new Error(json.error ?? 'Error al crear pago');
        }
        if (json.init_point) {
          window.location.href = json.init_point;
          return;
        }
        throw new Error('Error al crear pago');
      } else {
        const { error } = await supabase.from('appointments').insert({
          barbershop_id: barbershop.id,
          service_id: service.id,
          fecha,
          slot_time: slot,
          cliente_nombre: nombre.trim(),
          cliente_telefono: telefono.trim(),
          cliente_instagram: instagram.trim() || null,
          estado: 'confirmed',
        });
        if (error) throw error;
        window.location.href = `/reservar/confirmado?barberia=${encodeURIComponent(barbershop.name)}&fecha=${fecha}&hora=${slot}`;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al reservar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={`/barberia/${barbershop.slug}`} className={styles.back}>
          Volver
        </Link>
      </header>
      <div className={styles.body}>
        <h1 className={styles.title}>Reservar en {barbershop.name}</h1>
        <p className={styles.stepIndicator}>
          {step === 1 && 'Paso 1: Servicio'}
          {step === 2 && 'Paso 2: Fecha'}
          {step === 3 && 'Paso 3: Horario'}
          {step === 4 && 'Paso 4: Tus datos'}
        </p>
        {step === 1 && (
        <div className={styles.step}>
          <h2>Elegí el servicio</h2>
          <ul className={styles.serviceList}>
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setService(s);
                    setStep(2);
                  }}
                  className={styles.serviceBtn}
                >
                  <span>{s.name}</span>
                  <span className={styles.price}>${s.price}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 2 && (
        <div className={styles.step}>
          <h2>Elegí la fecha</h2>
          <div className={styles.dateGrid}>
            {nextDays.map((d) => {
              const dStr = toLocalDateStr(d);
              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => {
                    setFecha(dStr);
                    setSlot(null);
                    setStep(3);
                  }}
                  className={styles.dateBtn}
                >
                  {d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => setStep(1)} className={styles.backStep}>
            Atrás
          </button>
        </div>
      )}

      {step === 3 && (
        <div className={styles.step}>
          <h2>Elegí el horario</h2>
          <p className={styles.fechaLabel}>
            {fecha && new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className={styles.slotGrid}>
            {availableSlots.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setSlot(t);
                  setStep(4);
                }}
                className={styles.slotBtn}
              >
                {t.slice(0, 5)}
              </button>
            ))}
          </div>
          {availableSlots.length === 0 && <p className={styles.empty}>No hay horarios disponibles</p>}
          <button type="button" onClick={() => setStep(2)} className={styles.backStep}>
            Atrás
          </button>
        </div>
      )}

      {step === 4 && (
        <div className={styles.step}>
          <h2>Tus datos</h2>
          <p className={styles.resumen}>
            {service?.name} · {fecha} {slot?.slice(0, 5)}
          </p>
          {barbershop.requiere_sena && (barbershop.monto_sena ?? 0) > 0 && (
            <p className={styles.resumen}>
              Seña a pagar: ${barbershop.monto_sena}
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className={styles.form}
          >
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={styles.input}
              required
            />
            <input
              type="tel"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={styles.input}
              required
            />
            <input
              type="text"
              placeholder="Instagram (opcional)"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className={styles.input}
              autoComplete="off"
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.confirmBtn} disabled={loading}>
              {loading
                ? requiereSena
                  ? 'Redirigiendo a pago...'
                  : 'Reservando...'
                : requiereSena
                  ? 'Pagar seña y reservar'
                  : 'Confirmar turno'}
            </button>
          </form>
          <button type="button" onClick={() => setStep(3)} className={styles.backStep}>
            Atrás
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
