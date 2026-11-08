// Despacho e taxas em Cabo Verde (BR 15, BR 21, BR 25).
// Os mesmos ficheiros existem em portus/src/domain para o frontend.

export const occurrenceTypes = ["missing", "damaged", "broken_seal", "excess"] as const;
export type OccurrenceType = (typeof occurrenceTypes)[number];

export const occurrenceTypeLabels: Record<OccurrenceType, string> = {
  missing: "Falta",
  damaged: "Dano",
  broken_seal: "Selo violado",
  excess: "Excesso",
};

export type CustomsChannel = "green" | "red";

export interface ChannelInput {
  occurrences: OccurrenceType[];
  /** O destinatário tem NIF ou documento de identificação registado. */
  recipientIdentified: boolean;
}

/**
 * BR 15: vermelho com divergência (falta ou excesso), selo violado ou identificação inválida; verde nos outros
 * casos. É uma sugestão: no MVP a Alfândega decide (o canal automático é da fase 3).
 */
export function suggestChannel(input: ChannelInput): { channel: CustomsChannel; reasons: string[] } {
  const reasons: string[] = [];
  if (input.occurrences.includes("broken_seal")) reasons.push("Selo violado.");
  if (input.occurrences.includes("missing") || input.occurrences.includes("excess")) {
    reasons.push("Divergência entre o manifesto e a carga.");
  }
  if (input.occurrences.includes("damaged")) reasons.push("Volume danificado.");
  if (!input.recipientIdentified) reasons.push("Destinatário sem NIF nem documento registado.");
  return { channel: reasons.length ? "red" : "green", reasons };
}

export type TariffUnit = "per_volume" | "per_volume_day" | "per_shipment";

export interface TariffRule {
  code: string;
  label: string;
  unit: TariffUnit;
  amountCve: number;
  freeDays: number;
  /** Tipos de carga a que se aplica; vazio: todos. */
  categories?: string[];
}

export interface ChargeLine {
  code: string;
  label: string;
  quantity: number;
  amountCve: number;
}

export interface Charges {
  lines: ChargeLine[];
  totalCve: number;
  paidCve: number;
  exempt: boolean;
  /** Em dívida; 0 com isenção confirmada (BR 21). */
  balanceCve: number;
  storageDays: number;
}

const DAY = 86_400_000;
const round2 = (value: number) => Math.round(value * 100) / 100;

/** Dias de armazenagem contados a partir da chegada (dia começado conta como dia). */
export function storageDays(arrivedAt: Date | null, now: Date) {
  if (!arrivedAt) return 0;
  return Math.max(0, Math.ceil((now.getTime() - arrivedAt.getTime()) / DAY));
}

/**
 * Taxas de uma encomenda (RF-A26): tarifas por volume e armazenagem diária depois dos dias grátis (BR 25),
 * mais os direitos fixados pela Alfândega.
 */
export function computeCharges(input: {
  tariffs: TariffRule[];
  /** Tipo de carga da encomenda (as tarifas com tipos só se aplicam a esses). */
  category?: string;
  volumes: number;
  arrivedAt: Date | null;
  now: Date;
  dutiesCve: number;
  paidCve: number;
  exempt: boolean;
}): Charges {
  const days = storageDays(input.arrivedAt, input.now);
  const lines: ChargeLine[] = [];
  for (const tariff of input.tariffs) {
    if (tariff.categories?.length && (!input.category || !tariff.categories.includes(input.category))) continue;
    const quantity =
      tariff.unit === "per_volume"
        ? input.volumes
        : tariff.unit === "per_shipment"
          ? Math.min(1, input.volumes)
          : input.volumes * Math.max(0, days - tariff.freeDays);
    if (quantity > 0 && tariff.amountCve > 0) {
      lines.push({ code: tariff.code, label: tariff.label, quantity, amountCve: round2(quantity * tariff.amountCve) });
    }
  }
  if (input.dutiesCve > 0) {
    lines.push({ code: "duties", label: "Direitos aduaneiros", quantity: 1, amountCve: round2(input.dutiesCve) });
  }
  const totalCve = round2(lines.reduce((sum, line) => sum + line.amountCve, 0));
  const paidCve = round2(input.paidCve);
  return {
    lines,
    totalCve,
    paidCve,
    exempt: input.exempt,
    balanceCve: input.exempt ? 0 : Math.max(0, round2(totalCve - paidCve)),
    storageDays: days,
  };
}

export const formatCve = (value: number) =>
  `${value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CVE`;
