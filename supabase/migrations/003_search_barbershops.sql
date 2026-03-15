-- Función RPC para buscar barberías por nombre, barbero, empleados, calle y ciudad
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
      OR b.barber_name ILIKE '%' || search_term || '%'
      OR b.address ILIKE '%' || search_term || '%'
      OR b.city ILIKE '%' || search_term || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(COALESCE(b.employee_names, ARRAY[]::TEXT[])) AS emp
        WHERE emp ILIKE '%' || search_term || '%'
      )
    )
  ORDER BY b.name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Permitir ejecución pública (búsqueda para clientes)
GRANT EXECUTE ON FUNCTION public.search_barbershops(TEXT, INT) TO anon;
