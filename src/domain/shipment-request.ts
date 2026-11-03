// Pedido de envio feito pelo cliente no portal público (BR 41–43).
// O pedido não é uma encomenda: a agência confirma os dados e converte-o.
// A API (portus_service) é a referência: cria o pedido, gera o código e aplica as transições.
// Aqui ficam a validação do formulário, os tipos da resposta e os textos visíveis.

import { z } from "zod";
import { cargoTypes, getCargoType, type CargoCategory } from "@/domain/cargo-types";
import { validatePhone } from "@/domain/validators";

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

/** Códigos estáveis devolvidos pela API. */
export const requestStatuses = [
  "submitted",
  "accepted",
  "pickup_scheduled",
  "converted",
  "rejected",
  "cancelled",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

const requestTransitions: Record<RequestStatus, readonly RequestStatus[]> = {
  submitted: ["accepted", "rejected", "cancelled"],
  accepted: ["pickup_scheduled", "converted", "cancelled"],
  pickup_scheduled: ["converted", "cancelled"],
  converted: [],
  rejected: [],
  cancelled: [],
};

// Textos visíveis (português por agora; passam para os ficheiros de tradução com o i18n).
export const requestStatusLabels: Record<RequestStatus, string> = {
  submitted: "Submetido",
  accepted: "Aceite",
  pickup_scheduled: "Recolha agendada",
  converted: "Carga recebida",
  rejected: "Recusado",
  cancelled: "Cancelado",
};

export const requestStatusDescriptions: Record<RequestStatus, string> = {
  submitted: "A agência ainda não analisou o pedido.",
  accepted: "A agência aceitou o pedido e vai entrar em contacto.",
  pickup_scheduled: "A recolha ou entrega na agência está marcada.",
  converted: "A carga foi recebida e registada como encomenda.",
  rejected: "A agência não pode tratar este envio.",
  cancelled: "O pedido foi cancelado.",
};

export type HandoverMethod = "recolha" | "entrega_na_agencia";

/** Pedido tal como a API o devolve. */
export interface ShipmentRequest {
  id: string;
  reference: string;
  status: RequestStatus;
  /** País de onde a carga é enviada para Cabo Verde (ISO 3166-1 alfa-2). */
  dispatchCountry: string;
  category: CargoCategory;
  description: string;
  details: Record<string, string>;
  handover: HandoverMethod;
  pickupAddress: string | null;
  sender: { name: string; phone: string; email: string | null };
  recipient: { name: string; phone: string; island: string; nif: string | null };
  scheduledFor: string | null;
  agencyNote: string | null;
  agency: { id: string; name: string; city: string; address: string; phone: string };
  history: Array<{ from: RequestStatus | null; to: RequestStatus; reason: string | null; at: string }>;
  createdAt: string;
  updatedAt: string;
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
    dispatchCountry: z.string().length(2, "Escolha o país de onde envia."),
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

/** Ações que a interface pode oferecer no estado atual (o servidor volta a validar). */
export function nextRequestStatuses(status: RequestStatus) {
  return requestTransitions[status];
}
