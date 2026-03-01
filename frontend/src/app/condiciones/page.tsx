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
        <p className={styles.updated}>Última actualización: febrero 2026</p>
        <div >
          <p>
            Al utilizar PontePapi («nosotros», «la plataforma», «el servicio») para buscar barberías,
            reservar turnos o gestionar tu negocio, aceptás estas condiciones. Si no estás de acuerdo, no utilices el servicio.
          </p>

          <h2>1. Descripción del servicio</h2>
          <p>
            PontePapi es una plataforma que conecta clientes con barberías para la reserva de turnos.
            Ofrecemos búsqueda de establecimientos, gestión de citas y, cuando la barbería lo requiera,
            cobro de señas mediante Mercado Pago.
          </p>

          <h2>2. Usuarios</h2>
          <h3>Clientes</h3>
          <p>
            Podés buscar barberías y reservar turnos sin crear cuenta. Para confirmar una reserva
            proporcionás nombre, teléfono y correo. Si la barbería cobra seña, el pago se realiza
            a través de Mercado Pago.
          </p>
          <h3>Dueños de barbería</h3>
          <p>
            Los dueños deben registrarse con correo o Google para acceder al panel de gestión.
            Son responsables de la información que publican (horarios, servicios, precios) y de
            cumplir con los turnos confirmados.
          </p>

          <h2>3. Reservas y turnos</h2>
          <ul>
            <li>Una reserva se confirma cuando el cliente completa el proceso y, si aplica, realiza el pago de la seña.</li>
            <li>Cada barbería es responsable de atender los turnos confirmados.</li>
            <li>Las cancelaciones o cambios deben gestionarse directamente con la barbería.</li>
          </ul>

          <h2>4. Pagos</h2>
          <p>
            Las señas se procesan mediante Mercado Pago. Al pagar, aceptás también los términos y
            condiciones de Mercado Pago. PontePapi facilita la integración pero no es parte de la
            relación de pago entre vos y la barbería.
          </p>

          <h2>5. Limitación de responsabilidad</h2>
          <p>
            PontePapi actúa como intermediario entre clientes y barberías. No nos hacemos responsables por:
          </p>
          <ul>
            <li>Incumplimientos, cancelaciones o calidad del servicio prestado por las barberías.</li>
            <li>Problemas con Mercado Pago (demoras, rechazos, disputas de pago).</li>
            <li>Daños indirectos o consecuentes derivados del uso del servicio.</li>
          </ul>

          <h2>6. Uso aceptable</h2>
          <p>
            No está permitido usar la plataforma para fines ilegales, falsificar información o
            perjudicar a otros usuarios. Nos reservamos el derecho de suspender cuentas que vulneren estas normas.
          </p>

          <h2>7. Modificaciones</h2>
          <p>
            Podemos modificar estas condiciones. Los cambios se publicarán en esta página con la
            fecha de actualización. El uso continuado del servicio implica la aceptación de las
            condiciones vigentes.
          </p>

          <h2>8. Ley aplicable y jurisdicción</h2>
          <p>
            Estas condiciones se rigen por las leyes de la República Argentina. Cualquier disputa
            será sometida a los tribunales competentes de la Ciudad Autónoma de Buenos Aires.
          </p>

          <h2>9. Contacto</h2>
          <p>
            Para consultas sobre estas condiciones podés contactarnos por Instagram{' '}
            <a href="https://instagram.com/ponte_papi" target="_blank" rel="noopener noreferrer" >
              @ponte_papi
            </a>{' '}
            o a través de{' '}
            <a href="https://alekey.com.ar" target="_blank" rel="noopener noreferrer" >
              alekey.com.ar
            </a>.
          </p>
        </div>
      </main>
    </div>
  );
}
