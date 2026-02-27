import { RegistroForm } from './RegistroForm';
import styles from '../login/Login.module.css';
import Link from 'next/link';

export default function RegistroPage() {
  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <div className={styles.card}>
          <h1 className={styles.title}>Crear cuenta</h1>
          <p className={styles.subtitle}>Panel de dueños de barbería</p>
          <RegistroForm />
        </div>
        <Link href="/dueno/login" className={styles.back}>
          Ya tengo cuenta
        </Link>
      </div>
    </div>
  );
}
