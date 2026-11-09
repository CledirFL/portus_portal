// Impostos de importação de viaturas em Cabo Verde (Pauta Aduaneira, posição 8703 — ligeiros de passageiros).
// Estimativa com os valores configurados pelo administrador; o valor final é o liquidado pela Alfândega.
// Os mesmos ficheiros existem em portus/src/domain para o frontend.

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
  "tourism_licence",
  "return_proof",
  "foreign_residence",
  "other",
] as const;
export type VehicleDocumentType = (typeof vehicleDocumentTypes)[number];

export const vehicleDocumentLabels: Record<VehicleDocumentType, string> = {
  invoice: "Fatura de compra",
  homologation: "Certificado de conformidade (COC) ou pedido de homologação",
  foreign_registration: "Documento de registo da viatura (no país onde estava matriculada)",
  registration_cancellation: "Cancelamento da matrícula para exportação",
  owner_id: "Documento de identificação e NIF do dono",
  transport_proof: "Comprovativo do transporte (BL ou fatura do frete)",
  insurance: "Apólice do seguro de transporte",
  taxi_licence: "Licença de transporte público (táxi)",
  tourism_licence: "Licença de atividade turística (rent-a-car)",
  return_proof: "Comprovativo de regresso definitivo",
  foreign_residence: "Comprovativo de residência habitual no estrangeiro há mais de 4 anos",
  other: "Outro documento",
};

/** Tipos de carga que só entram no contentor (e no navio) com o transporte e o seguro pagos na origem. */
export const prepaidTransportCategories = ["veiculo"];
export const requiresPrepaidTransport = (category: string) => prepaidTransportCategories.includes(category);

/** Países da CEDEAO (sem a taxa comunitária). Mali, Burkina Faso e Níger saíram em 2025. */
export const ecowasCountries = ["BJ", "CV", "CI", "GM", "GH", "GN", "GW", "LR", "NG", "SN", "SL", "TG"];

/** Grupo de combustível da Pauta (o GPL segue a gasolina). */
export type FuelGroup = "gasolina" | "gasoleo" | "hibrido" | "eletrico";
export const fuelGroupLabels: Record<FuelGroup, string> = { gasolina: "gasolina", gasoleo: "gasóleo", hibrido: "híbrido", eletrico: "elétrico" };
export function fuelGroup(fuel: string | null): FuelGroup {
  switch (fuel) {
    case "Gasóleo":
      return "gasoleo";
    case "Híbrido":
      return "hibrido";
    case "Elétrico":
      return "eletrico";
    default:
      return "gasolina";
  }
}

export interface VehicleRegimeRule {
  code: string;
  label: string;
  /** Direitos de importação em % do CIF; null segue a Pauta (combustível e cilindrada). */
  dutyRatePct: number | null;
  iceExempt: boolean;
  vatExempt: boolean;
  /** Cilindrada máxima (cm³) para o regime; null sem limite. */
  maxEngineCc: number | null;
  /** Só viaturas novas. */
  newOnly: boolean;
  /** Combustível exigido (ex.: "Elétrico"); null qualquer. */
  requiredFuel: string | null;
  requiredDocuments: string[];
  /** Uma viatura por pessoa neste regime a cada N anos (ex.: emigrante, 4); null sem limite. */
  oncePerYears: number | null;
}

/** Moedas aceites nos valores da viatura (o escudo não precisa de câmbio). */
export const vehicleCurrencies = ["EUR", "USD", "CVE"] as const;
export type VehicleCurrency = (typeof vehicleCurrencies)[number];

export interface VehicleTaxSettings {
  /** Câmbio fixo do euro (1 € = 110,265 ECV). */
  eurToCve: number;
  /** Câmbio do dólar (variável: atualize-o). */
  usdToCve: number;
  vatPct: number;
  /** Taxa comunitária CEDEAO, em % do CIF, só para países de fora da CEDEAO. */
  communityTaxPct: number;
  /** Taxa estatística aduaneira (TEA), valor fixo por despacho. */
  teaCve: number;
  /** DI por combustível e cilindrada, do escalão mais baixo para o mais alto; `maxEngineCc` null no último. */
  dutyBands: Array<{ fuel: FuelGroup; maxEngineCc: number | null; ratePct: number }>;
  /** ICE fixo das usadas até `specificIceMaxAgeYears` anos (as novas não pagam ICE). */
  specificIceCve: number;
  specificIceMaxAgeYears: number;
  /** ICE das usadas mais velhas, em % de (CIF + DI), do escalão mais novo para o mais velho; `maxAgeYears` null no último. */
  iceTiers: Array<{ maxAgeYears: number | null; ratePct: number }>;
  /** O mesmo para as elétricas usadas. */
  iceElectricTiers: Array<{ maxAgeYears: number | null; ratePct: number }>;
}

