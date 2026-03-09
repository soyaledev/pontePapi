'use client';

import { useEffect, useRef, useState } from 'react';
import { HowStep } from './HowStep';
import { clientSteps } from './steps/clientSteps';
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
        <div className={styles.timeline}>
          {clientSteps.map((step, index) => (
            <HowStep
              key={step.id}
              step={step}
              isLast={index === clientSteps.length - 1}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
