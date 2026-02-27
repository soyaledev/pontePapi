import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Link href="/" className={styles.logo} aria-label="PontePapi - Inicio">
        <Image
          src="/images/logosvgPontePapi.svg"
          alt=""
          width={100}
          height={30}
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
      <p className={styles.version}>v1.0.0</p>
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
