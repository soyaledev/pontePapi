import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toTitleCase, isLink, formatPeso } from '@/lib/format';
import { checkBarbershopVisibility } from '@/lib/barbershop-visibility';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './BarberiaPublic.module.css';

export default async function BarberiaPublicPage({
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

  const [
    { data: services },
    { data: schedules },
  ] = await Promise.all([
    supabase.from('services').select('*').eq('barbershop_id', barbershop.id).order('name'),
    supabase.from('schedules').select('id').eq('barbershop_id', barbershop.id),
  ]);

  const visibility = checkBarbershopVisibility({
    schedulesCount: (schedules ?? []).length,
    servicesCount: (services ?? []).length,
    requiereSena: !!barbershop.requiere_sena,
    mpLinked: !!barbershop.mp_access_token,
  });

  if (!visibility.isVisible) notFound();

  const { data: barbers } = await supabase
    .from('barbers')
    .select('id, name, photo_url')
    .eq('barbershop_id', barbershop.id)
    .order('order', { ascending: true });

  const coverSrc = barbershop.photo_url || '/images/portada.png';

  return (
    <div className={styles.page}>
      <section className={styles.cover}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href="/" className={styles.back}>
              Volver
            </Link>
          </div>
        </header>
        <Image
          src={coverSrc}
          alt={barbershop.name}
          fill
          sizes="100vw"
          className={styles.coverImage}
          unoptimized={coverSrc.startsWith('http')}
        />
        <div className={styles.overlay} />
        <div className={styles.coverContent}>
          <div className={styles.coverContentInner}>
            <h1 className={styles.title}>{barbershop.name}</h1>
            <Link
              href={`/reservar/${barbershop.slug}`}
              className={styles.reservarBtn}
            >
              Sacar turno
            </Link>
          </div>
        </div>
      </section>
      <div className={styles.body}>
        <div className={styles.info}>
          {barbers && barbers.length > 0 && (
            <div className={styles.barbersSection}>
              <strong>Barberos</strong>
              <div className={styles.barberGrid}>
                {barbers.map((b) => (
                  <div key={b.id} className={styles.barberCard}>
                    {b.photo_url ? (
                      <img src={b.photo_url} alt={toTitleCase(b.name)} className={styles.barberAvatar} loading="lazy" />
                    ) : (
                      <div className={styles.barberAvatarPlaceholder}>{toTitleCase(b.name).charAt(0)}</div>
                    )}
                    <span>{toTitleCase(b.name)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {barbershop.city && <p>{toTitleCase(barbershop.city)}</p>}
          {barbershop.address && (
            <p>
              {isLink(barbershop.address) ? (
                <a href={barbershop.address} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                  Ver en Google Maps
                </a>
              ) : (
                toTitleCase(barbershop.address)
              )}
            </p>
          )}
          {barbershop.phone && <p>{barbershop.phone.replace(/\D/g, '').slice(0, 10)}</p>}
        </div>
        <section className={styles.services}>
          <h2 className={styles.servicesTitle}>Servicios</h2>
          <ul className={styles.serviceList}>
            {(services ?? []).map((s) => (
              <li key={s.id} className={styles.serviceItem}>
                <span>{s.name}</span>
                <span className={styles.price}>{formatPeso(s.price)}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`/reservar/${barbershop.slug}`}
            className={styles.reservarBtnSecondary}
          >
            Sacar turno
          </Link>
        </section>
      </div>
    </div>
  );
}
