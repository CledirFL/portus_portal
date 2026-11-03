// Textos visíveis dos estados devolvidos pela API (português; passam para o i18n mais tarde).
import type { VolumeStatus } from "@/domain/state-machine";

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
  delivered: "Entregue",
  abandoned: "Abandonado",
};
