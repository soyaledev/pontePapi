import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { toTitleCase, isLink, formatPeso } from '@/lib/format';
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

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .order('name');

  const coverSrc = barbershop.photo_url || '/images/portada.png';

  return (
    <div className={styles.page}>
      <section className={styles.cover}>
        <header className={styles.header}>
          <Link href="/" className={styles.back}>
            Volver
          </Link>
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
          <h1 className={styles.title}>{barbershop.name}</h1>
          <Link
            href={`/reservar/${barbershop.slug}`}
            className={styles.reservarBtn}
          >
            Sacar turno
          </Link>
        </div>
      </section>
      <div className={styles.body}>
        <div className={styles.info}>
          {barbershop.barberos && barbershop.barberos.length > 0 && (
            <p><strong>Barberos:</strong> {barbershop.barberos.join(', ')}</p>
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
