-- Índice único parcial: evita dos reservas confirmadas en el mismo horario.
-- Protege el sistema ante condiciones de carrera o errores de backend.

-- Para appointments con barber asignado: único por barbershop + barber + fecha + slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_unique_confirmed_with_barber
  ON appointments (barbershop_id, barber_id, fecha, slot_time)
  WHERE estado = 'confirmed' AND barber_id IS NOT NULL;

-- Para appointments sin barber (sin preferencia): único por barbershop + fecha + slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_unique_confirmed_no_barber
  ON appointments (barbershop_id, fecha, slot_time)
  WHERE estado = 'confirmed' AND barber_id IS NULL;
