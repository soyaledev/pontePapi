'use client';

import styles from './BarberPoleAnimation.module.css';

export function BarberPoleAnimation() {
  return (
    <div className={styles.wrapper} aria-hidden>
      <div className={styles.stripes} />
    </div>
  );
}
