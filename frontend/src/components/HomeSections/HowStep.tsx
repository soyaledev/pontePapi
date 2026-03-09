'use client';

import type { Step } from './steps/clientSteps';
import styles from './HomeSections.module.css';

type HowStepProps = {
  step: Step;
  isLast: boolean;
  index: number;
};

const STEP_ICONS: Record<string, React.ReactNode> = {
  buscar: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  elegir: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  reservar: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  listo: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

export function HowStep({ step, isLast, index }: HowStepProps) {
  const icon = STEP_ICONS[step.id] ?? null;
  const imageOnRight = index % 2 === 1;

  return (
    <div className={styles.stepItem} data-step-index={index}>
      <div className={styles.stepNumber} aria-hidden>
        {step.number}
      </div>
      <div className={styles.stepContent}>
        <div className={`${styles.stepHeader} ${imageOnRight ? styles.stepImageRight : ''}`}>
          <div className={styles.stepText}>
            <span className={styles.stepIcon}>{icon}</span>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDescription}>{step.description}</p>
          </div>
          <div className={styles.stepImagePlaceholder} aria-hidden>
            <span className={styles.stepImageLabel}>Paso {step.number}</span>
          </div>
        </div>
      </div>
      {!isLast && <div className={styles.stepConnector} aria-hidden />}
    </div>
  );
}
