'use client';

import { useState, useEffect } from 'react';
import { ThemeAwareLogo } from '@/components/ThemeAwareLogo';
import { ownerSteps } from '@/components/HomeSections/steps/ownerSteps';
import styles from './WelcomeOverlay.module.css';

const STORAGE_PREFIX = 'pontepapi_welcome_v1';

export function WelcomeOverlay({ userId, userEmail: _userEmail }: { userId: string; userEmail: string }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const storageKey = `${STORAGE_PREFIX}_${userId}`;

  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    const seen = localStorage.getItem(storageKey);
    setMounted(true);
    if (!seen) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [userId, storageKey]);

  function handleDismiss() {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
  }

  if (!mounted) return null;

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
      aria-hidden={!visible}
    >
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <ThemeAwareLogo
            width={120}
            height={36}
            priority
            imageClassName={styles.logo}
          />
        </div>
        <h1 className={styles.greeting}>Bienvenido/a</h1>
        <p className={styles.tagline}>
          Al sistema de gestión de turnos
          <br />
          para barberías más completo que existe
        </p>
        <button
          type="button"
          className={styles.cta}
          onClick={handleDismiss}
          aria-label="Comenzar"
        >
          Comenzar
        </button>
        <button
          type="button"
          className={styles.verInstrucciones}
          onClick={() => setShowInstructions((s) => !s)}
        >
          {showInstructions ? 'Ocultar instrucciones' : 'Ver instrucciones'}
        </button>
        {showInstructions && (
          <div className={styles.instrucciones}>
            {ownerSteps.map((step) => (
              <div key={step.id} className={styles.stepItem}>
                <span className={styles.stepBadge}>{step.number}</span>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
