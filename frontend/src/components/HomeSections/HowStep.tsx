'use client';

import type { Step } from './steps/clientSteps';
import styles from './HomeSections.module.css';

type HowStepProps = {
  step: Step;
  isLast: boolean;
  index: number;
  isActive: boolean;
};

export function HowStep({ step, isActive }: HowStepProps) {
  return (
    <div
      className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ''}`}
      data-step-index={step.number}
    >
      <span className={styles.stepNum} aria-hidden>{step.number}</span>
      <div className={styles.stepContent}>
        <h3 className={styles.stepTitle}>{step.title}</h3>
        <p className={styles.stepDescription}>{step.description}</p>
      </div>
    </div>
  );
}
