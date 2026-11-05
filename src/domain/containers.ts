// Contentores, capacidade (BR 11) e prazo do manifesto (BR 13).
// Os mesmos ficheiros existem em portus/src/domain para o frontend.

export interface ContainerType {
  /** Código de tamanho e tipo ISO 6346, ex.: 22G1. */
  code: string;
  label: string;
  /** Carga útil máxima em kg. */
  maxWeightKg: number;
  /** Volume interno em m³; null quando não se aplica (flat rack). */
  maxVolumeM3: number | null;
}

// Valores de referência dos armadores; o operador pode ajustar por contentor.
export const containerTypes: readonly ContainerType[] = [
  { code: "22G1", label: "20' standard", maxWeightKg: 28_200, maxVolumeM3: 33.2 },
  { code: "42G1", label: "40' standard", maxWeightKg: 26_700, maxVolumeM3: 67.7 },
  { code: "45G1", label: "40' high cube", maxWeightKg: 26_500, maxVolumeM3: 76.3 },
  { code: "22R1", label: "20' frigorífico", maxWeightKg: 27_400, maxVolumeM3: 28.3 },
  { code: "45R1", label: "40' high cube frigorífico", maxWeightKg: 29_500, maxVolumeM3: 67.9 },
  { code: "22U1", label: "20' open top", maxWeightKg: 28_100, maxVolumeM3: 32.5 },
  { code: "42U1", label: "40' open top", maxWeightKg: 26_600, maxVolumeM3: 66.0 },
  { code: "22P1", label: "20' flat rack", maxWeightKg: 31_000, maxVolumeM3: null },
  { code: "42P1", label: "40' flat rack", maxWeightKg: 39_000, maxVolumeM3: null },
];

export const containerTypeCodes = containerTypes.map((type) => type.code) as [string, ...string[]];

export function getContainerType(code: string) {
  return containerTypes.find((type) => type.code === code);
}

/** FCL: contentor completo de um só carregador; LCL: carga partilhada (grupagem) — BR 40. */
export const loadTypes = ["FCL", "LCL"] as const;
export type LoadType = (typeof loadTypes)[number];

export interface Load {
  weightKg: number;
  volumeM3: number;
}

export interface Capacity {
  maxWeightKg: number;
  maxVolumeM3: number | null;
}

export type CapacityIssue = { measure: "weight" | "volume"; limit: number; total: number };

const round = (value: number, digits: number) => Number(value.toFixed(digits));

/**
 * BR 11: a soma dos volumes não pode exceder a capacidade do contentor nem o limite do BL Master.
 * Devolve o que excede; lista vazia quando cabe.
 */
export function capacityIssues(current: Load, adding: Load, capacity: Capacity): CapacityIssue[] {
  const weight = round(current.weightKg + adding.weightKg, 2);
  const volume = round(current.volumeM3 + adding.volumeM3, 3);
  const issues: CapacityIssue[] = [];
  if (weight > capacity.maxWeightKg) {
    issues.push({ measure: "weight", limit: capacity.maxWeightKg, total: weight });
  }
  if (capacity.maxVolumeM3 !== null && volume > capacity.maxVolumeM3) {
    issues.push({ measure: "volume", limit: capacity.maxVolumeM3, total: volume });
  }
  return issues;
}

export function describeCapacityIssue(issue: CapacityIssue, of: string) {
  return issue.measure === "weight"
    ? `Peso total ${issue.total} kg excede o limite de ${issue.limit} kg ${of}.`
    : `Volume total ${issue.total} m³ excede o limite de ${issue.limit} m³ ${of}.`;
}

/** BR 13: o manifesto tem de ser enviado pelo menos 72 horas antes do ETA. */
export const manifestLeadHours = 72;

/**
 * RF-A14: `alert` quando faltam menos de 72 h para o ETA (ou o ETA já passou) e não há manifesto enviado;
 * `pending` enquanto ainda há prazo.
 */
export type ManifestDeadline =
  | { state: "sent" }
  | { state: "pending"; hoursToEta: number }
  | { state: "alert"; hoursToEta: number };

export function manifestDeadline(eta: Date, manifestSent: boolean, now: Date = new Date()): ManifestDeadline {
  if (manifestSent) {
    return { state: "sent" };
  }
  const hoursToEta = Math.floor((eta.getTime() - now.getTime()) / 3_600_000);
  return hoursToEta < manifestLeadHours ? { state: "alert", hoursToEta } : { state: "pending", hoursToEta };
}

/** UN/LOCODE: país (2 letras) + local (3 letras ou algarismos 2–9), ex.: PTLIS, FRLEH, USBOS. */
export function isValidUnLocode(code: string) {
  return /^[A-Z]{2}[A-Z2-9]{3}$/.test(code);
}
