-- Instagram opcional en turnos
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cliente_instagram TEXT;
