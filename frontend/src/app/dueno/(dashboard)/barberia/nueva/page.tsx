import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NuevaBarberiaForm } from './NuevaBarberiaForm';

export const dynamic = 'force-dynamic';

export default async function NuevaBarberiaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/dueno/login');

  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('id, slug')
    .eq('owner_id', user.id)
    .limit(1)
    .single();

  if (barbershop) {
    redirect(`/dueno/barberia/${barbershop.slug}`);
  }

  return <NuevaBarberiaForm />;
}
