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
          sizes="(max-width: 768px) 100vw, 50vw"
          className={styles.coverImage}
          unoptimized={coverSrc.startsWith('http')}
        />
        <div className={styles.overlay} />
        <div className={styles.coverContent}>
          <div className={styles.coverContentInner}>
            <h1 className={styles.title}>{barbershop.name}</h1>
            <Link
              href={`/reservar/${barbershop.slug}`}
              className={styles.reservarBtnCover}
            >
              Sacar turno
            </Link>
          </div>
        </div>
      </section>
      <aside className={styles.body}>
        <h1 className={styles.titleDesktop}>{barbershop.name}</h1>
        {(barbershop.city || barbershop.address || barbershop.phone) && (
          <div className={styles.infoRow}>
            {barbershop.city && (
              <span className={styles.infoItem}>
                <svg className={styles.infoIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                {toTitleCase(barbershop.city)}
              </span>
            )}
            {barbershop.city && (barbershop.address || barbershop.phone) && <span className={styles.infoSep}>·</span>}
            {barbershop.address && (
              <span className={styles.infoItem}>
                <svg className={styles.infoIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {isLink(barbershop.address) ? (
                  <a href={barbershop.address} target="_blank" rel="noopener noreferrer" className={styles.addressLink}>
                    Ver en Google Maps
                  </a>
                ) : (
                  toTitleCase(barbershop.address)
                )}
              </span>
            )}
            {barbershop.address && barbershop.phone && <span className={styles.infoSep}>·</span>}
            {barbershop.phone && (
              <span className={styles.infoItem}>
                <svg className={styles.infoIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                {barbershop.phone.replace(/\D/g, '').slice(0, 10)}
              </span>
            )}
          </div>
        )}
        <div className={styles.bodyMain}>
          <div className={styles.info}>
            {barbers && barbers.length > 0 && (
              <div className={styles.barbersSection}>
                <strong>Barberos</strong>
                <div className={barbers.length > 2 ? styles.barberGridScrollWrap : styles.barberGridWrap}>
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
              </div>
            )}
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
      </aside>
    </div>
  );
}
