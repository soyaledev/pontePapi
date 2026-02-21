import Link from 'next/link';
import styles from './Error.module.css';

export default function ErrorPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Error en el pago</h1>
        <p className={styles.mensaje}>
          No se pudo completar el pago. Intentá de nuevo o contactá a la barbería.
        </p>
        <Link href="/" className={styles.link}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
