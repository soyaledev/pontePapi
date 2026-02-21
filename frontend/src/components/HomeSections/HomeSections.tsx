'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './HomeSections.module.css';

const SECTIONS = [
  {
    title: '¿Necesitás un corte hoy?',
    description: 'Tenemos las mejores barberías cerca tuyo.',
    image: '/images/corte-hoy.jpg',
    imageSide: 'left' as const,
  },
  {
    title: 'Reservá en segundos',
    description: 'Elegí turno, fecha y horario sin llamar.',
    image: '/images/reservar.jpg',
    imageSide: 'right' as const,
  },
  {
    title: 'Barberías verificadas',
    description: 'Profesionales de confianza en tu zona.',
    image: '/images/verificadas.jpg',
    imageSide: 'left' as const,
  },
] as const;

export function HomeSections() {
  return (
    <section className={styles.section} aria-labelledby="home-sections-title">
      <h2 id="home-sections-title" className={styles.srOnly}>
        Beneficios de Turnos Barber
      </h2>
      <div className={styles.grid}>
        {SECTIONS.map((item) => (
          <SectionCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

function SectionCard({
  item,
}: {
  item: (typeof SECTIONS)[number];
}) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layoutClass = item.imageSide === 'left' ? styles.imageLeft : styles.imageRight;

  return (
    <article
      ref={ref}
      className={`${styles.card} ${visible ? styles.visible : ''} ${layoutClass}`}
    >
      <div className={styles.inner}>
      <div className={styles.imageWrap}>
        <Image
          src={item.image}
          alt=""
          fill
          sizes="(max-width: 600px) 120px, 160px"
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardDesc}>{item.description}</p>
      </div>
      </div>
    </article>
  );
}
