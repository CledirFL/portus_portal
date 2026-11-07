// Máquinas de estado do volume (secção 3.1) e do contentor (secção 3.2).
// Códigos estáveis na API; os textos visíveis (Rascunho, Recolhido…) ficam no frontend.
// BR 22: transições inválidas são rejeitadas; cada transição regista
// utilizador, data/hora e motivo.

export const volumeStatuses = [
  "draft",
  "collected",
  "consolidated",
  "shipped",
  "arrived",
  "deconsolidated",
  "held",
  "released",
  // Encomenda pequena: a agência em Cabo Verde levanta-a no porto e entrega-a na sua agência.
  "to_agency",
  "at_agency",
  "delivered",
  "abandoned",
] as const;

export type VolumeStatus = (typeof volumeStatuses)[number];

const volumeTransitions: Record<VolumeStatus, readonly VolumeStatus[]> = {
  draft: ["collected"],
  collected: ["consolidated"],
  // Retirar do contentor antes do fecho (recontagem, BR 11) devolve o volume ao armazém.
  consolidated: ["shipped", "collected"],
  shipped: ["arrived"],
  arrived: ["deconsolidated"],
  deconsolidated: ["held", "released", "abandoned"],
  held: ["released", "abandoned"],
  released: ["to_agency", "delivered", "abandoned"],
  to_agency: ["at_agency"],
  at_agency: ["delivered", "abandoned"],
  delivered: [],
  abandoned: [],
};

export const containerStatuses = ["open", "sealed", "shipped", "arrived", "deconsolidated"] as const;

export type ContainerStatus = (typeof containerStatuses)[number];

const containerTransitions: Record<ContainerStatus, readonly ContainerStatus[]> = {
  open: ["sealed"],
  sealed: ["open", "shipped"],
  shipped: ["arrived"],
  arrived: ["deconsolidated"],
  deconsolidated: [],
};

export interface StatusChange<S extends string> {
  from: S;
  to: S;
  userId: string;
  at: string;
  reason?: string;
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: string,
    readonly to: string,
  ) {
    super(`Transição inválida: ${from} → ${to}.`);
    this.name = "InvalidTransitionError";
  }
}

export function nextVolumeStatuses(status: VolumeStatus) {
  return volumeTransitions[status];
}

export function canTransitionVolume(from: VolumeStatus, to: VolumeStatus) {
  return volumeTransitions[from].includes(to);
}

export function canTransitionContainer(from: ContainerStatus, to: ContainerStatus) {
  return containerTransitions[from].includes(to);
}

export function isFinalVolumeStatus(status: VolumeStatus) {
  return volumeTransitions[status].length === 0;
}

interface Transitionable<S extends string> {
  status: S;
  history: StatusChange<S>[];
}

function applyTransition<S extends string, T extends Transitionable<S>>(
  entity: T,
  to: S,
  allowed: boolean,
  actor: { userId: string; reason?: string; at?: string },
): T {
  if (!allowed) {
    throw new InvalidTransitionError(entity.status, to);
  }

  return {
    ...entity,
    status: to,
    history: [
      ...entity.history,
      {
        from: entity.status,
        to,
        userId: actor.userId,
        reason: actor.reason,
        at: actor.at ?? new Date().toISOString(),
      },
    ],
  };
}

export function transitionVolume<T extends Transitionable<VolumeStatus>>(
  volume: T,
  to: VolumeStatus,
  actor: { userId: string; reason?: string; at?: string },
) {
  return applyTransition(volume, to, canTransitionVolume(volume.status, to), actor);
}

export function transitionContainer<T extends Transitionable<ContainerStatus>>(
  container: T,
  to: ContainerStatus,
  actor: { userId: string; reason?: string; at?: string },
) {
  return applyTransition(container, to, canTransitionContainer(container.status, to), actor);
}
