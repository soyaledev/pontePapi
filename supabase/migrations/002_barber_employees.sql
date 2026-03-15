-- Nombre del barbero principal y empleados para búsqueda de clientes
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS barber_name TEXT,
  ADD COLUMN IF NOT EXISTS employee_names TEXT[] DEFAULT '{}';

-- Índices para búsqueda por nombre de barbería, barbero y empleados
CREATE INDEX IF NOT EXISTS idx_barbershops_barber_name ON public.barbershops(barber_name);
