import Link from 'next/link';
import Image from 'next/image';
import styles from './Legal.module.css';

export default function CondicionesPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← Volver
        </Link>
        <Link href="/" className={styles.logo}>
          <Image
            src="/images/logosvgPontePapi.svg"
            alt="PontePapi"
            width={120}
            height={36}
          />
        </Link>
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>Condiciones de uso</h1>
        <p className={styles.updated}>Última actualización: 2025</p>
        <div className={styles.content}>
          <p>
            Al utilizar PontePapi para reservar turnos en barberías, aceptás estas condiciones.
          </p>
          <p>
            El servicio permite a los usuarios reservar turnos. Cada barbería es responsable de
            la prestación de sus servicios y de cumplir con los turnos confirmados.
          </p>
          <p>
            PontePapi no se hace responsable por incumplimientos de las barberías ni por
            cancelaciones.
          </p>
        </div>
      </main>
    </div>
  );
}
