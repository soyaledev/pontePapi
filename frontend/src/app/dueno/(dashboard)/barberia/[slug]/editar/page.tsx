import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { EditarBarberiaForm } from './EditarBarberiaForm';

export default async function EditarBarberiaPage({
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || barbershop.owner_id !== user.id) {
    redirect('/dueno/dashboard');
  }

  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, photo_url, order')
    .eq('barbershop_id', barbershop.id)
    .order('order', { ascending: true });

  const initialBarbers =
    barbers && barbers.length > 0
      ? barbers.map((b) => ({
          id: b.id,
          name: b.name,
          photo_url: b.photo_url ?? '',
        }))
      : [{ id: '', name: '', photo_url: '' }];

  return (
    <EditarBarberiaForm
      barbershop={{
        ...barbershop,
        monto_sena: String(barbershop.monto_sena ?? ''),
      }}
      initialBarbers={initialBarbers}
    />
  );
}
