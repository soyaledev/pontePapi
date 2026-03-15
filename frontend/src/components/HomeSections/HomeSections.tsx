'use client';

import { useEffect, useRef, useState } from 'react';
import { HowStep } from './HowStep';
import { clientSteps } from './steps/clientSteps';
import styles from './HomeSections.module.css';

const CYCLE_MS = 2800;

export function HomeSections() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
      setActiveIndex((i) => (i + 1) % clientSteps.length);
    }, CYCLE_MS);
    return () => clearInterval(t);
  }, [visible]);

  return (
    <section ref={ref} className={styles.section} aria-labelledby="home-sections-title">
      <h2 id="home-sections-title" className={styles.srOnly}>
        Cómo funciona PontePapi
      </h2>
      <div className={`${styles.wrapper} ${visible ? styles.visible : ''}`}>
        <p className={styles.lead}>
          Turnos con barberías reales. Sin apps, sin llamadas.
        </p>
        <div className={styles.timeline}>
          {clientSteps.map((step, index) => (
            <HowStep
              key={step.id}
              step={step}
              isLast={index === clientSteps.length - 1}
              index={index}
              isActive={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
