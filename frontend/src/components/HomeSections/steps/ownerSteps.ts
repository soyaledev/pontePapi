import type { Step } from './clientSteps';

export const ownerSteps: Step[] = [
  {
    id: 'registrarse',
    number: 1,
    title: 'Registrarse',
    description: 'Creá tu cuenta en segundos con email o Google.',
  },
  {
    id: 'crear',
    number: 2,
    title: 'Crear barbería',
    description: 'Nombre, dirección, foto y listo.',
  },
  {
    id: 'configurar',
    number: 3,
    title: 'Configurar',
    description: 'Servicios, horarios, barberos y opción de seña.',
  },
  {
    id: 'recibir',
    number: 4,
    title: 'Recibir turnos',
    description: 'Reservas 24/7 sin atender el teléfono.',
  },
];
