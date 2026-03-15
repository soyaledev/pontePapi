-- Actualizar función de búsqueda para usar barberos
CREATE OR REPLACE FUNCTION public.search_barbershops(search_term TEXT, result_limit INT DEFAULT 12)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  city TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.slug,
    b.city
  FROM public.barbershops b
  WHERE
    search_term IS NOT NULL AND trim(search_term) != '' AND (
      b.name ILIKE '%' || search_term || '%'
      OR b.address ILIKE '%' || search_term || '%'
      OR b.city ILIKE '%' || search_term || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(COALESCE(b.barberos, ARRAY[]::TEXT[])) AS barb
        WHERE barb ILIKE '%' || search_term || '%'
      )
    )
  ORDER BY b.name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
