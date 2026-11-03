/**
 * Linha do tempo da animação "Como funciona" da página inicial.
 * Tudo é função do progresso do scroll (0 a 1), em coordenadas do mundo SVG,
 * para a cena poder ser desenhada em qualquer ponto sem estado.
 */

export interface JourneyStep {
  id: string;
  title: string;
  text: string;
  /** Intervalo do progresso em que a etapa está ativa. */
  range: readonly [start: number, end: number];
  /** Ponto do progresso que melhor resume a etapa (usado nas imagens estáticas). */
  snapshot: number;
}

export const journeySteps: JourneyStep[] = [
  {
    id: "recolha",
    title: "Pedido e recolha",
    text: "Escolhe a agência, descreve a carga e entrega-a ou pede a recolha em casa.",
    range: [0, 0.18],
    snapshot: 0.12,
  },
  {
    id: "transporte",
    title: "Etiqueta QR e transporte",
    text: "Cada volume recebe um código único e segue para o armazém da agência.",
    range: [0.18, 0.38],
    snapshot: 0.28,
  },
  {
    id: "contentor",
    title: "Consolidação no contentor",
    text: "A carga é consolidada e o contentor é selado, com manifesto associado.",
    range: [0.38, 0.55],
    snapshot: 0.47,
  },
  {
    id: "embarque",
    title: "Embarque no navio",
    text: "O contentor sobe a bordo e o manifesto chega a Cabo Verde antes do navio.",
    range: [0.55, 0.72],
    snapshot: 0.64,
  },
  {
    id: "levantamento",
    title: "Levantamento em Cabo Verde",
    text: "Recebe aviso quando estiver liberada e levanta com documento e código.",
    range: [0.72, 1],
    snapshot: 1,
  },
];

export function stepIndexAt(progress: number): number {
  const index = journeySteps.findIndex((step) => progress < step.range[1]);
  return index === -1 ? journeySteps.length - 1 : index;
}

type Stop = readonly [at: number, value: number];

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** Interpola entre paragens ordenadas por progresso, com suavização em cada troço. */
export function track(progress: number, stops: readonly Stop[]): number {
  if (progress <= stops[0][0]) return stops[0][1];

  for (let index = 1; index < stops.length; index++) {
    const [endAt, endValue] = stops[index];
    if (progress <= endAt) {
      const [startAt, startValue] = stops[index - 1];
      const span = endAt - startAt;
      const t = span === 0 ? 1 : (progress - startAt) / span;
      return startValue + (endValue - startValue) * easeInOut(t);
    }
  }

  return stops[stops.length - 1][1];
}

// Medidas partilhadas pela cena.
export const GROUND_Y = 470;
export const CONTAINER = { width: 150, height: 64, homeX: 2230 } as const;
export const SHIP = { dockX: 2860, deckY: 450, slotX: 270 } as const;
const CARRY_BOTTOM = 444;
const BOX_HOME_X = 352;

export const cameraX = (p: number) =>
  track(p, [
    [0.18, 0],
    [0.37, 1650],
    [0.555, 1650],
    [0.7, 2150],
    [0.73, 2150],
    [0.98, 4200],
  ]);

/** Traseira da carrinha (lado esquerdo); a carrinha segue para a direita. */
export const vanX = (p: number) =>
  track(p, [
    [0.18, 520],
    [0.36, 1950],
  ]);

/** Rotação das rodas acompanha a distância percorrida (raio 14). */
export const wheelRotation = (p: number) => ((vanX(p) - 520) / (2 * Math.PI * 14)) * 360;

const agentStops: Stop[] = [
  [0, 610],
  [0.06, BOX_HOME_X],
  [0.09, BOX_HOME_X],
  [0.15, 545],
  [0.17, 650],
  [0.385, 1980],
  [0.39, 1980],
  [0.46, 2195],
  [0.48, 2195],
  [0.53, 2110],
];

export const agentX = (p: number) => track(p, agentStops);

export const agentOpacity = (p: number) =>
  track(p, [
    [0.165, 1],
    [0.175, 0],
    [0.385, 0],
    [0.395, 1],
  ]);

