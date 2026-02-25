import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ReservarFlow } from './ReservarFlow';

export const dynamic = 'force-dynamic';

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!barbershop) notFound();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('name');

  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, photo_url')
    .eq('barbershop_id', barbershop.id)
    .order('order', { ascending: true });

  return (
    <ReservarFlow
      barbershop={{ ...barbershop, barbers: barbers ?? [] }}
      services={services ?? []}
    />
  );
}
