import { validateVin } from "@/domain/validators";

// Tipos de carga (secção 1.4 / BR 32). O tipo determina os campos pedidos
// ao cliente, os campos obrigatórios para a agência validar e os documentos.

export type CargoCategory =
  | "encomenda_pequena"
  | "veiculo"
  | "pecas_veiculo"
  | "material_construcao"
  | "mudanca"
  | "maquinas"
  | "comercial"
  | "especial";

export interface CargoFieldDefinition {
  key: string;
  label: string;
  /** Etiqueta curta para resumos (ex.: "Volumes" em vez da pergunta). */
  shortLabel?: string;
  type: "text" | "number" | "select" | "textarea";
  placeholder?: string;
  options?: string[];
  /** Texto a mostrar para cada opção, quando o valor guardado é um código (ex.: regime "taxi" → "Táxi"). */
  optionLabels?: Record<string, string>;
  required?: boolean;
  unit?: string;
  /** Validação extra do valor, quando preenchido. */
  format?: "vin" | "hs" | "year" | "positive";
}

export interface CargoTypeDefinition {
  id: CargoCategory;
  label: string;
  /** Nome curto e simples mostrado ao cliente no portal público. */
  publicLabel: string;
  description: string;
  examples: string;
  icon: "package" | "car" | "cog" | "brick" | "sofa" | "factory" | "store" | "alert";
  /** Campos mínimos pedidos ao cliente — poucos e sem jargão. */
  publicFields: CargoFieldDefinition[];
  /**
   * Campos que a agência completa na encomenda; os obrigatórios são exigidos para validar (BR 32).
   * Peso, dimensões e conteúdo ficam em cada volume.
   */
  operatorFields: CargoFieldDefinition[];
  requiredDocuments: string[];
}

const conditionOptions = ["Novo", "Usado"];
const fuelOptions = ["Gasolina", "Gasóleo", "Híbrido", "Elétrico", "GPL"];

/** Regimes de viatura (os valores de cada um são configurados pelo administrador). */
export const vehicleRegimeLabels: Record<string, string> = {
  particular: "Uso privado",
  taxi: "Táxi",
  turismo: "Turismo aventura (4×4)",
  emigrante: "Emigrante retornado",
};
const currencyField: CargoFieldDefinition = {
  key: "valueCurrency",
  label: "Moeda do valor de compra",
  shortLabel: "Moeda",
  type: "select",
  options: ["EUR", "USD", "CVE"],
  optionLabels: { EUR: "Euro (€)", USD: "Dólar (US$)", CVE: "Escudo (ECV)" },
};
const regimeField: CargoFieldDefinition = {
  key: "regime",
  label: "Uso da viatura em Cabo Verde",
  shortLabel: "Regime",
  type: "select",
  required: true,
  options: Object.keys(vehicleRegimeLabels),
  optionLabels: vehicleRegimeLabels,
};

