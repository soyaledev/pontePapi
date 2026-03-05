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
        <p className={styles.updated}>Última actualización: febrero 2026</p>
        <div className={styles.content}>
          <p>
            Esta política describe cómo PontePapi trata tus datos personales. Está elaborada en
            cumplimiento de la Ley 25.326 de Protección de Datos Personales de Argentina.
          </p>

          <h2>1. Responsable del tratamiento</h2>
          <p>
            Los datos recopilados a través de PontePapi son tratados por quienes operan la plataforma.
            Podés contactarnos por Instagram{' '}
            <a href="https://instagram.com/ponte_papi" target="_blank" rel="noopener noreferrer" >
              @ponte_papi
            </a>{' '}
            o mediante{' '}
            <a href="https://alekey.com.ar" target="_blank" rel="noopener noreferrer" >
              alekey.com.ar
            </a>.
          </p>

          <h2>2. Datos que recopilamos</h2>
          <h3>Si reservás un turno (cliente)</h3>
          <ul>
            <li><strong>Nombre:</strong> para identificar la reserva.</li>
            <li><strong>Teléfono:</strong> para que la barbería pueda contactarte.</li>
            <li><strong>Correo electrónico:</strong> para enviarte el comprobante de reserva y posibles comunicaciones sobre tu turno.</li>
          </ul>
          <h3>Si sos dueño de barbería</h3>
          <ul>
            <li><strong>Correo y contraseña</strong> (o cuenta de Google) para el registro e inicio de sesión.</li>
            <li><strong>Datos de tu barbería:</strong> nombre, dirección, teléfono, ciudad, horarios, servicios, precios.</li>
            <li><strong>Conexión con Mercado Pago:</strong> si vinculás tu cuenta para recibir señas, Mercado Pago procesa los pagos según sus propias políticas.</li>
          </ul>

          <h2>3. Finalidad del tratamiento</h2>
          <p>Utilizamos tus datos para:</p>
          <ul>
            <li>Gestionar y confirmar reservas.</li>
            <li>Enviar comprobantes y recordatorios por correo.</li>
            <li>Permitir que la barbería te contacte en relación con tu turno.</li>
            <li>Autenticar y administrar cuentas de dueños de barbería.</li>
            <li>Mantener la seguridad y el correcto funcionamiento del servicio.</li>
          </ul>

          <h2>4. Base legal y consentimiento</h2>
          <p>
            El tratamiento se basa en tu consentimiento al proporcionar los datos al reservar o registrarte,
            y en la necesidad de ejecutar la relación contractual (gestión de turnos y pagos). En el caso
            de datos necesarios para el cumplimiento del contrato, el tratamiento es obligatorio para
            prestar el servicio.
          </p>

          <h2>5. Cesión y destinatarios</h2>
          <p>Compartimos datos con:</p>
          <ul>
            <li><strong>La barbería donde reservás:</strong> nombre, teléfono y correo para que gestionen tu turno.</li>
            <li><strong>Proveedores técnicos:</strong> Supabase (base de datos y autenticación), Vercel (hosting),
              Ultramail (envío de correos), Mercado Pago (pagos) y Google (si iniciás sesión con Google).
              Estos proveedores actúan como encargados del tratamiento bajo contrato.</li>
          </ul>
          <p>
            No vendemos ni cedemos tus datos a terceros para fines publicitarios o de marketing.
          </p>

          <h2>6. Almacenamiento y seguridad</h2>
          <p>
            Los datos se almacenan en servidores seguros. Tomamos medidas técnicas y organizativas
            razonables para proteger tu información. Los datos de las reservas se conservan mientras
            sea necesario para la gestión del turno y obligaciones legales aplicables.
          </p>

          <h2>7. Cookies y tecnologías similares</h2>
          <p>
            Utilizamos cookies y almacenamiento local necesarios para el funcionamiento del servicio
            (por ejemplo, sesión de inicio de sesión y preferencias de interfaz). No usamos cookies
            publicitarias de terceros.
          </p>

          <h2>8. Tus derechos (Ley 25.326)</h2>
          <p>Tenés derecho a:</p>
          <ul>
            <li><strong>Acceso:</strong> conocer qué datos tenemos sobre vos.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de tus datos cuando la ley lo permita.</li>
            <li><strong>Confidencialidad:</strong> oponerte a que tus datos se difundan.</li>
          </ul>
          <p>
            Para ejercer estos derechos podés contactarnos por los canales indicados. También podés
            dirigirte a la Dirección Nacional de Protección de Datos Personales de Argentina.
          </p>

          <h2>9. Menores</h2>
          <p>
            El servicio está dirigido a mayores de edad. No recopilamos intencionalmente datos de
            menores. Si detectamos que un menor ha proporcionado datos sin consentimiento parental,
            procederemos a eliminarlos.
          </p>

          <h2>10. Cambios en esta política</h2>
          <p>
            Podemos actualizar esta política. Los cambios se publicarán en esta página con la fecha
            de última actualización. Te recomendamos revisarla periódicamente.
          </p>

          <h2>11. Enlaces a terceros</h2>
          <p>
            El servicio utiliza Mercado Pago y Google para pagos e inicio de sesión. Sus prácticas
            de privacidad se rigen por sus propias políticas. Consultá las de{' '}
            <a href="https://www.mercadopago.com.ar/privacidad" target="_blank" rel="noopener noreferrer" >
              Mercado Pago
            </a>{' '}
            y de{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" >
              Google
            </a>.
          </p>
        </div>
      </main>
    </div>
  );
}
