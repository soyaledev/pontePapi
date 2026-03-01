'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import styles from './HomeSections.module.css';

export function HomeSections() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={styles.section} aria-labelledby="home-sections-title">
      <h2 id="home-sections-title" className={styles.srOnly}>
        Cómo funciona PontePapi
      </h2>
      <div className={`${styles.wrapper} ${visible ? styles.visible : ''}`}>
        <p className={styles.lead}>
          PontePapi conecta a quienes buscan turno con barberías reales. Sin apps extras, sin llamadas.
        </p>
        <div className={styles.split}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Buscás turno</h3>
            <p className={styles.cardText}>
              Encontrá barberías por nombre o zona. Elegí barbero, fecha y horario. Reservá al toque — con o sin seña según la barbería.
            </p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Tenés barbería</h3>
            <p className={styles.cardText}>
              Registrá tu local en minutos. Recibí reservas 24/7 sin atender el teléfono. Cobrá señas con Mercado Pago y reducí inasistencias.
            </p>
            <Link href="/dueno/login" className={styles.cta}>
              Sumá tu barbería
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
