'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle, useTheme } from '@/components/ThemeProvider';
import styles from './Footer.module.css';

export function Footer() {
  const { theme } = useTheme();
  const logoSrc = theme === 'dark' ? '/images/LogoFooter.webp' : '/images/LogoFooterDM.webp';

  return (
    <footer className={styles.footer}>
      <div className={styles.themeRow}>
        <ThemeToggle />
      </div>
      <Link href="/" className={styles.logo} aria-label="PontePapi - Inicio">
        <Image
          src={logoSrc}
          alt="PontePapi"
          width={160}
          height={48}
        />
      </Link>
      <a
        href="https://instagram.com/ponte_papi"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.instagram}
      >
        @ponte_papi
      </a>
      <p className={styles.version}>v1.1.0</p>
      <p className={styles.credit}>
        Creada por{' '}
        <a href="https://alekey.com.ar" target="_blank" rel="noopener noreferrer">
          alekey.com.ar
        </a>
      </p>
      <nav className={styles.links} aria-label="Legal">
        <Link href="/condiciones">Condiciones</Link>
        <span className={styles.sep}>·</span>
        <Link href="/privacidad">Privacidad</Link>
      </nav>
    </footer>
  );
}