export const cargoTypes: CargoTypeDefinition[] = [
  {
    id: "encomenda_pequena",
    label: "Encomendas pequenas",
    publicLabel: "Caixa ou encomenda",
    description: "Caixas fechadas, bidões, malas e bagagem.",
    examples: "Caixas seladas, bagagem, bidões",
    icon: "package",
    publicFields: [
      { key: "quantity", label: "Quantas caixas ou volumes?", shortLabel: "Volumes", type: "number", required: true, placeholder: "1" },
      { key: "approxWeightKg", label: "Peso aproximado total", type: "number", unit: "kg", placeholder: "25" },
    ],
    operatorFields: [],
    requiredDocuments: [],
  },
  {
    id: "veiculo",
    label: "Veículos",
    publicLabel: "Carro, mota ou carrinha",
    description: "Veículos novos ou usados.",
    examples: "Carros, motos, carrinhas",
    icon: "car",
    publicFields: [
      { key: "make", label: "Marca", type: "text", required: true, placeholder: "Toyota" },
      { key: "model", label: "Modelo", type: "text", required: true, placeholder: "Hilux" },
      { key: "year", label: "Ano", type: "number", placeholder: "2018" },
      { key: "condition", label: "Estado", type: "select", options: conditionOptions },
      { key: "vin", shortLabel: "VIN", label: "VIN / nº de quadro (se souber)", type: "text", placeholder: "17 caracteres" },
      regimeField,
      { key: "engineCc", label: "Cilindrada", type: "number", unit: "cm³", format: "positive", placeholder: "1400" },
      { key: "fuel", label: "Combustível", type: "select", options: fuelOptions },
      { key: "value", label: "Valor de compra", type: "number", format: "positive" },
      currencyField,
    ],
    operatorFields: [
      { key: "vin", label: "VIN", type: "text", required: true, format: "vin", placeholder: "17 caracteres" },
      { key: "make", label: "Marca", type: "text", required: true },
      { key: "model", label: "Modelo", type: "text", required: true },
      { key: "year", label: "Ano", type: "number", required: true, format: "year" },
      { key: "engineCc", label: "Cilindrada", type: "number", unit: "cm³", required: true, format: "positive" },
      { key: "fuel", label: "Combustível", type: "select", required: true, options: fuelOptions },
      { key: "condition", label: "Estado", type: "select", required: true, options: conditionOptions },
      regimeField,
      { key: "value", label: "Valor de compra", type: "number", required: true, format: "positive" },
      currencyField,
      { key: "transportCostEur", label: "Valor do transporte", type: "number", unit: "€", format: "positive" },
      { key: "insuranceCostEur", label: "Valor do seguro", type: "number", unit: "€", format: "positive" },
      { key: "mileageKm", label: "Quilometragem", type: "number", unit: "km", format: "positive" },
    ],
    requiredDocuments: ["Fatura de compra", "Certificado de conformidade (COC) ou pedido de homologação", "Documento de registo de origem", "Fotos do estado"],
  },
  {
    id: "pecas_veiculo",
    label: "Peças de veículos",
    publicLabel: "Peças de carro",
    description: "Motores, jantes, pneus, baterias.",
    examples: "Motores, jantes, pneus, baterias",
    icon: "cog",
    publicFields: [
      { key: "quantity", label: "Quantas peças?", shortLabel: "Peças", type: "number", required: true, placeholder: "4" },
      { key: "condition", label: "Estado", type: "select", options: conditionOptions },
      { key: "hasBatteries", shortLabel: "Baterias", label: "Inclui baterias?", type: "select", options: ["Não", "Sim"] },
    ],
    operatorFields: [
      { key: "partReference", label: "Referência da peça", type: "text", required: true },
      { key: "hsCode", label: "Código SH", type: "text", required: true, format: "hs", placeholder: "870899" },
      { key: "condition", label: "Estado", type: "select", required: true, options: conditionOptions },
      { key: "compatibleVin", label: "VIN do veículo compatível", type: "text", format: "vin" },
      { key: "hazardClass", label: "Classe de perigo (baterias)", type: "text" },
    ],
    requiredDocuments: ["Ficha de segurança (baterias)"],
  },
  {
    id: "material_construcao",
    label: "Material de construção",
    publicLabel: "Material de construção",
    description: "Cimento, ferro, azulejos, portas, tintas.",
    examples: "Cimento, ferro, azulejos, tintas",
    icon: "brick",
    publicFields: [
      { key: "approxWeightKg", label: "Peso aproximado", type: "number", unit: "kg", placeholder: "800" },
      { key: "pallets", shortLabel: "Paletes", label: "Nº de paletes (se houver)", type: "number", placeholder: "2" },
    ],
    operatorFields: [
      { key: "hsCode", label: "Código SH", type: "text", required: true, format: "hs", placeholder: "252329" },
      { key: "packaging", label: "Embalagem", type: "select", required: true, options: ["Paletes", "Carga solta"] },
      { key: "hazardClass", label: "Classe de perigo (tintas, solventes)", type: "text" },
    ],
    requiredDocuments: ["Ficha de segurança (tintas e solventes)"],
  },
  {
    id: "mudanca",
    label: "Mudanças e bens domésticos",
    publicLabel: "Mudança, móveis ou eletrodomésticos",
    description: "Móveis, eletrodomésticos e bens pessoais.",
    examples: "Móveis, frigoríficos, bens pessoais",
    icon: "sofa",
    publicFields: [
      { key: "rooms", shortLabel: "Dimensão", label: "Divisões / dimensão da mudança", type: "select", options: ["Alguns itens", "T1", "T2", "T3 ou maior"] },
      { key: "approxItems", shortLabel: "Itens", label: "Nº aproximado de itens", type: "number", placeholder: "15" },
    ],
    operatorFields: [
      { key: "inventory", label: "Inventário (itens e valores)", type: "textarea", required: true },
      { key: "declaredValue", label: "Valor declarado total", type: "number", unit: "€", required: true, format: "positive" },
    ],
    requiredDocuments: ["Inventário detalhado com valores", "Declaração de bens pessoais"],
  },
  {
    id: "maquinas",
    label: "Máquinas e equipamentos",
    publicLabel: "Máquina ou equipamento",
    description: "Geradores, equipamento industrial.",
    examples: "Geradores, compressores, máquinas",
    icon: "factory",
    publicFields: [
      { key: "approxWeightKg", label: "Peso aproximado", type: "number", unit: "kg", placeholder: "350" },
      { key: "condition", label: "Estado", type: "select", options: conditionOptions },
    ],
    operatorFields: [
      { key: "serialNumber", label: "Nº de série", type: "text", required: true },
      { key: "power", label: "Potência", type: "text", required: true, placeholder: "5 kVA" },
      { key: "condition", label: "Estado", type: "select", options: conditionOptions },
    ],
    requiredDocuments: ["Ficha técnica"],
  },
  {
    id: "comercial",
    label: "Mercadoria comercial",
    publicLabel: "Mercadoria para negócio",
    description: "Alimentos, vestuário, eletrónica para revenda.",
    examples: "Alimentos, vestuário, eletrónica",
    icon: "store",
    publicFields: [
      { key: "approxWeightKg", label: "Peso aproximado", type: "number", unit: "kg", placeholder: "200" },
      { key: "approxValueEur", label: "Valor aproximado", type: "number", unit: "€", placeholder: "1500" },
    ],
    operatorFields: [
      { key: "invoiceNumber", label: "Nº da fatura comercial", type: "text", required: true },
      { key: "hsCode", label: "Código SH", type: "text", required: true, format: "hs" },
      { key: "importer", label: "Importador", type: "text", required: true },
      { key: "countryOfOrigin", label: "País de origem/fabrico", type: "text", required: true },
    ],
    requiredDocuments: ["Fatura comercial"],
  },
  {
    id: "especial",
    label: "Mercadoria especial",
    publicLabel: "Outro / carga especial",
    description: "Perigosa, refrigerada, frágil, medicamentos ou outra.",
    examples: "Frágil, refrigerada, medicamentos",
    icon: "alert",
    publicFields: [
      { key: "approxWeightKg", label: "Peso aproximado", type: "number", unit: "kg", placeholder: "10" },
    ],
    operatorFields: [
      { key: "hazardClass", label: "Classe de perigo", type: "text", required: true },
      { key: "safetySheet", label: "Ficha de segurança entregue?", type: "select", required: true, options: ["Sim", "Não"] },
      { key: "temperature", label: "Temperatura de transporte", type: "text", placeholder: "2–8 °C" },
    ],
    requiredDocuments: ["Ficha de segurança", "Licenças aplicáveis"],
  },
];