/** 1 a olhar para a direita, -1 para a esquerda, conforme o sentido em que anda. */
export const agentFacing = (p: number) => (agentX(p + 0.001) < agentX(p) - 0.01 ? -1 : 1);

/** As pernas só balançam enquanto o agente se desloca; o passo segue a distância. */
export const legSwing = (p: number) => {
  const moving = Math.abs(agentX(p + 0.001) - agentX(p)) > 0.01;
  return moving ? Math.sin(agentX(p) / 7) * 22 : 0;
};

export interface BoxState {
  /** Centro horizontal da caixa. */
  x: number;
  /** Base da caixa. */
  bottom: number;
  opacity: number;
}

export function boxState(p: number): BoxState {
  if (p < 0.07) return { x: BOX_HOME_X, bottom: GROUND_Y, opacity: 1 };
  if (p < 0.15) {
    return { x: agentX(p), bottom: track(p, [[0.07, GROUND_Y], [0.09, CARRY_BOTTOM]]), opacity: 1 };
  }
  if (p < 0.39) {
    // Entra na carrinha e viaja escondida até ao armazém.
    return {
      x: track(p, [[0.15, 545], [0.165, 590]]),
      bottom: CARRY_BOTTOM,
      opacity: track(p, [[0.15, 1], [0.165, 0]]),
    };
  }
  if (p < 0.46) {
    return { x: agentX(p), bottom: CARRY_BOTTOM, opacity: track(p, [[0.39, 0], [0.405, 1]]) };
  }
  return {
    x: track(p, [[0.46, 2195], [0.48, CONTAINER.homeX + 30]]),
    bottom: track(p, [[0.46, CARRY_BOTTOM], [0.48, GROUND_Y - 4]]),
    opacity: track(p, [[0.47, 1], [0.48, 0]]),
  };
}

export const qrLabelScale = (p: number) => track(p, [[0.11, 0], [0.13, 1]]);

/** Etiqueta com o código do pedido que acompanha a carrinha. */
export const vanTagOpacity = (p: number) =>
  track(p, [
    [0.18, 0],
    [0.2, 1],
    [0.34, 1],
    [0.36, 0],
  ]);

/** 0 com as portas abertas, 1 fechadas. */
export const containerDoors = (p: number) => track(p, [[0.48, 0], [0.51, 1]]);

export const sealScale = (p: number) => track(p, [[0.51, 0], [0.53, 1]]);

const slotCenterX = SHIP.dockX + SHIP.slotX + CONTAINER.width / 2;
const pickupHookY = GROUND_Y - CONTAINER.height - 8;
const deckHookY = SHIP.deckY - CONTAINER.height - 8;

export const trolleyX = (p: number) =>
  track(p, [
    [0.55, 2900],
    [0.58, CONTAINER.homeX + CONTAINER.width / 2],
    [0.62, CONTAINER.homeX + CONTAINER.width / 2],
    [0.67, slotCenterX],
    [0.71, slotCenterX],
    [0.75, 2900],
  ]);

/** Topo do spreader da grua; o contentor fica pendurado 8 unidades abaixo. */
export const hookY = (p: number) =>
  track(p, [
    [0.55, 260],
    [0.58, pickupHookY],
    [0.59, pickupHookY],
    [0.62, 230],
    [0.67, 230],
    [0.71, deckHookY],
    [0.74, 260],
  ]);

export interface ContainerState {
  x: number;
  top: number;
  /** Depois de pousado no navio, o contentor passa a ser desenhado com o navio. */
  onShip: boolean;
}

export function containerState(p: number): ContainerState {
  if (p >= 0.71) return { x: SHIP.dockX + SHIP.slotX, top: SHIP.deckY - CONTAINER.height, onShip: true };
  if (p >= 0.59) return { x: trolleyX(p) - CONTAINER.width / 2, top: hookY(p) + 8, onShip: false };
  return { x: CONTAINER.homeX, top: GROUND_Y - CONTAINER.height, onShip: false };
}

export const shipX = (p: number) =>
  track(p, [
    [0.72, SHIP.dockX],
    [0.97, 4320],
  ]);

export const sunsetOpacity = (p: number) => track(p, [[0.72, 0], [1, 0.7]]);

export const arrivalPinScale = (p: number) => track(p, [[0.93, 0], [0.97, 1]]);
