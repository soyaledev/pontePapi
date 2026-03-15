export type Step = {
  id: string;
  number: number;
  title: string;
  description: string;
};

export const clientSteps: Step[] = [
  {
    id: 'buscar',
    number: 1,
    title: 'Buscar',
    description: 'Barberías por nombre o zona.',
  },
  {
    id: 'elegir',
    number: 2,
    title: 'Elegir',
    description: 'Servicio, barbero, día y horario.',
  },
  {
    id: 'reservar',
    number: 3,
    title: 'Reservar',
    description: 'Sin cuenta. Nombre, teléfono y listo. Seña si aplica.',
  },
  {
    id: 'listo',
    number: 4,
    title: 'Listo',
    description: 'Comprobante por email o en pantalla.',
  },
];
