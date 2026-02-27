import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--bg-dark)',
        color: 'var(--text)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Página no encontrada
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        La página que buscás no existe o fue movida.
      </p>
      <Link
        href="/"
        style={{
          color: 'var(--accent)',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
