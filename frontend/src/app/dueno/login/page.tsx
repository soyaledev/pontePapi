import { Suspense } from 'react';
import { LoginForm } from './LoginForm';
import styles from './Login.module.css';

function LoginFallback() {
  return (
    <div className={styles.page}>
      <div className={styles.body}>
        <div className={styles.card}>
          <h1 className={styles.title}>Ingresar</h1>
          <p className={styles.subtitle}>Panel de dueños de barbería</p>
          <p className={styles.subtitle} style={{ marginTop: '1rem' }}>Cargando...</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
