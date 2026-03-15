-- Actualiza search_barbershops para filtrar solo barberías visibles al público.
-- Visible = al menos 1 horario abierto + al menos 1 servicio + (si pide seña: MP vinculada).
-- Si la función no existe, créala. Si existe, reemplázala.

CREATE OR REPLACE FUNCTION search_barbershops(
  search_term text DEFAULT '',
  result_limit int DEFAULT 12
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  city text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    b.id,
    b.name,
    b.slug,
    b.city
  FROM barbershops b
  WHERE
    -- Búsqueda: nombre barbería, ciudad o nombre de barberos (si hay término)
    (
      search_term = ''
      OR b.name ILIKE '%' || search_term || '%'
      OR (b.city IS NOT NULL AND b.city ILIKE '%' || search_term || '%')
      OR EXISTS (
        SELECT 1 FROM barbers br
        WHERE br.barbershop_id = b.id
        AND br.name ILIKE '%' || search_term || '%'
      )
    )
    -- Visibilidad: al menos 1 día con horario
    AND EXISTS (
      SELECT 1 FROM schedules s WHERE s.barbershop_id = b.id
    )
    -- Visibilidad: al menos 1 servicio
    AND EXISTS (
      SELECT 1 FROM services sv WHERE sv.barbershop_id = b.id
    )
    -- Visibilidad: si pide seña, debe tener MP vinculada
    AND (
      (b.requiere_sena = false OR b.requiere_sena IS NULL)
      OR (b.mp_access_token IS NOT NULL AND b.mp_access_token != '')
    )
  ORDER BY b.name
  LIMIT result_limit;
$$;
