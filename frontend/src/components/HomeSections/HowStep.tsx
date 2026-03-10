'use client';

import type { Step } from './steps/clientSteps';
import styles from './HomeSections.module.css';

type HowStepProps = {
  step: Step;
  isLast: boolean;
  index: number;
};

export function HowStep({ step, isLast }: HowStepProps) {
  return (
    <div className={styles.stepItem} data-step-index={step.number}>
      <div className={styles.stepBadge} aria-hidden>
        {step.number}
      </div>
      <div className={styles.stepContent}>
        <div className={styles.stepHeader}>
          <div className={styles.stepText}>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDescription}>{step.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
