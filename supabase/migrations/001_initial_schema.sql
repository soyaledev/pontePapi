-- BarberTurns MVP - Esquema inicial
-- Ejecutar en Supabase SQL Editor o via supabase db push

-- Perfil de dueño (extiende auth.users)
CREATE TABLE public.owner_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Barberías
CREATE TABLE public.barbershops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  photo_url TEXT,
  requiere_sena BOOLEAN DEFAULT FALSE,
  monto_sena DECIMAL(10,2) DEFAULT 0,
  nro_barberos INTEGER NOT NULL DEFAULT 1 CHECK (nro_barberos >= 1),
  slot_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_barbershops_owner ON public.barbershops(owner_id);
CREATE INDEX idx_barbershops_slug ON public.barbershops(slug);
CREATE INDEX idx_barbershops_name ON public.barbershops(name);

-- Servicios por barbería
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duracion_min INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_barbershop ON public.services(barbershop_id);

-- Horarios por barbería (día de semana 0=domingo, 6=sábado)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barbershop_id, day_of_week)
);

CREATE INDEX idx_schedules_barbershop ON public.schedules(barbershop_id);

-- Turnos
CREATE TYPE appointment_status AS ENUM ('pending', 'pending_payment', 'confirmed', 'cancelled', 'completed');

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  slot_time TIME NOT NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  estado appointment_status DEFAULT 'pending',
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_barbershop ON public.appointments(barbershop_id);
CREATE INDEX idx_appointments_fecha ON public.appointments(fecha);
CREATE INDEX idx_appointments_fecha_slot ON public.appointments(barbershop_id, fecha, slot_time);

-- Función para generar slug desde nombre
CREATE OR REPLACE FUNCTION generate_slug(name_input TEXT)
RETURNS TEXT AS $$
  SELECT lower(regexp_replace(
    regexp_replace(name_input, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )) || '-' || substr(gen_random_uuid()::text, 1, 8);
$$ LANGUAGE sql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER barbershops_updated_at BEFORE UPDATE ON public.barbershops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS

ALTER TABLE public.owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Barbershops: público puede leer (para búsqueda)
CREATE POLICY barbershops_public_read ON public.barbershops
  FOR SELECT USING (true);

-- Barbershops: solo dueño puede insert/update/delete
CREATE POLICY barbershops_owner_insert ON public.barbershops
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY barbershops_owner_update ON public.barbershops
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY barbershops_owner_delete ON public.barbershops
  FOR DELETE USING (auth.uid() = owner_id);

-- Services: público puede leer
CREATE POLICY services_public_read ON public.services
  FOR SELECT USING (true);

-- Services: dueño de la barbería puede CRUD
CREATE POLICY services_owner_all ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid())
  );

-- Schedules: público puede leer
CREATE POLICY schedules_public_read ON public.schedules
  FOR SELECT USING (true);

-- Schedules: dueño puede CRUD
CREATE POLICY schedules_owner_all ON public.schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid())
  );

-- Appointments: público puede insertar (cliente reserva)
CREATE POLICY appointments_public_insert ON public.appointments
  FOR INSERT WITH CHECK (true);

-- Appointments: público puede leer (para verificar disponibilidad - solo slots ocupados)
CREATE POLICY appointments_public_read ON public.appointments
  FOR SELECT USING (true);

-- Appointments: dueño puede actualizar (cancelar, completar)
CREATE POLICY appointments_owner_update ON public.appointments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.barbershops b WHERE b.id = barbershop_id AND b.owner_id = auth.uid())
  );

-- Owner profiles: dueño puede crear/leer su perfil
CREATE POLICY owner_profiles_own ON public.owner_profiles
  FOR ALL USING (auth.uid() = id);