export function getCargoType(id: CargoCategory) {
  const definition = cargoTypes.find((type) => type.id === id);
  if (!definition) {
    throw new Error(`Tipo de carga desconhecido: ${id}`);
  }
  return definition;
}

/** Valor a mostrar de um campo (o texto da opção, se o valor for um código). */
export function fieldValueLabel(field: CargoFieldDefinition, value: string) {
  return field.optionLabels?.[value] ?? value;
}

export function isCargoCategory(value: string): value is CargoCategory {
  return cargoTypes.some((type) => type.id === value);
}

/** Lista dos campos públicos obrigatórios em falta para o tipo indicado. */
export function missingPublicFields(category: CargoCategory, details: Record<string, string>) {
  return getCargoType(category)
    .publicFields.filter((field) => field.required && !details[field.key]?.trim())
    .map((field) => field.key);
}

export interface FieldIssue {
  key: string;
  message: string;
}

/** Verifica o formato dos campos preenchidos (VIN, código SH, ano, números positivos). */
export function checkFieldFormat(field: CargoFieldDefinition, value: string): string | null {
  switch (field.format) {
    case "vin": {
      const result = validateVin(value);
      if (result.valid) return null;
      return result.reason === "check-digit"
        ? "O dígito de controlo do VIN não confere."
        : "O VIN tem 17 caracteres, sem as letras I, O e Q.";
    }
    case "hs":
      return /^\d{6,10}$/.test(value.replace(/[\s.]/g, "")) ? null : "O código SH tem 6 a 10 algarismos.";
    case "year": {
      const year = Number(value);
      const max = new Date().getFullYear() + 1;
      return Number.isInteger(year) && year >= 1950 && year <= max ? null : `Indique um ano entre 1950 e ${max}.`;
    }
    case "positive":
      return Number(value.replace(",", ".")) > 0 ? null : "Indique um número maior que zero.";
    default:
      return null;
  }
}

/**
 * Problemas nos detalhes do operador. Com `requireAll`, também exige os campos obrigatórios
 * do tipo de carga (usado ao validar a encomenda, BR 32); sem ele, só verifica formatos.
 */
export function operatorFieldIssues(
  category: CargoCategory,
  details: Record<string, string>,
  { requireAll }: { requireAll: boolean },
): FieldIssue[] {
  const issues: FieldIssue[] = [];
  for (const field of getCargoType(category).operatorFields) {
    const value = details[field.key]?.trim() ?? "";
    if (!value) {
      if (requireAll && field.required) {
        issues.push({ key: field.key, message: `${field.label} é obrigatório para ${getCargoType(category).label.toLowerCase()}.` });
      }
      continue;
    }
    if (field.type === "select" && field.options && !field.options.includes(value)) {
      issues.push({ key: field.key, message: `${field.label}: escolha uma das opções.` });
      continue;
    }
    const formatError = checkFieldFormat(field, value);
    if (formatError) {
      issues.push({ key: field.key, message: formatError });
    }
  }
  return issues;
}
