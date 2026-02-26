/**
 * Lógica de visibilidad pública de la barbería.
 * La cuenta no será visible hasta completar: horarios, (pagos si pide seña) y servicios.
 */

export type VisibilityCheck = {
  hasHorarios: boolean;
  hasServicios: boolean;
  hasPagos: boolean;
  isVisible: boolean;
};

export function checkBarbershopVisibility(params: {
  schedulesCount: number;
  servicesCount: number;
  requiereSena: boolean;
  mpLinked: boolean;
}): VisibilityCheck {
  const { schedulesCount, servicesCount, requiereSena, mpLinked } = params;

  const hasHorarios = schedulesCount >= 1;
  const hasServicios = servicesCount >= 1;
  const hasPagos = requiereSena ? mpLinked : true;

  return {
    hasHorarios,
    hasServicios,
    hasPagos,
    isVisible: hasHorarios && hasServicios && hasPagos,
  };
}
