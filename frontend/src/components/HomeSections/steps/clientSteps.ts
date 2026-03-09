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
    description: 'Encontrá barberías por nombre o zona.',
  },
  {
    id: 'elegir',
    number: 2,
    title: 'Elegir',
    description: 'Seleccioná servicio, barbero, fecha y horario.',
  },
  {
    id: 'reservar',
    number: 3,
    title: 'Reservar',
    description: 'Sin cuenta. Completá nombre, teléfono y listo. Seña según la barbería.',
  },
  {
    id: 'listo',
    number: 4,
    title: '¡Listo!',
    description: 'Recibís el comprobante por email o en pantalla.',
  },
];
