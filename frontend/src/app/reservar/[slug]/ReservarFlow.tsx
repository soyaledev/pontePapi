'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { formatPeso, toTitleCase } from '@/lib/format';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { isAppointmentExpired } from '@/lib/appointments';
import styles from './ReservarFlow.module.css';

type Barber = { id: string; name: string; photo_url: string | null };

type Barberia = {
  id: string;
  name: string;
  slug: string;
  barbers: Barber[];
  slot_minutes: number;
  requiere_sena?: boolean;
  sena_opcional?: boolean;
  monto_sena?: number;
  sena_comision_cliente?: boolean;
};

const MP_PERCENT = 10.61;
function calcClientePaga(montoNeto: number, comisionCliente: boolean): number {
  if (!comisionCliente || montoNeto <= 0) return montoNeto;
  const exacto = montoNeto / (1 - MP_PERCENT / 100);
  return Math.ceil(exacto / 50) * 50;
}

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

/** Slots disponibles para una fecha según disponibilidad de UN barbero */
function getSlotsForBarber(
  schedules: Schedule[],
  date: Date,
  takenByBarber: Set<string>,
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
    if (!takenByBarber.has(key)) slots.push(t);
  }
  return slots;
}

const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

type CalendarDay = { date: Date; isCurrentMonth: boolean; isDisabled: boolean; isToday: boolean };

const MAX_DAYS_AHEAD = 30;

