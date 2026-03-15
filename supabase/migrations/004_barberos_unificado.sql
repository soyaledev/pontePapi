-- Unificar barber_name y employee_names en barberos (todos son "barberos")
ALTER TABLE public.barbershops ADD COLUMN IF NOT EXISTS barberos TEXT[] DEFAULT '{}';

-- Migrar datos existentes
UPDATE public.barbershops SET barberos = (
  SELECT COALESCE(array_agg(n), '{}') FROM (
    SELECT trim(unnest) AS n
    FROM unnest(
      array_cat(
        CASE WHEN barber_name IS NOT NULL AND trim(barber_name) != '' THEN ARRAY[barber_name] ELSE ARRAY[]::TEXT[] END,
        COALESCE(employee_names, '{}')
      )
    ) AS unnest
    WHERE trim(unnest) != ''
  ) x
) WHERE barber_name IS NOT NULL OR (employee_names IS NOT NULL AND array_length(employee_names, 1) > 0);

-- Eliminar columnas antiguas
ALTER TABLE public.barbershops DROP COLUMN IF EXISTS barber_name;
ALTER TABLE public.barbershops DROP COLUMN IF EXISTS employee_names;

-- Índice para búsqueda
CREATE INDEX IF NOT EXISTS idx_barbershops_barberos ON public.barbershops USING GIN(barberos);
