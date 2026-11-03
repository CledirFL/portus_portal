// Pedido de envio feito pelo cliente no portal público (BR 41–43).
// O pedido não é uma encomenda: a agência confirma os dados e converte-o.

import { z } from "zod";
import { cargoTypes, getCargoType, type CargoCategory } from "@/domain/cargo-types";
import { normalizePhone, validatePhone } from "@/domain/validators";
import type { StatusChange } from "@/domain/state-machine";

export const caboVerdeIslands = [
  "Santiago",
  "São Vicente",
  "Sal",
  "Boa Vista",
  "Fogo",
  "Santo Antão",
  "São Nicolau",
  "Maio",
  "Brava",
] as const;

export const requestStatuses = [
  "Submetido",
  "Aceite",
  "Recolha agendada",
  "Convertido",
  "Recusado",
  "Cancelado",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

const requestTransitions: Record<RequestStatus, readonly RequestStatus[]> = {
  Submetido: ["Aceite", "Recusado", "Cancelado"],
  Aceite: ["Recolha agendada", "Convertido", "Cancelado"],
  "Recolha agendada": ["Convertido", "Cancelado"],
  Convertido: [],
  Recusado: [],
  Cancelado: [],
};

export const requestStatusDescriptions: Record<RequestStatus, string> = {
  Submetido: "A agência ainda não analisou o pedido.",
  Aceite: "A agência aceitou o pedido e vai entrar em contacto.",
  "Recolha agendada": "A recolha ou entrega na agência está marcada.",
  Convertido: "A carga foi recebida e registada como encomenda.",
  Recusado: "A agência não pode tratar este envio.",
  Cancelado: "O pedido foi cancelado.",
};

export type HandoverMethod = "recolha" | "entrega_na_agencia";

export interface ShipmentRequest {
  id: string;
  reference: string;
  /** País de onde a carga é enviada para Cabo Verde (ISO 3166-1 alfa-2). */
  dispatchCountry: string;
  agencyId: string;
  category: CargoCategory;
  description: string;
  details: Record<string, string>;
  handover: HandoverMethod;
  pickupAddress?: string;
  sender: { name: string; phone: string; email?: string };
  recipient: { name: string; phone: string; island: string; nif?: string };
  customerId?: string;
  status: RequestStatus;
  history: StatusChange<RequestStatus>[];
  scheduledFor?: string;
  agencyNote?: string;
  createdAt: string;
}

const phoneField = z
  .string()
  .trim()
  .min(1, "Indique o telefone.")
  .superRefine((value, context) => {
    const result = validatePhone(value);
    if (!result.valid) {
      context.addIssue({ code: "custom", message: result.message ?? "Telefone inválido." });
    }
  });

export const shipmentRequestSchema = z
  .object({
    dispatchCountry: z.string().length(2, "Escolha o país de origem."),
    agencyId: z.string().min(1, "Escolha uma agência."),
    category: z.enum(cargoTypes.map((type) => type.id) as [CargoCategory, ...CargoCategory[]], {
      message: "Escolha o tipo de carga.",
    }),
    description: z.string().trim().min(3, "Descreva brevemente o que vai enviar.").max(500),
    details: z.record(z.string(), z.string()),
    handover: z.enum(["recolha", "entrega_na_agencia"]),
    pickupAddress: z.string().trim().optional(),
    sender: z.object({
      name: z.string().trim().min(2, "Indique o seu nome."),
      phone: phoneField,
      email: z.union([z.literal(""), z.string().trim().email("Email inválido.")]).optional(),
    }),
    recipient: z.object({
      name: z.string().trim().min(2, "Indique o nome do destinatário."),
      phone: phoneField,
      island: z.enum(caboVerdeIslands, { message: "Escolha a ilha de destino." }),
      nif: z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || /^\d{9}$/.test(value), "O NIF tem 9 algarismos."),
    }),
  })
  .superRefine((values, context) => {
    if (values.handover === "recolha" && !values.pickupAddress?.trim()) {
      context.addIssue({
        code: "custom",
        path: ["pickupAddress"],
        message: "Indique a morada de recolha.",
      });
    }

    for (const field of getCargoType(values.category).publicFields) {
      if (field.required && !values.details[field.key]?.trim()) {
        context.addIssue({
          code: "custom",
          path: ["details", field.key],
          message: `${field.label} é obrigatório.`,
        });
      }
    }
  });

export type ShipmentRequestInput = z.input<typeof shipmentRequestSchema>;

// Sem 0/O e 1/I para evitar confusões ao ditar o código por telefone.
const referenceAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRequestReference(random: () => number = Math.random) {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += referenceAlphabet[Math.floor(random() * referenceAlphabet.length)];
  }
  return `PED-${code}`;
}

export function createShipmentRequest(
  input: ShipmentRequestInput,
  options: { id: string; reference: string; customerId?: string; now?: string },
): ShipmentRequest {
  const parsed = shipmentRequestSchema.parse(input);
  const now = options.now ?? new Date().toISOString();

  return {
    id: options.id,
    reference: options.reference,
    dispatchCountry: parsed.dispatchCountry,
    agencyId: parsed.agencyId,
    category: parsed.category,
    description: parsed.description,
    details: Object.fromEntries(Object.entries(parsed.details).filter(([, value]) => value.trim())),
    handover: parsed.handover,
    pickupAddress: parsed.handover === "recolha" ? parsed.pickupAddress : undefined,
    sender: {
      name: parsed.sender.name,
      phone: normalizePhone(parsed.sender.phone),
      email: parsed.sender.email || undefined,
    },
    recipient: {
      name: parsed.recipient.name,
      phone: normalizePhone(parsed.recipient.phone),
      island: parsed.recipient.island,
      nif: parsed.recipient.nif || undefined,
    },
    customerId: options.customerId,
    status: "Submetido",
    history: [],
    createdAt: now,
  };
}

export function canTransitionRequest(from: RequestStatus, to: RequestStatus) {
  return requestTransitions[from].includes(to);
}

export function nextRequestStatuses(status: RequestStatus) {
  return requestTransitions[status];
}

export function transitionRequest(
  request: ShipmentRequest,
  to: RequestStatus,
  actor: { userId: string; reason?: string; at?: string },
): ShipmentRequest {
  if (!canTransitionRequest(request.status, to)) {
    throw new Error(`Não é possível passar o pedido de "${request.status}" para "${to}".`);
  }

  return {
    ...request,
    status: to,
    history: [
      ...request.history,
      { from: request.status, to, userId: actor.userId, reason: actor.reason, at: actor.at ?? new Date().toISOString() },
    ],
  };
}

/** BR 42: sem conta, só se consulta com o código e o telefone do remetente. */
export function matchesPublicLookup(request: ShipmentRequest, reference: string, phone: string) {
  return (
    request.reference === reference.trim().toUpperCase() &&
    normalizePhone(request.sender.phone) === normalizePhone(phone)
  );
}
