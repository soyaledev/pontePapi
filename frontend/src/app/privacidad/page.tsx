import Link from 'next/link';
import Image from 'next/image';
import styles from '@/app/condiciones/Legal.module.css';

export default function PrivacidadPage() {
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
        <h1 className={styles.title}>Política de privacidad</h1>
        <p className={styles.updated}>Última actualización: 2025</p>
        <div className={styles.content}>
          <p>
            Respetamos tu privacidad. Los datos que proporcionás (nombre, teléfono, correo) se
            utilizan únicamente para gestionar las reservas y comunicarnos en relación con tu turno.
          </p>
          <p>
            No vendemos ni compartimos tu información personal con terceros para fines de marketing.
          </p>
          <p>
            Para más información, contactanos.
          </p>
        </div>
      </main>
    </div>
  );
}
