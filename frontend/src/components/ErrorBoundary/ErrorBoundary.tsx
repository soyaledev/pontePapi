'use client';

import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    const report = async () => {
      try {
        await fetch('/api/admin/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            path: typeof window !== 'undefined' ? window.location.pathname : '',
            metadata: { componentStack: errorInfo.componentStack?.slice(0, 500) },
          }),
        });
      } catch {
        // Ignorar fallo al reportar
      }
    };
    report();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            color: '#fff',
            background: '#1a1a1a',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '1.1rem' }}>
            Algo salió mal. El error fue registrado.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              background: '#e94560',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
