'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { checkBarbershopVisibility, type VisibilityCheck } from '@/lib/barbershop-visibility';
import styles from './VisibilityNotice.module.css';

const PANEL_UPDATE_EVENT = 'panel-visibility-update';

export function VisibilityNotice({
  barbershopId,
  initialVisibility,
  requiereSena,
}: {
  barbershopId: string;
  initialVisibility: VisibilityCheck;
  requiereSena: boolean;
}) {
  const [visibility, setVisibility] = useState(initialVisibility);

  const fetchVisibility = useCallback(async () => {
    const [schedulesRes, servicesRes, barbershopRes] = await Promise.all([
      supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('barbershop_id', barbershopId),
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('barbershop_id', barbershopId),
      supabase.from('barbershops').select('requiere_sena, mp_access_token').eq('id', barbershopId).single(),
    ]);
    const schedulesCount = schedulesRes.count ?? 0;
    const servicesCount = servicesRes.count ?? 0;
    const bs = barbershopRes.data;
    const nextVisibility = checkBarbershopVisibility({
      schedulesCount,
      servicesCount,
      requiereSena: !!bs?.requiere_sena,
      mpLinked: !!(bs?.mp_access_token),
    });
    setVisibility(nextVisibility);
  }, [barbershopId]);

  useEffect(() => {
    fetchVisibility();
  }, [fetchVisibility]);

  useEffect(() => {
    function onPanelUpdate() {
      fetchVisibility();
    }
    window.addEventListener(PANEL_UPDATE_EVENT, onPanelUpdate);
    return () => window.removeEventListener(PANEL_UPDATE_EVENT, onPanelUpdate);
  }, [fetchVisibility]);

  if (visibility.isVisible) return null;

  const items: string[] = [];
  if (!visibility.hasHorarios) items.push('horarios (al menos 1 día abierto)');
  if (requiereSena && !visibility.hasPagos) items.push('pagos (cuenta Mercado Pago vinculada)');
  if (!visibility.hasServicios) items.push('servicios (al menos 1 servicio)');

  const total = requiereSena ? 3 : 2;
  const completed = requiereSena
    ? [visibility.hasHorarios, visibility.hasServicios, visibility.hasPagos].filter(Boolean).length
    : [visibility.hasHorarios, visibility.hasServicios].filter(Boolean).length;
  const percent = Math.round((completed / total) * 100);

  const text =
    items.length > 0
      ? `Tu cuenta no estará visible para el público hasta que completes: ${items.join('; ')}.`
      : 'Tu cuenta no estará visible para el público hasta completar la configuración.';

  return (
    <div className={styles.wrap}>
      <p className={styles.percent}>{percent}%</p>
      <p className={styles.text}>{text}</p>
    </div>
  );
}

export function dispatchPanelVisibilityUpdate() {
  window.dispatchEvent(new Event(PANEL_UPDATE_EVENT));
}
