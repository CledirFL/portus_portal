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
  type: "text" | "number" | "select";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  unit?: string;
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
  /** Campos que a agência/transitário tem de completar para validar (BR 32). */
  operatorRequiredFields: string[];
  requiredDocuments: string[];
}

const conditionOptions = ["Novo", "Usado"];

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
    operatorRequiredFields: ["weightKg", "dimensions", "declaredContent"],
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
    ],
    operatorRequiredFields: ["vin", "make", "model", "year", "engineCc", "fuel", "condition", "value"],
    requiredDocuments: ["Fatura ou prova de compra", "Documento de registo de origem", "Fotos do estado"],
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
    operatorRequiredFields: ["partReference", "hsCode", "condition"],
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
    operatorRequiredFields: ["weightKg", "hsCode", "packaging"],
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
    operatorRequiredFields: ["inventory", "declaredValue"],
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
    operatorRequiredFields: ["serialNumber", "power", "dimensions", "weightKg"],
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
    operatorRequiredFields: ["commercialInvoice", "hsCode", "importer", "countryOfOrigin"],
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
    operatorRequiredFields: ["hazardClass", "safetySheet"],
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

export function isCargoCategory(value: string): value is CargoCategory {
  return cargoTypes.some((type) => type.id === value);
}

/** Lista dos campos públicos obrigatórios em falta para o tipo indicado. */
export function missingPublicFields(category: CargoCategory, details: Record<string, string>) {
  return getCargoType(category)
    .publicFields.filter((field) => field.required && !details[field.key]?.trim())
    .map((field) => field.key);
}
