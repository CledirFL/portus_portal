// Impostos de importação de viaturas em Cabo Verde: estimativa com os valores configurados pelo administrador.
// Os mesmos ficheiros existem em portus/src/domain para o frontend.
// É uma estimativa: o valor final é o liquidado pela Alfândega.

/** Documentos do dossiê de desalfandegamento de uma viatura. */
export const vehicleDocumentTypes = [
  "invoice",
  "homologation",
  "foreign_registration",
  "registration_cancellation",
  "owner_id",
  "transport_proof",
  "insurance",
  "taxi_licence",
  "return_proof",
  "other",
] as const;
export type VehicleDocumentType = (typeof vehicleDocumentTypes)[number];

export const vehicleDocumentLabels: Record<VehicleDocumentType, string> = {
  invoice: "Fatura de compra",
  homologation: "Certificado de conformidade (COC) ou pedido de homologação",
  foreign_registration: "Documento de registo do país de origem",
  registration_cancellation: "Cancelamento da matrícula para exportação",
  owner_id: "Documento de identificação e NIF do dono",
  transport_proof: "Comprovativo do transporte (BL ou fatura do frete)",
  insurance: "Apólice do seguro de transporte",
  taxi_licence: "Licença de táxi",
  return_proof: "Comprovativo de regresso definitivo",
  other: "Outro documento",
};

export interface VehicleRegimeRule {
  code: string;
  label: string;
  /** Direitos de importação, em % do valor aduaneiro. */
  dutyRatePct: number;
  iceExempt: boolean;
  specificIceExempt: boolean;
  vatExempt: boolean;
  /** Cilindrada máxima (cm³) para o regime; null sem limite. */
  maxEngineCc: number | null;
  /** Só viaturas novas. */
  newOnly: boolean;
  /** Combustível exigido (ex.: "Elétrico"); null qualquer. */
  requiredFuel: string | null;
  requiredDocuments: string[];
}

export interface VehicleTaxSettings {
  /** Câmbio do euro (paridade fixa). */
  eurToCve: number;
  vatPct: number;
  communityTaxPct: number;
  /** Taxa específica do ICE para usadas até `specificIceMaxAgeYears` anos. */
  specificIceCve: number;
  specificIceMaxAgeYears: number;
  /** ICE por idade, do escalão mais novo para o mais velho; `maxAgeYears` null no último. */
  iceTiers: Array<{ maxAgeYears: number | null; ratePct: number }>;
}

export interface VehicleTaxInput {
  /** Ano de fabrico. */
  year: number;
  /** "Novo" ou "Usado". */
  condition: string;
  engineCc: number | null;
  fuel: string | null;
  /** Valores em euros, como na fatura. */
  valueEur: number;
  transportEur: number;
  insuranceEur: number;
}

export interface VehicleTaxLine {
  code: "duty" | "ice" | "specific_ice" | "community_tax" | "vat";
  label: string;
  /** Taxa aplicada (%), quando é percentual. */
  ratePct: number | null;
  amountCve: number;
}

export interface VehicleTaxEstimate {
  regime: string;
  ageYears: number;
  /** Valor aduaneiro (CIF): compra + transporte + seguro, em CVE. */
  customsValueCve: number;
  lines: VehicleTaxLine[];
  totalCve: number;
  /** Condições do regime que a viatura não cumpre (o regime não se aplica). */
  issues: string[];
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Idade em anos (0 no ano de fabrico). */
export const vehicleAge = (year: number, now = new Date()) => Math.max(0, now.getFullYear() - year);

/** Condições do regime que a viatura não cumpre. */
export function regimeIssues(regime: VehicleRegimeRule, input: Pick<VehicleTaxInput, "condition" | "engineCc" | "fuel">) {
  const issues: string[] = [];
  if (regime.newOnly && input.condition !== "Novo") issues.push(`${regime.label}: só para viaturas novas.`);
  if (regime.maxEngineCc !== null && (input.engineCc === null || input.engineCc > regime.maxEngineCc)) {
    issues.push(`${regime.label}: cilindrada até ${regime.maxEngineCc.toLocaleString("pt-PT")} cm³.`);
  }
  if (regime.requiredFuel && input.fuel !== regime.requiredFuel) issues.push(`${regime.label}: só para viaturas a ${regime.requiredFuel.toLowerCase()}.`);
  return issues;
}

/**
 * Estimativa dos impostos (simplificada):
 * direitos = valor aduaneiro × %; ICE = (valor + direitos) × % do escalão de idade; taxa específica nas usadas recentes;
 * taxa comunitária = valor × %; IVA = (valor + direitos + ICE + taxa específica) × %.
 */
export function estimateVehicleTaxes(input: VehicleTaxInput, regime: VehicleRegimeRule, settings: VehicleTaxSettings, now = new Date()): VehicleTaxEstimate {
  const ageYears = vehicleAge(input.year, now);
  const customsValueCve = round2((input.valueEur + input.transportEur + input.insuranceEur) * settings.eurToCve);
  const lines: VehicleTaxLine[] = [];

  const duty = round2(customsValueCve * (regime.dutyRatePct / 100));
  lines.push({ code: "duty", label: "Direitos de importação", ratePct: regime.dutyRatePct, amountCve: duty });

  const tier = settings.iceTiers.find((item) => item.maxAgeYears === null || ageYears <= item.maxAgeYears);
  const iceRate = regime.iceExempt ? 0 : (tier?.ratePct ?? 0);
  const ice = round2((customsValueCve + duty) * (iceRate / 100));
  lines.push({ code: "ice", label: regime.iceExempt ? "ICE (isento)" : "Imposto sobre consumos especiais (ICE)", ratePct: iceRate, amountCve: ice });

  const specificApplies = !regime.specificIceExempt && input.condition !== "Novo" && ageYears <= settings.specificIceMaxAgeYears;
  const specific = specificApplies ? round2(settings.specificIceCve) : 0;
  if (specificApplies) lines.push({ code: "specific_ice", label: "Taxa específica do ICE (usadas recentes)", ratePct: null, amountCve: specific });

  const community = round2(customsValueCve * (settings.communityTaxPct / 100));
  lines.push({ code: "community_tax", label: "Taxa comunitária", ratePct: settings.communityTaxPct, amountCve: community });

  const vatRate = regime.vatExempt ? 0 : settings.vatPct;
  const vat = round2((customsValueCve + duty + ice + specific) * (vatRate / 100));
  lines.push({ code: "vat", label: regime.vatExempt ? "IVA (isento)" : "IVA", ratePct: vatRate, amountCve: vat });

  return {
    regime: regime.code,
    ageYears,
    customsValueCve,
    lines,
    totalCve: round2(lines.reduce((sum, line) => sum + line.amountCve, 0)),
    issues: regimeIssues(regime, input),
  };
}
