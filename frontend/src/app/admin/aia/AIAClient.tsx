'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import styles from './AIA.module.css';

const SECTIONS = [
  { id: 'overview', title: 'Visión general' },
  { id: 'ui-tema', title: 'UI y tema' },
  { id: 'env', title: 'Variables de entorno' },
  { id: 'database', title: 'Base de datos' },
  { id: 'pagos', title: 'Pagos y seña' },
  { id: 'reservas', title: 'Reservas' },
  { id: 'turnos', title: 'Turnos y citas' },
  { id: 'panel-dueno', title: 'Panel dueño' },
  { id: 'configuracion', title: 'Configuración' },
  { id: 'apis', title: 'APIs y rutas' },
  { id: 'admin', title: 'Panel admin' },
  { id: 'flujos', title: 'Flujos completos' },
  { id: 'errores', title: 'Errores y logs' },
] as const;

export function AIAClient() {
  const [search, setSearch] = useState('');
  const [copyAllState, setCopyAllState] = useState(false);
  const [copySectionId, setCopySectionId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    sections.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [search]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.toLowerCase().trim();
    return SECTIONS.filter((s) =>
      s.title.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [search]);

  const visibleIds = useMemo(
    () => new Set<string>(filteredSections.map((s) => s.id)),
    [filteredSections]
  );

  const sectionClass = (id: string) =>
    [styles.section, search.trim() && !visibleIds.has(id) && styles.sectionHidden]
      .filter(Boolean)
      .join(' ');

  const copyAll = useCallback(async () => {
    const sections = document.querySelectorAll('[data-aia-section]');
    const parts: string[] = [];
    for (const s of Array.from(sections)) {
      const title = s.querySelector('h2')?.textContent?.trim();
      const body = s.querySelector('[data-aia-section-body]')?.textContent?.trim();
      if (title || body) parts.push([title, body].filter(Boolean).join('\n\n'));
    }
    const text = parts.join('\n\n---\n\n');
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopyAllState(true);
      setTimeout(() => setCopyAllState(false), 2000);
    }
  }, []);

  const copySection = useCallback(async (id: string) => {
    const el = document.getElementById(id);
    const text = el?.querySelector('[data-aia-section-body]')?.textContent?.trim() ?? el?.textContent?.trim();
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopySectionId(id);
      setTimeout(() => setCopySectionId(null), 2000);
    }
  }, []);

  return (
    <div className={styles.wrap}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>Índice</p>
        <div className={styles.searchWrap}>
          <input
            type="search"
            placeholder="Buscar tema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
            aria-label="Buscar en documentación"
          />
        </div>
        <button
          type="button"
          onClick={copyAll}
          className={`${styles.copyAllBtn} ${copyAllState ? styles.copied : ''}`}
        >
          {copyAllState ? '✓ Copiado' : 'Copiar todo'}
        </button>
        <nav className={styles.tocNav} aria-label="Temas">
          {filteredSections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`${styles.tocLink} ${s.id === activeSectionId ? styles.tocLinkActive : ''}`}
            >
              {s.title}
            </a>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>AIA — Ayuda Inteligencia Artificial</h1>
          <p className={styles.subtitle}>
            Documentación exhaustiva del sistema PontePapi para consumo por IA. Diseñada para que la IA pueda leer, entender, ayudar, controlar, sugerir ideas y revisar cada detalle de cada proceso: pagos, reservas, turnos, configuración, APIs, flujos y errores. Usá <strong>Copiar todo</strong> para llevar toda la documentación al portapapeles, o <strong>Copiar</strong> en cada sección para copiar solo ese tema.
          </p>
        </div>

        <article>
        <section id="overview" className={sectionClass('overview')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>1. Visión general del sistema</h2>
            <button
              type="button"
              onClick={() => copySection('overview')}
              className={`${styles.copySectionBtn} ${copySectionId === 'overview' ? styles.copied : ''}`}
              title="Copiar este tema"
            >
              {copySectionId === 'overview' ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <p>
            <strong>PontePapi</strong> (también referido como BarberTurns en el repo) es una aplicación de reservas para barberías. Permite a dueños crear barberías, configurar servicios, horarios y cobrar seña por Mercado Pago. Los clientes reservan turnos desde la página pública de cada barbería sin necesidad de cuenta.
          </p>
          <h3>Stack técnico</h3>
          <ul>
            <li><strong>Frontend:</strong> Next.js 14+ (App Router), React, TypeScript. Carpeta: <code>frontend/src/</code></li>
            <li><strong>Backend/DB:</strong> Supabase (PostgreSQL, Auth, RLS). Tipos en <code>lib/supabase/database.types.ts</code></li>
            <li><strong>Pagos:</strong> Mercado Pago Checkout Pro, OAuth por barbería (cada barbería vincula su cuenta MP)</li>
            <li><strong>Email:</strong> Ultramail para comprobantes de reserva</li>
          </ul>
          <h3>Roles y permisos</h3>
          <ul>
            <li><strong>Cliente:</strong> Anónimo. Reserva sin cuenta. Solo proporciona nombre, teléfono, email. No hay auth.</li>
            <li><strong>Dueño:</strong> Auth Supabase. Crea barberías, configura servicios/horarios/seña, ve turnos. Relación: owner_id en barbershops apunta a auth.users.id.</li>
            <li><strong>Admin:</strong> Email en tabla <code>admin_emails</code>. Función <code>isAdmin(email)</code> en <code>lib/admin.ts</code>. Acceso a /admin. Redirect automático desde /dueno si isAdmin.</li>
          </ul>
          <h3>Estructura de carpetas clave (frontend/src/)</h3>
          <ul>
            <li><code>app/</code> — Rutas Next.js (page.tsx, layout.tsx). ScrollToTop en layout raíz para scroll al inicio en navegación.</li>
            <li><code>app/api/</code> — API Routes: create-preference, webhook, confirm-payment, comprobante, send-comprobante-email, cancel, oauth-callback, dueno/desvincular-mp, dueno/eliminar-cuenta, admin/log-error, admin/resolve-error</li>
            <li><code>app/dueno/</code> — Panel dueño: login, registro, turnos, barbería/[slug], configuracion, mercadopago/callback</li>
            <li><code>app/reservar/</code> — Flujo reserva cliente: [slug]/ReservarFlow, confirmado/ComprobanteReserva</li>
            <li><code>app/barberia/</code> — Página pública barbería [slug]</li>
            <li><code>app/admin/</code> — Panel admin: usuarios, barberias, pagos, errores, aia</li>
            <li><code>lib/</code> — supabase (client, server, admin), format, error-logger, barbershop-visibility, admin, theme, email/send-comprobante, appointments (isAppointmentExpired), payments (isPaymentExpired, calculateNetAmount, verifyWebhookSignature)</li>
            <li><code>components/</code> — ThemeProvider, ThemeToggle, ThemeAwareLogo (logos según tema), Footer, FooterWrapper (muestra footer en /, /admin/*, /dueno/* salvo /dueno/turnos; conBottomNav en dueno para espacio de barra inferior)</li>
          </ul>
          <h3>Variables de entorno relevantes</h3>
          <p>Archivo: <code>.env.local</code> o <code>.env.local.example</code></p>
          <ul>
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code></li>
            <li><code>NEXT_PUBLIC_MP_CLIENT_ID</code>, <code>MP_CLIENT_SECRET</code>, <code>NEXT_PUBLIC_MP_REDIRECT_URI</code> (OAuth MP)</li>
            <li><code>MERCADOPAGO_ACCESS_TOKEN</code> (plataforma, para webhook), <code>MERCADOPAGO_WEBHOOK_SECRET</code> (verificación firma)</li>
            <li><code>NEXT_PUBLIC_APP_URL</code> o <code>VERCEL_URL</code> (URL base para redirects)</li>
            <li><code>ULTRAMAIL_API_KEY</code>, <code>ULTRAMAIL_TEMPLATE_ID</code> (emails)</li>
          </ul>
          </div>
        </section>

        <section id="ui-tema" className={sectionClass('ui-tema')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>2. UI y tema (modo oscuro/claro)</h2>
            <button type="button" onClick={() => copySection('ui-tema')} className={`${styles.copySectionBtn} ${copySectionId === 'ui-tema' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'ui-tema' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <h3>Paleta de colores</h3>
          <p>Archivo: <code>frontend/src/app/globals.css</code>. Paleta: <code>#e94560</code> (acento), <code>#16213e</code> (navy), <code>#0f3460</code> (azul oscuro), <code>#e9ecef</code> (gris claro).</p>
          <h3>Tema oscuro / claro</h3>
          <ul>
            <li><strong>ThemeProvider</strong> (components/ThemeProvider): contexto para theme (dark|light). Script en &lt;head&gt; del layout raíz evita parpadeo al cargar (leer localStorage antes de paint).</li>
            <li><strong>ThemeToggle</strong>: switch en Footer (sol/luna). Almacén: localStorage <code>pontepapi-theme</code>.</li>
            <li><strong>Variables CSS:</strong> <code>:root</code> = tema oscuro (default). <code>[data-theme='light']</code> sobrescribe. Usar siempre variables: --bg-primary, --bg-secondary, --text, --text-muted, --text-faint, --border, --accent, --bg-input, --bg-input-hover, --bg-elevated, etc.</li>
            <li>Evitar colores hardcodeados (#333, #f8f8f8). Botones, inputs y textos deben usar variables para respetar ambos temas.</li>
          </ul>
          <h3>Footer (FooterWrapper)</h3>
          <ul>
            <li>Se muestra en: <code>/</code>, <code>/admin/*</code>, <code>/dueno/*</code> excepto <code>/dueno/turnos</code>.</li>
            <li>En rutas dueno (panel, configuración): <code>Footer</code> recibe <code>withBottomNav=true</code>. Clase <code>footerWithBottomNav</code> añade padding-bottom extra para no superponerse con DuenoNav (barra fija inferior).</li>
          </ul>
          <h3>ThemeAwareLogo</h3>
          <p>Componente (components/ThemeAwareLogo): muestra LogoFooter.webp en tema oscuro, LogoFooterDM.webp en claro. Usado en Footer, header cuenta dueño (dashboard layout), WelcomeOverlay. Alturas: Footer 52px, cuenta dueño 35px.</p>
          <h3>Login / Registro</h3>
          <p>Botón &quot;Continuar con Google&quot;: usa <code>color: var(--text)</code>, <code>background: var(--bg-elevated)</code>, <code>hover: var(--bg-input-hover)</code>. Spinner: <code>border: var(--border)</code>, <code>border-top-color: #4285f4</code>. Ícono Google mantiene colores oficiales.</p>
          </div>
        </section>

        <section id="env" className={sectionClass('env')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>3. Variables de entorno</h2>
            <button type="button" onClick={() => copySection('env')} className={`${styles.copySectionBtn} ${copySectionId === 'env' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'env' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <p>Archivo de referencia: <code>frontend/.env.local.example</code>. Todas las variables deben estar en <code>.env.local</code> para desarrollo local.</p>
          <h3>Supabase</h3>
          <ul>
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code> — URL del proyecto Supabase (ej: https://xxx.supabase.co)</li>
            <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> — Clave anónima (pública, usada en cliente)</li>
            <li><code>SUPABASE_SERVICE_ROLE_KEY</code> — Clave service_role (secreta, solo server-side). Usada en lib/supabase/admin.ts para bypassear RLS en APIs.</li>
          </ul>
          <h3>Mercado Pago</h3>
          <ul>
            <li><code>NEXT_PUBLIC_MP_CLIENT_ID</code> o <code>MP_CLIENT_ID</code> — App ID del marketplace MP (OAuth)</li>
            <li><code>MP_CLIENT_SECRET</code> — Client secret (OAuth)</li>
            <li><code>NEXT_PUBLIC_MP_REDIRECT_URI</code> — URL de callback OAuth. Producción: https://barbert.vercel.app/dueno/mercadopago/callback. Local: http://localhost:3000/dueno/mercadopago/callback</li>
            <li><code>MERCADOPAGO_ACCESS_TOKEN</code> — Token de plataforma (solo para webhook). Si no está, el webhook responde 200 sin procesar.</li>
            <li><code>MERCADOPAGO_WEBHOOK_SECRET</code> — Secret para verificar firma x-signature del webhook MP. Si no está, no se valida la firma.</li>
          </ul>
          <h3>URLs base</h3>
          <ul>
            <li><code>VERCEL_URL</code> — Auto-inyectada en Vercel. Usada en create-preference para back_urls.</li>
            <li><code>NEXT_PUBLIC_VERCEL_URL</code> — Alternativa para builds</li>
            <li><code>FRONTEND_URL</code> — Fallback (ej: http://localhost:3000)</li>
            <li><code>NEXT_PUBLIC_APP_URL</code> — Usada en lib/email/send-comprobante.ts para links en el email</li>
          </ul>
          <h3>Ultramail (emails)</h3>
          <ul>
            <li><code>ULTRAMAIL_API_KEY</code> — API key de Ultramail</li>
            <li><code>ULTRAMAIL_TEMPLATE_ID</code> — ID del template de comprobante</li>
          </ul>
          </div>
        </section>

        <section id="database" className={sectionClass('database')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>4. Base de datos (Supabase)</h2>
            <button type="button" onClick={() => copySection('database')} className={`${styles.copySectionBtn} ${copySectionId === 'database' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'database' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <p>Tipos en <code>lib/supabase/database.types.ts</code>. Enum appointment_status: pending | pending_payment | confirmed | cancelled | completed.</p>
          <h3>Tablas y relaciones</h3>
          <dl className={styles.defList}>
            <dt>barbershops</dt>
            <dd>id, name, slug (único, URL), owner_id (auth.users.id), address, city, phone, photo_url, monto_sena, requiere_sena, sena_comision_cliente, sena_opcional, slot_minutes (duración slot en min), mp_access_token, mp_refresh_token, mp_user_id. Relación: 1 owner → N barbershops.</dd>
            <dt>barbers</dt>
            <dd>barbershop_id, name, order, photo_url. Un barbero pertenece a una barbería.</dd>
            <dt>services</dt>
            <dd>barbershop_id, name, price, duracion_min. Servicios por barbería.</dd>
            <dt>schedules</dt>
            <dd>barbershop_id, day_of_week (0=domingo, 6=sábado), open_time, close_time (formato HH:MM:SS). Un registro por día abierto.</dd>
            <dt>appointments</dt>
            <dd>barbershop_id, service_id, barber_id (nullable), fecha (YYYY-MM-DD), slot_time (HH:MM:SS), cliente_nombre, cliente_telefono, cliente_email, cliente_instagram, estado, mp_payment_id, mp_preference_id, monto_sena_pagado (transaction_amount, bruto), monto_sena_neto (depositado al barbero), monto_sena_servicio (crédito de seña hacia el servicio, guardado al confirmar; usado para restante = precio_servicio - monto_sena_servicio).</dd>
            <dt>owner_profiles</dt>
            <dd>id = auth.uid, email. Perfil extendido del dueño.</dd>
            <dt>admin_emails</dt>
            <dd>email. Lista blanca para /admin. Consulta en lib/admin.ts isAdmin().</dd>
            <dt>error_logs</dt>
            <dd>source (api|client|webhook), path, method, message, stack, statusCode, metadata (JSON), resolved (boolean).</dd>
          </dl>
          <h3>Índices de seguridad (appointments)</h3>
          <p>Índices únicos parciales evitan doble reserva confirmada en el mismo horario:</p>
          <ul>
            <li><code>idx_appointments_unique_confirmed_with_barber</code>: (barbershop_id, barber_id, fecha, slot_time) WHERE estado='confirmed' AND barber_id IS NOT NULL</li>
            <li><code>idx_appointments_unique_confirmed_no_barber</code>: (barbershop_id, fecha, slot_time) WHERE estado='confirmed' AND barber_id IS NULL</li>
          </ul>
          </div>
        </section>

        <section id="pagos" className={sectionClass('pagos')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>5. Pagos y seña</h2>
            <button type="button" onClick={() => copySection('pagos')} className={`${styles.copySectionBtn} ${copySectionId === 'pagos' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'pagos' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <h3>Configuración de seña (barbershop)</h3>
          <p>Archivo: <code>lib/supabase/database.types.ts</code>. Campos en barbershops:</p>
          <ul>
            <li><strong>requiere_sena:</strong> boolean. Si true, el cliente debe pagar seña para confirmar.</li>
            <li><strong>sena_opcional:</strong> boolean. Si true, el cliente puede elegir reservar sin pagar.</li>
            <li><strong>monto_sena:</strong> number. Lo que el barbero quiere recibir neto (después de comisiones).</li>
            <li><strong>sena_comision_cliente:</strong> boolean. true = cliente paga más para cubrir ~10,61% MP; false = barbero absorbe la comisión.</li>
          </ul>
          <h3>Creación de preferencia MP</h3>
          <p><strong>Archivo:</strong> <code>app/api/mercadopago/create-preference/route.ts</code>. POST. Body: appointmentId, barbershopId, description.</p>
          <p><strong>Proceso:</strong> Valida expiración (isPaymentExpired): si pending_payment &gt; 15 min, cancela appointment y responde 410. Obtiene barbershop (mp_access_token, monto_sena, sena_comision_cliente). Si sena_comision_cliente: amount = ceil(monto_sena / 0.8939 / 50) * 50 (redondeo a 50). marketplace_fee = round(amount * 0.03 + surplus). Si no: amount = monto_sena, marketplace_fee = round(amount * 0.03). Crea preferencia en MP con external_reference = appointmentId. Guarda mp_preference_id en appointment.</p>
          <h3>Confirmación de pago</h3>
          <p><strong>confirm-payment:</strong> <code>app/api/appointments/{'[id]'}/confirm-payment/route.ts</code>. POST. Body: payment_id. Idempotente: si ya confirmed retorna ok. Si isPaymentExpired (pending_payment &gt; 15 min): cancela y responde 410. Protección conflicto: antes de confirmar busca otro appointment confirmado en mismo (barbershop_id, barber_id, fecha, slot_time); si existe, cancela el actual y responde 409. Usa token de la barbería (mp_access_token). Llama GET /v1/payments/{'{id}'} a MP. Si status=approved: guarda monto_sena_pagado, monto_sena_neto (calculateNetAmount), monto_sena_servicio (barbershop.monto_sena), estado=confirmed. Envía email comprobante.</p>
          <p><strong>webhook:</strong> <code>app/api/mercadopago/webhook/route.ts</code>. POST. Verifica firma x-signature si MERCADOPAGO_WEBHOOK_SECRET está configurado. Usa MERCADOPAGO_ACCESS_TOKEN (plataforma). Recibe type=payment, data.id. Obtiene appointment por external_reference o mp_preference_id. <strong>Idempotencia:</strong> si el appointment ya está confirmed, no sobreescribe (evita que valores correctos de confirm-payment, que usa token del vendedor, sean reemplazados por datos del token plataforma). Misma protección de conflicto que confirm-payment. Si no confirmado: guarda monto_sena_pagado, monto_sena_neto, monto_sena_servicio, estado=confirmed. Envía email.</p>
          <h3>Cálculo monto_sena_neto (lo que recibe el barbero)</h3>
          <ul>
            <li>Si sena_comision_cliente: monto_sena_neto = monto_sena (el barbero recibe exactamente lo configurado).</li>
            <li>Si no: monto_sena_neto = payment.transaction_details.net_received_amount si existe (API MP); si no, round(transaction_amount * 0.8939) como estimación.</li>
          </ul>
          <h3>Comprobante y restante</h3>
          <p><strong>Archivos:</strong> ComprobanteReserva.tsx, send-comprobante.ts, comprobante/route.ts. Seña pagada (lo que ve el cliente) = monto_sena_pagado. <strong>Restante a abonar en barbería = precio_servicio - monto_sena_servicio</strong> (NO monto_sena_neto). monto_sena_servicio es el crédito de la seña hacia el servicio, guardado al confirmar (barbershop.monto_sena). Ejemplo: servicio 10.000, monto_sena_servicio 1.000 → restante = 9.000. Esto aplica tanto si el cliente paga comisión (paga más, barbero recibe exacto) como si el barbero absorbe (cliente paga monto_sena, barbero recibe menos por MP).</p>
          </div>
        </section>

        <section id="reservas" className={sectionClass('reservas')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>6. Reservas</h2>
            <button type="button" onClick={() => copySection('reservas')} className={`${styles.copySectionBtn} ${copySectionId === 'reservas' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'reservas' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <h3>Flujo cliente (paso a paso)</h3>
          <ol>
            <li><strong>/</strong> (page.tsx) o <strong>/buscar</strong>: listado de barberías. Usa checkBarbershopVisibility. Archivo: app/page.tsx, app/buscar/page.tsx.</li>
            <li><strong>/barberia/[slug]</strong>: ficha pública. Muestra servicios, barberos, horarios. Link a reservar. app/barberia/[slug]/page.tsx.</li>
            <li><strong>/reservar/[slug]</strong>: ReservarFlow.tsx. Pasos: 1) elegir servicio, 2) barbero (si hay más de uno), 3) calendario (getCalendarDays, MAX_DAYS_AHEAD=30), 4) slot (getSlotsForBarber excluye ocupados: confirmed + pending_payment con &lt;15 min; los pending_payment expirados no bloquean), 5) datos cliente (nombre, teléfono, email, instagram). Scroll al inicio en cada cambio de paso. Inserta appointment. Si requiere_sena: estado=pending_payment, llama create-preference, redirige a init_point MP. restanteEnLocal = precio_servicio - montoSena (barbershop.monto_sena).</li>
            <li>MP procesa pago. Redirect a /reservar/confirmado?appointmentId=...&payment_id=...&status=approved (o pending).</li>
            <li><strong>/reservar/confirmado</strong>: ComprobanteReserva. Llama confirm-payment si hay payment_id. Poll cada 2s hasta estado=confirmed. Muestra comprobante con seña pagada, restante, datos turno.</li>
          </ol>
          <h3>Visibilidad barbería</h3>
          <p><strong>Archivo:</strong> lib/barbershop-visibility.ts. checkBarbershopVisibility(): visible si hasHorarios (schedulesCount ≥ 1), hasServicios (servicesCount ≥ 1), hasPagos (si requiere_sena entonces mpLinked; si no requiere_sena, true).</p>
          </div>
        </section>

        <section id="turnos" className={sectionClass('turnos')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>7. Turnos y citas</h2>
            <button type="button" onClick={() => copySection('turnos')} className={`${styles.copySectionBtn} ${copySectionId === 'turnos' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'turnos' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <h3>Estados (appointment_status)</h3>
          <ul>
            <li><strong>pending:</strong> Reserva sin seña, pendiente de confirmación</li>
            <li><strong>pending_payment:</strong> Esperando pago de seña en MP</li>
            <li><strong>confirmed:</strong> Pago aprobado o sin seña confirmada</li>
            <li><strong>cancelled:</strong> Cancelado</li>
            <li><strong>completed:</strong> Turno realizado</li>
          </ul>
          <h3>Slots</h3>
          <p>Se generan desde schedules (open_time, close_time) y slot_minutes de la barbería. Se excluyen: appointments confirmed; appointments pending_payment creados hace menos de 15 minutos (bloqueo temporal). Los pending_payment con más de 15 min (isAppointmentExpired en lib/appointments) no bloquean el slot.</p>
          <h3>Consistencia y doble reserva</h3>
          <p><strong>lib/appointments:</strong> isAppointmentExpired(appointment) — true si estado=pending_payment y created_at &gt; 15 min.</p>
          <p><strong>Protección al confirmar:</strong> confirm-payment y webhook verifican conflicto antes de confirmar. Si ya existe un appointment confirmed en el mismo (barbershop_id, barber_id, fecha, slot_time), cancelan el actual y responden 409 (confirm-payment) o no confirman (webhook).</p>
          <p><strong>Índice único:</strong> Supabase tiene índices parciales que impiden dos appointments confirmed en el mismo horario.</p>
          </div>
        </section>

        <section id="panel-dueno" className={sectionClass('panel-dueno')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>8. Panel dueño</h2>
            <button type="button" onClick={() => copySection('panel-dueno')} className={`${styles.copySectionBtn} ${copySectionId === 'panel-dueno' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'panel-dueno' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <h3>Rutas</h3>
          <ul>
            <li>/dueno/login, /dueno/registro</li>
            <li>/dueno (redirect a /dueno/turnos si no admin)</li>
            <li>/dueno/turnos: listado de turnos por barbería</li>
            <li>/dueno/barberia/[slug]: detalle barbería, servicios, horarios, seña</li>
            <li>/dueno/barberia/[slug]/editar: editar datos barbería</li>
            <li>/dueno/barberia/[slug]/finanzas: finanzas (si existe)</li>
            <li>/dueno/configuracion: configuración cuenta</li>
            <li>/dueno/mercadopago/callback: OAuth MP</li>
          </ul>
          <h3>Mercado Pago OAuth</h3>
          <p>Vincular cuenta: redirect a auth.mercadopago. Callback guarda mp_access_token, mp_refresh_token, mp_user_id en barbershop.</p>
          </div>
        </section>

        <section id="configuracion" className={sectionClass('configuracion')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>9. Configuración</h2>
            <button type="button" onClick={() => copySection('configuracion')} className={`${styles.copySectionBtn} ${copySectionId === 'configuracion' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'configuracion' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <h3>Cuenta dueño (/dueno/configuracion)</h3>
          <p>Correo, MP vinculado, eliminar cuenta. <strong>Cambiar contraseña:</strong> solo si <code>user.app_metadata.provider !== 'google'</code>. Si el usuario ingresó con Google (provider=google), la sección «Cambiar contraseña» no se muestra. Si registró con email/password, sí se muestra el formulario.</p>
          <h3>Barbería</h3>
          <p>Nombre, slug, dirección, ciudad, teléfono, foto. slot_minutes (duración por turno).</p>
          <h3>Seña (SenaConfig)</h3>
          <p>requiere_sena, sena_opcional, monto_sena, sena_comision_cliente. Preview: cliente paga X, barbero recibe ~Y (estimación; el monto real lo verás en tu cuenta de Mercado Pago).</p>
          <h3>Servicios</h3>
          <p>CRUD en ServiciosSection. name, price, duracion_min.</p>
          <h3>Horarios</h3>
          <p>CRUD en HorariosSection. Por día de semana: open_time, close_time.</p>
          <h3>Barberos</h3>
          <p>CRUD en barbería. name, order, photo_url.</p>
          </div>
        </section>

        <section id="apis" className={sectionClass('apis')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>10. APIs y rutas</h2>
            <button type="button" onClick={() => copySection('apis')} className={`${styles.copySectionBtn} ${copySectionId === 'apis' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'apis' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <dl className={styles.defList}>
            <dt>POST /api/mercadopago/create-preference</dt>
            <dd>Crear preferencia MP. appointmentId, barbershopId, description.</dd>
            <dt>POST /api/mercadopago/webhook</dt>
            <dd>Webhook MP. type=payment, data.id.</dd>
            <dt>POST /api/appointments/{'[id]'}/confirm-payment</dt>
            <dd>Confirmar pago. payment_id. Respuestas: 409 si slot ya tomado; 410 si pending_payment expiró (&gt;15 min).</dd>
            <dt>GET /api/appointments/{'[id]'}/comprobante</dt>
            <dd>Datos comprobante (appointment + barbershop + service + barber). Incluye monto_sena_servicio para cálculo de restante.</dd>
            <dt>POST /api/appointments/{'[id]'}/send-comprobante-email</dt>
            <dd>Reenviar email comprobante.</dd>
            <dt>POST /api/appointments/cancel</dt>
            <dd>Cancelar turno.</dd>
            <dt>POST /api/dueno/desvincular-mp</dt>
            <dd>Desvincular MP de barbería.</dd>
            <dt>POST /api/dueno/eliminar-cuenta</dt>
            <dd>Eliminar cuenta dueño: borra barberías, barberos, servicios, schedules, appointments del owner; borra owner_profiles; elimina usuario de auth.</dd>
            <dt>GET/POST /api/mercadopago/oauth-callback</dt>
            <dd>OAuth MP.</dd>
            <dt>POST /api/admin/resolve-error</dt>
            <dd>Marcar error como resuelto.</dd>
            <dt>POST /api/admin/log-error</dt>
            <dd>Registrar error.</dd>
          </dl>
          </div>
        </section>

        <section id="admin" className={sectionClass('admin')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>11. Panel admin</h2>
            <button type="button" onClick={() => copySection('admin')} className={`${styles.copySectionBtn} ${copySectionId === 'admin' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'admin' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <p>Acceso: email en admin_emails. Redirect desde /dueno si isAdmin. Sidebar fijo (position: fixed) sin scroll.</p>
          <h3>Rutas</h3>
          <ul>
            <li>/admin: dashboard (usuarios, barberías, turnos, señas, errores 24h)</li>
            <li>/admin/usuarios: listado usuarios auth</li>
            <li>/admin/barberias: listado barberías con visibilidad</li>
            <li>/admin/pagos: pagos de seña</li>
            <li>/admin/errores: error_logs con filtros, resolver</li>
            <li>/admin/aia: esta documentación</li>
          </ul>
          </div>
        </section>

        <section id="flujos" className={sectionClass('flujos')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>12. Flujos completos</h2>
            <button type="button" onClick={() => copySection('flujos')} className={`${styles.copySectionBtn} ${copySectionId === 'flujos' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'flujos' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <h3>Reserva con seña (los paga el cliente)</h3>
          <ol>
            <li>Cliente elige slot → appointment creado pending_payment (slot bloqueado 15 min)</li>
            <li>create-preference: valida expiración; amount=250 (ej), monto_sena=200</li>
            <li>Cliente paga 250 en MP</li>
            <li>confirm-payment (o webhook si llega primero): verifica conflicto (slot ya tomado → cancelar, 409); verifica expiración (410); monto_sena_pagado=250, monto_sena_neto=200, monto_sena_servicio=200, estado=confirmed. Webhook idempotente: si ya confirmed, no sobreescribe.</li>
            <li>Email comprobante. Restante = precio_servicio - monto_sena_servicio (200)</li>
          </ol>
          <h3>Reserva sin seña</h3>
          <p>Appointment creado confirmed directamente. No MP.</p>
          </div>
        </section>

        <section id="errores" className={sectionClass('errores')} data-aia-section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>13. Errores y logs</h2>
            <button type="button" onClick={() => copySection('errores')} className={`${styles.copySectionBtn} ${copySectionId === 'errores' ? styles.copied : ''}`} title="Copiar este tema">{copySectionId === 'errores' ? '✓ Copiado' : 'Copiar'}</button>
          </div>
          <div className={styles.sectionContent} data-aia-section-body>
          <p>error_logs: source (api|client|webhook), path, method, message, stack, statusCode, metadata. resolved (boolean).</p>
          <p>logError() centralizado. Admin puede marcar resolved.</p>
          </div>
        </section>
      </article>
      </main>
    </div>
  );
}