export interface VehicleTaxInput {
  /** Ano de fabrico. */
  year: number;
  /** "Novo" ou "Usado". */
  condition: string;
  engineCc: number | null;
  fuel: string | null;
  /** País de onde envia (ISO 3166-1 alfa-2): a taxa CEDEAO só se aplica de fora da CEDEAO. */
  dispatchCountry: string | null;
  /** Valores com a moeda de cada um (ex.: compra em euros, frete e seguro em escudos). */
  value: Money;
  transport: Money;
  insurance: Money;
}

export interface Money {
  amount: number;
  currency: VehicleCurrency;
}

/** Valor em escudos, arredondado ao escudo. */
export function toCve(money: Money, settings: Pick<VehicleTaxSettings, "eurToCve" | "usdToCve">) {
  const rate = money.currency === "EUR" ? settings.eurToCve : money.currency === "USD" ? settings.usdToCve : 1;
  return Math.round(money.amount * rate);
}

export interface VehicleTaxLine {
  code: "duty" | "ice" | "community_tax" | "tea" | "vat";
  label: string;
  /** Taxa aplicada (%), quando é percentual. */
  ratePct: number | null;
  amountCve: number;
}

export interface VehicleTaxEstimate {
  regime: string;
  ageYears: number;
  /** Escalão da Pauta usado nos direitos, ex.: "8703 · gasolina · até 1500 cm³". */
  tariffLine: string;
  /** Valor aduaneiro (CIF): compra + transporte + seguro, em CVE. */
  customsValueCve: number;
  lines: VehicleTaxLine[];
  totalCve: number;
  /** Condições do regime que a viatura não cumpre (o regime não se aplica). */
  issues: string[];
}

/** Os montantes em escudos arredondam-se ao escudo (sem centavos), como na liquidação. */
const roundCve = (value: number) => Math.round(value);
const cc = (value: number) => `${value} cm³`;

/** Idade em anos (0 no ano de fabrico). */
export const vehicleAge = (year: number, now = new Date()) => Math.max(0, now.getFullYear() - year);

/** Condições do regime que a viatura não cumpre. */
export function regimeIssues(regime: VehicleRegimeRule, input: Pick<VehicleTaxInput, "condition" | "engineCc" | "fuel">) {
  const issues: string[] = [];
  if (regime.newOnly && input.condition !== "Novo") issues.push(`${regime.label}: só para viaturas novas.`);
  if (regime.maxEngineCc !== null && (input.engineCc === null || input.engineCc > regime.maxEngineCc)) {
    issues.push(`${regime.label}: cilindrada até ${cc(regime.maxEngineCc)}.`);
  }
  if (regime.requiredFuel && input.fuel !== regime.requiredFuel) issues.push(`${regime.label}: só para viaturas a ${regime.requiredFuel.toLowerCase()}.`);
  return issues;
}

/** Escalão de DI da Pauta para o combustível e a cilindrada (sem cilindrada, o mais alto). */
export function dutyBandFor(settings: VehicleTaxSettings, fuel: FuelGroup, engineCc: number | null) {
  const bands = settings.dutyBands.filter((band) => band.fuel === fuel);
  const band = engineCc === null ? bands.at(-1) : bands.find((item) => item.maxEngineCc === null || engineCc <= item.maxEngineCc);
  if (!band) return { ratePct: 0, label: `8703 · ${fuelGroupLabels[fuel]}` };
  const index = bands.indexOf(band);
  const previous = index > 0 ? bands[index - 1]!.maxEngineCc : null;
  const range =
    bands.length === 1 ? "" : band.maxEngineCc === null ? ` · mais de ${cc(previous ?? 0)}` : ` · até ${cc(band.maxEngineCc)}`;
  return { ratePct: band.ratePct, label: `8703 · ${fuelGroupLabels[fuel]}${range}` };
}

