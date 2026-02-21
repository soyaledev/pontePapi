import { Suspense } from 'react';
import { MercadoPagoCallbackClient } from './MercadoPagoCallbackClient';

export default function MercadoPagoCallbackPage() {
  return (
    <Suspense fallback={<p style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</p>}>
      <MercadoPagoCallbackClient />
    </Suspense>
  );
}
