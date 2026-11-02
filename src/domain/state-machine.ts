// Máquinas de estado do volume (secção 3.1) e do contentor (secção 3.2).
// BR 22: transições inválidas são rejeitadas; cada transição regista
// utilizador, data/hora e motivo.

export const volumeStatuses = [
  "Rascunho",
  "Recolhido",
  "Consolidado",
  "Embarcado",
  "Chegado",
  "Desconsolidado",
  "Retido",
  "Liberado",
  "Entregue",
  "Abandonado",
] as const;

export type VolumeStatus = (typeof volumeStatuses)[number];

const volumeTransitions: Record<VolumeStatus, readonly VolumeStatus[]> = {
  Rascunho: ["Recolhido"],
  Recolhido: ["Consolidado"],
  Consolidado: ["Embarcado"],
  Embarcado: ["Chegado"],
  Chegado: ["Desconsolidado"],
  Desconsolidado: ["Retido", "Liberado", "Abandonado"],
  Retido: ["Liberado", "Abandonado"],
  Liberado: ["Entregue", "Abandonado"],
  Entregue: [],
  Abandonado: [],
};

export const containerStatuses = ["Aberto", "Fechado", "Embarcado", "Chegado", "Desconsolidado"] as const;

export type ContainerStatus = (typeof containerStatuses)[number];

const containerTransitions: Record<ContainerStatus, readonly ContainerStatus[]> = {
  Aberto: ["Fechado"],
  Fechado: ["Aberto", "Embarcado"],
  Embarcado: ["Chegado"],
  Chegado: ["Desconsolidado"],
  Desconsolidado: [],
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
