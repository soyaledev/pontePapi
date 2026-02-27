'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './WelcomeOverlay.module.css';

const STORAGE_PREFIX = 'pontepapi_welcome_v1';

export function WelcomeOverlay({ userId, userEmail: _userEmail }: { userId: string; userEmail: string }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
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
    setVisible(false);
    setTimeout(() => {
      localStorage.setItem(storageKey, '1');
    }, 400);
  }

  if (!mounted) return null;

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
      aria-hidden={!visible}
    >
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <Image
            src="/images/logosvgPontePapi.svg"
            alt="PontePapi"
            width={160}
            height={48}
            priority
            className={styles.logo}
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
      </div>
    </div>
  );
}
