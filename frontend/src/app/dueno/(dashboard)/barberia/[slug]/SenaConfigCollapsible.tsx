'use client';

import { useState } from 'react';
import { formatPeso } from '@/lib/format';
import { SenaConfig } from './SenaConfig';
import styles from './SenaConfigCollapsible.module.css';

type PagoItem = {
  id: string;
  fecha: string;
  slot_time: string;
  cliente_nombre: string;
  monto: number;
};

type Props = {
  barbershopId: string;
  initialRequiereSena: boolean;
  initialSenaOpcional: boolean;
  initialMontoSena: number;
  initialComisionCliente: boolean;
  initialMpLinked: boolean;
  pagos?: PagoItem[];
};

export function SenaConfigCollapsible(props: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const statusLabel = props.initialRequiereSena
    ? props.initialMontoSena > 0
      ? `Seña ${formatPeso(props.initialMontoSena)}`
      : 'Configurar seña'
    : 'Sin seña';

  return (
    <section className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
      >
        <span className={styles.triggerLabel}>Pagos y seña</span>
        <span className={styles.triggerBadge}>{statusLabel}</span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && (
        <div className={styles.content}>
          <SenaConfig {...props} />
        </div>
      )}
    </section>
  );
}
