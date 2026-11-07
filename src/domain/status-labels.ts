// Textos visíveis dos estados devolvidos pela API (português; passam para o i18n mais tarde).
import type { ContainerStatus, VolumeStatus } from "@/domain/state-machine";

export type ShipmentStatus = "draft" | "validated" | "cancelled";

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  draft: "Rascunho",
  validated: "Validada",
  cancelled: "Cancelada",
};

export const volumeStatusLabels: Record<VolumeStatus, string> = {
  draft: "Rascunho",
  collected: "Recolhido",
  consolidated: "Consolidado",
  shipped: "Embarcado",
  arrived: "Chegado",
  deconsolidated: "Desconsolidado",
  held: "Retido",
  released: "Liberado",
  to_agency: "A caminho da agência",
  at_agency: "Na agência",
  delivered: "Entregue",
  abandoned: "Abandonado",
};

export const containerStatusLabels: Record<ContainerStatus, string> = {
  open: "Aberto",
  sealed: "Selado",
  shipped: "Embarcado",
  arrived: "Chegado",
  deconsolidated: "Desconsolidado",
};

export type VoyageStatus = "planned" | "departed" | "arrived";

export const voyageStatusLabels: Record<VoyageStatus, string> = {
  planned: "Planeada",
  departed: "Em viagem",
  arrived: "Chegou",
};

export type ManifestStatus = "generated" | "sent";

export const manifestStatusLabels: Record<ManifestStatus, string> = {
  generated: "Gerado",
  sent: "Enviado",
};

export type ClearanceStatus = "pending" | "held" | "released";

export const clearanceStatusLabels: Record<ClearanceStatus, string> = {
  pending: "Por despachar",
  held: "Retida",
  released: "Liberada",
};

export const channelLabels: Record<"green" | "red", string> = {
  green: "Canal verde",
  red: "Canal vermelho",
};

export type ManifestCustomsStatus = "pending" | "validated" | "rejected";

export const manifestCustomsLabels: Record<ManifestCustomsStatus, string> = {
  pending: "Por validar",
  validated: "Validado",
  rejected: "Rejeitado",
};

export type PaymentMethod = "cash" | "card" | "transfer";

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Numerário",
  card: "Cartão",
  transfer: "Transferência",
};