function getCalendarDays(year: number, month: number, schedules: Schedule[]): CalendarDay[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = new Date(first);
  start.setDate(start.getDate() - start.getDay());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
  const openDays = new Set(schedules.map((s) => s.day_of_week));
  const out: CalendarDay[] = [];
  const d = new Date(start);
  while (d <= last) {
    const isCurrentMonth = d.getMonth() === month;
    const isPast = d < today;
    const isBeyondMax = d > maxDate;
    const isClosed = !openDays.has(d.getDay());
    const isDisabled = isPast || isBeyondMax || isClosed;
    const isToday = isSameDay(d, today);
    out.push({ date: new Date(d), isCurrentMonth, isDisabled, isToday });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Fecha en YYYY-MM-DD según hora local */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
  const barbers = barbershop.barbers ?? [];
  const hasBarberStep = barbers.length > 1;

  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(
    barbers.length === 1 ? barbers[0]?.id ?? null : null
  );
  const [effectiveBarberId, setEffectiveBarberId] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [clientePagaSena, setClientePagaSena] = useState(true);
  const [showDetallesSena, setShowDetallesSena] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [takenByBarberByDate, setTakenByBarberByDate] = useState<
    Record<string, Record<string, Set<string>>>
  >({});
  const [takenBySlotNoBarber, setTakenBySlotNoBarber] = useState<
    Record<string, Record<string, number>>
  >({});
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    async function checkOwner() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsOwner(false);
        return;
      }
      const { data } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);
      setIsOwner((data?.length ?? 0) > 0);
    }
    checkOwner();
  }, []);

  const slotMinutes = service?.duracion_min ?? barbershop.slot_minutes ?? 30;
  const tieneSena = barbershop.requiere_sena && (barbershop.monto_sena ?? 0) > 0;
  const senaOpcional = !!(barbershop.sena_opcional && tieneSena);
  const requiereSena = tieneSena && (!senaOpcional || clientePagaSena);
  const montoSena = barbershop.monto_sena ?? 0;
  const comisionCliente = !!barbershop.sena_comision_cliente;
  const senaClientePaga = calcClientePaga(montoSena, comisionCliente);
  const restanteEnLocal = service ? service.price - montoSena : 0;

  const stepBarbero = 2;
  const stepFecha = 3;
  const stepDatos = 4;

  useEffect(() => {
    supabase
      .from('schedules')
      .select('day_of_week, open_time, close_time')
      .eq('barbershop_id', barbershop.id)
      .then(({ data }) => setSchedules(data ?? []));
  }, [barbershop.id]);

  useEffect(() => {
    const first = new Date(calendarMonth.year, calendarMonth.month, 1);
    const last = new Date(calendarMonth.year, calendarMonth.month + 1, 0);
    const startStr = toLocalDateStr(first);
    const endStr = toLocalDateStr(last);

    supabase
      .from('appointments')
      .select('fecha, slot_time, barber_id, estado, created_at')
      .eq('barbershop_id', barbershop.id)
      .gte('fecha', startStr)
      .lte('fecha', endStr)
      .in('estado', ['pending', 'pending_payment', 'confirmed'])
      .then(({ data }) => {
        const byDateBarber: Record<string, Record<string, Set<string>>> = {};
        const byDateSlot: Record<string, Record<string, number>> = {};
        for (const a of data ?? []) {
          // pending_payment expirado (>15 min) no bloquea el slot
          if (a.estado === 'pending_payment' && isAppointmentExpired(a)) continue;
          const slot = normalizeSlot(a.slot_time);
          if (!byDateSlot[a.fecha]) byDateSlot[a.fecha] = {};
          byDateSlot[a.fecha][slot] = (byDateSlot[a.fecha][slot] ?? 0) + 1;
          if (a.barber_id) {
            if (!byDateBarber[a.fecha]) byDateBarber[a.fecha] = {};
            if (!byDateBarber[a.fecha][a.barber_id]) byDateBarber[a.fecha][a.barber_id] = new Set();
            byDateBarber[a.fecha][a.barber_id].add(slot);
          }
        }
        setTakenByBarberByDate(byDateBarber);
        setTakenBySlotNoBarber(byDateSlot);
      });
  }, [barbershop.id, calendarMonth.year, calendarMonth.month, fetchTrigger]);

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

  useEffect(() => {
    if (!modalDate) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalDate(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modalDate]);

  useEffect(() => {
    if (step === stepFecha && fecha) {
      const d = new Date(fecha + 'T12:00:00');
      setCalendarMonth({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [step, fecha]);

  // Scroll al inicio cuando cambia el paso del flujo (useLayoutEffect para que ocurra antes del paint)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const calendarDays = getCalendarDays(calendarMonth.year, calendarMonth.month, schedules);

  function getSlotsForModalDate(dateStr: string): { slots: string[]; barberId: string | null } {
    const date = new Date(dateStr + 'T12:00:00');

    if (barbers.length === 0) {
      const takenCount = takenBySlotNoBarber[dateStr] ?? {};
      const allSlots = getSlotsForBarber(schedules, date, new Set(), slotMinutes);
      const slots = allSlots.filter((t) => (takenCount[normalizeSlot(t)] ?? 0) === 0);
      return { slots, barberId: null };
    }

    const takenForDate = takenByBarberByDate[dateStr] ?? {};
    let barberId: string | null = null;
    let takenSet: Set<string> = new Set();

    if (selectedBarberId) {
      barberId = selectedBarberId;
      takenSet = takenForDate[selectedBarberId] ?? new Set();
    } else {
      let minCount = Infinity;
      for (const b of barbers) {
        const taken = takenForDate[b.id] ?? new Set();
        if (taken.size < minCount) {
          minCount = taken.size;
          barberId = b.id;
          takenSet = taken;
        }
      }
    }

    const slots = getSlotsForBarber(schedules, date, takenSet, slotMinutes);
    return { slots, barberId };
  }

  const modalSlots = modalDate ? getSlotsForModalDate(modalDate) : null;

  function handleDayClick(dStr: string) {
    setModalDate(dStr);
  }

  function handleSlotSelect(dateStr: string, slotTime: string, barberId: string | null) {
    setFecha(dateStr);
    setSlot(normalizeSlot(slotTime));
    setEffectiveBarberId(barberId);
    setModalDate(null);
  }

  function getBarberIdForConfirm(): string | null {
    if (selectedBarberId) return selectedBarberId;
    return effectiveBarberId;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleConfirm() {
    if (isOwner) return;
    if (!service || !fecha || !slot || !email.trim() || !nombre.trim() || !telefono.trim()) {
      setError('Completá todos los datos');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Ingresá un correo electrónico válido');
      return;
    }
    if (nombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 letras');
      return;
    }
    if (nombre.trim().length > 40) {
      setError('El nombre no puede tener más de 40 letras');
      return;
    }
    const telDigits = telefono.replace(/\D/g, '');
    if (telDigits.length < 6 || telDigits.length > 10) {
      setError('El teléfono debe tener entre 6 y 10 números');
      return;
    }
    setError('');
    setLoading(true);

    const barberId = getBarberIdForConfirm();

    try {
      if (requiereSena) {
        const { data: appointment, error: insertError } = await supabase
          .from('appointments')
          .insert({
            barbershop_id: barbershop.id,
            service_id: service.id,
            fecha,
            slot_time: slot,
            barber_id: barberId,
            cliente_nombre: toTitleCase(nombre.trim()),
            cliente_telefono: telefono.trim(),
            cliente_email: email.trim() || null,
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
            description: `Seña - ${service.name} - ${barbershop.name}`,
            backUrlSuccess: `${frontendUrl}/reservar/confirmado?appointmentId=${encodeURIComponent(appointment.id)}`,
            backUrlFailure: `${frontendUrl}/reservar/error?slug=${encodeURIComponent(barbershop.slug)}&appointmentId=${encodeURIComponent(appointment.id)}`,
          }),
        });

        const json = await res.json();
        // #region agent log
        fetch('http://127.0.0.1:7939/ingest/ce6f701b-fd9f-484e-a36c-bf6777e06b66',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'871633'},body:JSON.stringify({sessionId:'871633',location:'ReservarFlow.tsx:create-preference-client',message:'Respuesta create-preference en cliente',data:{status:res.status,ok:res.ok,hasInitPoint:!!json.init_point,error:json.error},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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
        const { data: appointment, error } = await supabase
          .from('appointments')
          .insert({
            barbershop_id: barbershop.id,
            service_id: service.id,
            fecha,
            slot_time: slot,
            barber_id: barberId,
            cliente_nombre: toTitleCase(nombre.trim()),
            cliente_telefono: telefono.trim(),
            cliente_email: email.trim() || null,
            estado: 'confirmed',
          })
          .select('id')
          .single();
        if (error) throw error;
        if (!appointment) throw new Error('Error al crear turno');
        const emailRes = await fetch(`/api/appointments/${appointment.id}/send-comprobante-email`, { method: 'POST' });
        const emailFailed = !emailRes.ok;
        window.location.href = `/reservar/confirmado?appointmentId=${encodeURIComponent(appointment.id)}${emailFailed ? '&emailFailed=1' : ''}`;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al reservar');
    } finally {
      setLoading(false);
    }
  }

  function goBackStep() {
    if (step === stepDatos) setStep(stepFecha);
    else if (step === stepFecha) setStep(hasBarberStep ? stepBarbero : 1);
    else if (step === stepBarbero) setStep(1);
  }

  const displayBarberName = (): string => {
    const bid = getBarberIdForConfirm();
    if (bid) return toTitleCase(barbers.find((b) => b.id === bid)?.name ?? '');
    return 'Se le asignará un barbero';
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={`/barberia/${barbershop.slug}`} className={styles.back}>
          Volver
        </Link>
      </header>
      <div className={styles.body}>
        <h1 className={styles.title}>Reservar en {barbershop.name}</h1>

        {isOwner && (
          <div className={styles.ownerBlock}>
            <p className={styles.ownerBlockText}>
              No podés sacar turnos mientras tengas la cuenta de dueño iniciada.
            </p>
            <p className={styles.ownerBlockSub}>
              Cerrando sesión vas a poder reservar como cliente.
            </p>
            <button
              type="button"
              className={styles.ownerBlockBtn}
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
            >
              Cerrar sesión para reservar
            </button>
          </div>
        )}

        {!isOwner && (
          <>
        {step > 1 && (
          <button type="button" onClick={goBackStep} className={styles.backStep}>
            ← Atrás
          </button>
        )}

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
                      setStep(hasBarberStep ? stepBarbero : stepFecha);
                    }}
                    className={styles.serviceBtn}
                  >
                    <span>{s.name}</span>
                    <span className={styles.price}>{formatPeso(s.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === stepBarbero && hasBarberStep && (
          <div className={styles.step}>
            <h2>Elegí barbero</h2>
            <div className={barbers.length > 2 ? styles.barberGridScrollWrap : styles.barberGridWrap}>
            <div className={styles.barberGrid}>
              {barbers.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBarberId(b.id);
                    setStep(stepFecha);
                  }}
                  className={`${styles.barberBtn} ${selectedBarberId === b.id ? styles.barberBtnSelected : ''}`}
                >
                  {b.photo_url ? (
                    <img src={b.photo_url} alt={toTitleCase(b.name)} className={styles.barberAvatar} loading="lazy" />
                  ) : (
                    <div className={styles.barberAvatarPlaceholder}>{toTitleCase(b.name).charAt(0)}</div>
                  )}
                  <span className={styles.barberName}>{toTitleCase(b.name)}</span>
                </button>
              ))}
            </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedBarberId(null);
                setEffectiveBarberId(null);
                setStep(stepFecha);
              }}
              className={styles.sinPreferenciaBtn}
            >
              Sin preferencia
            </button>
          </div>
        )}

        {step === stepFecha && (
          <div className={styles.step}>
            <h2>Elegí fecha y horario</h2>
            <div className={styles.calendar}>
              <div className={styles.calendarHeader}>
                <button
                  type="button"
                  className={styles.calendarNav}
                  onClick={() =>
                    setCalendarMonth((prev) => {
                      const d = new Date(prev.year, prev.month - 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })
                  }
                >
                  ‹
                </button>
                <span className={styles.calendarTitle}>
                  {MONTHS[calendarMonth.month]} {calendarMonth.year}
                </span>
                <button
                  type="button"
                  className={styles.calendarNav}
                  onClick={() =>
                    setCalendarMonth((prev) => {
                      const d = new Date(prev.year, prev.month + 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })
                  }
                >
                  ›
                </button>
              </div>
              <div className={styles.calendarWeekdays}>
                {WEEKDAYS.map((wd) => (
                  <span key={wd} className={styles.weekday}>
                    {wd}
                  </span>
                ))}
              </div>
              <div className={styles.calendarGrid}>
                {calendarDays.map(({ date, isCurrentMonth, isDisabled, isToday }) => {
                  const dStr = toLocalDateStr(date);
                  return (
                    <button
                      key={dStr}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) handleDayClick(dStr);
                      }}
                      className={`${styles.calendarDay} ${
                        !isCurrentMonth ? styles.calendarDayOther : ''
                      } ${fecha === dStr ? styles.calendarDaySelected : ''} ${
                        isDisabled ? styles.calendarDayDisabled : ''
                      } ${isToday && !isDisabled ? styles.calendarDayToday : ''}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
            {fecha && slot && (
              <p className={styles.fechaSelected}>
                {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}{' '}
                a las {slot.slice(0, 5)}
              </p>
            )}
            {fecha && slot && (
              <div className={styles.confirmBtnWrap}>
                <button
                  type="button"
                  className={styles.confirmBtn}
                  onClick={() => setStep(stepDatos)}
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        )}

        {step === stepDatos && (
          <div className={styles.step}>
            <h2 className={styles.datosTitle}>Tus datos</h2>
            <div className={styles.resumenBlock}>
              <p className={styles.resumenPrincipal}>
                {service?.name}
                {fecha && (
                  <>
                    {' · '}
                    {new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </>
                )}
                {slot && <> · {slot.slice(0, 5)}</>}
              </p>
              {barbers.length > 0 && (
                <p className={styles.resumenLinea}>
                  Barbero: {displayBarberName()}
                </p>
              )}
              {tieneSena && (
                <div className={styles.resumenSeñaWrap}>
                  <p className={styles.resumenSeña}>
                    {senaOpcional
                      ? `Seña opcional: ${formatPeso(senaClientePaga)}`
                      : `Seña: ${formatPeso(senaClientePaga)}`}
                  </p>
                  <button
                    type="button"
                    className={styles.detallesBtn}
                    onClick={() => setShowDetallesSena((s) => !s)}
                    aria-expanded={showDetallesSena}
                  >
                    detalles
                  </button>
                  {showDetallesSena && (
                    <p className={styles.detallesTexto}>
                      {comisionCliente && senaClientePaga > montoSena ? (
                        <>
                          De los {formatPeso(senaClientePaga)}: {formatPeso(montoSena)} se abonan al servicio y se
                          descuentan del total. Los {formatPeso(senaClientePaga - montoSena)} restantes cubren el costo
                          del pago con tarjeta.
                        </>
                      ) : (
                        <>
                          Los {formatPeso(montoSena)} se descuentan del total del servicio al llegar a la barbería.
                        </>
                      )}
                    </p>
                  )}
                </div>
              )}
              {tieneSena && service && requiereSena && restanteEnLocal > 0 && (
                <p className={styles.resumenRestante}>
                  Al llegar a la barbería abonarás: {formatPeso(restanteEnLocal)}
                </p>
              )}
              {senaOpcional && (
                <div className={styles.senaOpcionChoiceInline}>
                  <p className={styles.senaOpcionLabel}>¿Querés pagar la seña?</p>
                  <div className={styles.senaOpcionBtns}>
                    <button
                      type="button"
                      className={clientePagaSena ? styles.senaOpcionBtnActive : styles.senaOpcionBtn}
                      onClick={() => setClientePagaSena(true)}
                    >
                      Sí, pagar {formatPeso(senaClientePaga)}
                    </button>
                    <button
                      type="button"
                      className={!clientePagaSena ? styles.senaOpcionBtnActive : styles.senaOpcionBtn}
                      onClick={() => setClientePagaSena(false)}
                    >
                      No, reservar sin seña
                    </button>
                  </div>
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              className={styles.form}
            >
              <input
                type="email"
                placeholder="Tu correo*"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className={styles.input}
                required
                inputMode="email"
              />
              <input
                type="text"
                placeholder="Tu nombre*"
                value={nombre}
                onChange={(e) => setNombre(e.target.value.slice(0, 40))}
                className={styles.input}
                required
                minLength={3}
                maxLength={40}
                title="Entre 3 y 40 letras"
              />
              <input
                type="tel"
                placeholder="Tu teléfono*"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={styles.input}
                required
                inputMode="numeric"
                minLength={6}
                maxLength={10}
                pattern="[0-9]{6,10}"
                title="Entre 6 y 10 números"
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
          </div>
        )}
          </>
        )}
      </div>

      {modalDate && modalSlots && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModalDate(null)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <h3 id="modal-title" className={styles.modalTitle}>
              Horarios disponibles -{' '}
              {new Date(modalDate + 'T12:00:00').toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
            {modalSlots.slots.length === 0 ? (
              <p className={styles.empty}>No hay horarios disponibles</p>
            ) : (
              <div className={styles.slotGrid}>
                {modalSlots.slots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={styles.slotBtn}
                    onClick={() =>
                      handleSlotSelect(modalDate, t, modalSlots.barberId)
                    }
                  >
                    {t.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setModalDate(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
