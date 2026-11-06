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

export type TrackingStepKey = "received" | "labelled" | "consolidated" | "in_transit" | "arrived" | "cleared" | "delivered";
export type TrackingStage = TrackingStepKey | "held" | "abandoned" | "cancelled";

/** Linha do tempo da encomenda depois de a agência receber a carga (a API calcula os marcos). */
export interface ShipmentTracking {
  shipmentCode: string;
  volumes: number;
  stage: TrackingStage;
  steps: Array<{ key: TrackingStepKey; label: string; done: boolean; at: string | null }>;
  voyage: { vesselName: string; arrivalPort: string; eta: string; departedAt: string | null; arrivedAt: string | null } | null;
  /** Só quando a carga está pronta para levantar. */
  pickup: { code: string; port: string; balanceCve: number } | null;
}

export const trackingStageLabels: Record<TrackingStage, string> = {
  received: "Carga recebida",
  labelled: "Pronta para embarque",
  consolidated: "No contentor",
  in_transit: "Em viagem",
  arrived: "Chegou a Cabo Verde",
  cleared: "Pronta para levantar",
  delivered: "Entregue",
  held: "Retida na Alfândega",
  abandoned: "Abandonada",
  cancelled: "Encomenda cancelada",
};

export const trackingStageDescriptions: Record<TrackingStage, string> = {
  received: "A agência está a registar e a etiquetar a carga.",
  labelled: "A carga está etiquetada e espera o contentor.",
  consolidated: "A carga está no contentor, à espera do navio.",
  in_transit: "A carga está a caminho de Cabo Verde.",
  arrived: "A carga vai ser conferida no terminal e despachada pela Alfândega.",
  cleared: "A Alfândega libertou a carga. O destinatário já a pode levantar.",
  delivered: "A carga foi levantada.",
  held: "A Alfândega reteve a carga. Contacte a agência para saber o que falta.",
  abandoned: "O prazo de armazenagem terminou sem a carga ser levantada. Contacte a agência.",
  cancelled: "A encomenda foi cancelada. Contacte a agência.",
};

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
  /** Encomenda criada quando a agência recebeu a carga. */
  shipment: { id: string; code: string } | null;
  /** Só nas vistas do cliente, depois de a agência receber a carga. */
  tracking?: ShipmentTracking | null;
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
      // Obrigatório: sem NIF a Alfândega sugere canal vermelho e a portaria não consegue entregar.
      nif: z
        .string({ message: "Indique o NIF do destinatário." })
        .trim()
        .superRefine((value, context) => {
          // Uma mensagem de cada vez: vazio ou formato errado.
          if (!value) context.addIssue({ code: "custom", message: "Indique o NIF do destinatário." });
          else if (!/^\d{9}$/.test(value)) context.addIssue({ code: "custom", message: "O NIF tem 9 algarismos." });
        }),
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

/** O cliente pode cancelar enquanto a agência não receber a carga (o servidor volta a validar). */
export function customerCanCancel(status: RequestStatus) {
  return status === "submitted" || status === "accepted" || status === "pickup_scheduled";
}

/** Ações que a interface pode oferecer no estado atual (o servidor volta a validar). */
export function nextRequestStatuses(status: RequestStatus) {
  return requestTransitions[status];
}