/**
 * Estimativa pela Pauta (posição 8703):
 * CIF = compra + transporte + seguro, cada um convertido para escudos; DI = CIF × % (combustível e cilindrada, ou o do regime);
 * ICE = 0 nas novas, valor fixo nas usadas recentes, depois % de (CIF + DI) pela idade (tabela própria das elétricas);
 * CEDEAO = CIF × % (só de fora da CEDEAO); IVA = (CIF + DI + ICE + CEDEAO) × % (isentos: elétricas e os regimes com
 * isenção); TEA fixa por despacho. Cada linha arredonda-se ao escudo.
 */
export function estimateVehicleTaxes(input: VehicleTaxInput, regime: VehicleRegimeRule, settings: VehicleTaxSettings, now = new Date()): VehicleTaxEstimate {
  const ageYears = vehicleAge(input.year, now);
  const fuel = fuelGroup(input.fuel);
  const electric = fuel === "eletrico";
  const isNew = input.condition === "Novo";
  const customsValueCve = toCve(input.value, settings) + toCve(input.transport, settings) + toCve(input.insurance, settings);
  const lines: VehicleTaxLine[] = [];

  const band = dutyBandFor(settings, fuel, input.engineCc);
  const dutyRate = regime.dutyRatePct ?? band.ratePct;
  const duty = roundCve(customsValueCve * (dutyRate / 100));
  lines.push({
    code: "duty",
    label: regime.dutyRatePct === null ? "Direitos de importação (DI)" : `Direitos de importação (DI, regime ${regime.label.toLowerCase()})`,
    ratePct: dutyRate,
    amountCve: duty,
  });

  let ice = 0;
  let iceRate: number | null = null;
  let iceLabel: string;
  if (regime.iceExempt) {
    iceLabel = "ICE (isento pelo regime)";
  } else if (isNew) {
    iceLabel = "ICE (viatura nova: não paga)";
  } else if (ageYears <= settings.specificIceMaxAgeYears) {
    ice = electric ? 0 : roundCve(settings.specificIceCve);
    iceLabel = electric ? "ICE (elétrica usada recente: não paga)" : `ICE (valor fixo, usada até ${settings.specificIceMaxAgeYears} anos)`;
  } else {
    const tiers = electric ? settings.iceElectricTiers : settings.iceTiers;
    iceRate = tiers.find((tier) => tier.maxAgeYears === null || ageYears <= tier.maxAgeYears)?.ratePct ?? 0;
    ice = roundCve((customsValueCve + duty) * (iceRate / 100));
    iceLabel = `ICE (${electric ? "elétrica usada" : "usada"} com ${ageYears} anos, sobre CIF + DI)`;
  }
  lines.push({ code: "ice", label: iceLabel, ratePct: iceRate, amountCve: ice });

  const community = input.dispatchCountry && ecowasCountries.includes(input.dispatchCountry.toUpperCase()) ? 0 : roundCve(customsValueCve * (settings.communityTaxPct / 100));
  lines.push({
    code: "community_tax",
    label: community ? "Taxa comunitária CEDEAO" : "Taxa comunitária CEDEAO (país da CEDEAO: não paga)",
    ratePct: community ? settings.communityTaxPct : null,
    amountCve: community,
  });

  const vatExempt = regime.vatExempt || electric;
  const vatRate = vatExempt ? 0 : settings.vatPct;
  const vat = roundCve((customsValueCve + duty + ice + community) * (vatRate / 100));
  lines.push({ code: "vat", label: vatExempt ? `IVA (isento: ${electric ? "viatura elétrica" : `regime ${regime.label.toLowerCase()}`})` : "IVA", ratePct: vatRate, amountCve: vat });

  const tea = roundCve(settings.teaCve);
  lines.push({ code: "tea", label: "Taxa estatística aduaneira (TEA, por despacho)", ratePct: null, amountCve: tea });

  return {
    regime: regime.code,
    ageYears,
    tariffLine: band.label,
    customsValueCve,
    lines,
    totalCve: roundCve(lines.reduce((sum, line) => sum + line.amountCve, 0)),
    issues: regimeIssues(regime, input),
  };
}
