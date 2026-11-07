import type { Charges } from "@/domain/clearance";
import type { VolumeStatus } from "@/domain/state-machine";
import type { PaymentMethod } from "@/domain/status-labels";
import { apiRequest } from "@/lib/api-client";

export type AgencyStage = "port" | "released" | "to_agency" | "at_agency" | "delivered";

export const agencyStageLabels: Record<AgencyStage, string> = {
  released: "Liberadas no porto",
  to_agency: "A caminho",
  at_agency: "Na agência",
  delivered: "Entregues",
  port: "Ainda no porto",
};

export interface AgencyShipment {
  id: string;
  code: string;
  validatedAt: string | null;
  sender: { name: string; phone: string };
  recipient: { name: string; phone: string; island: string };
  volumes: Array<{ code: string; status: VolumeStatus; weightKg: number }>;
  customs: "pending" | "held" | "released" | null;
  vesselName: string | null;
}

export interface AgencyShipmentDetail extends Omit<AgencyShipment, "recipient"> {
  recipient: { name: string; phone: string; island: string; nif: string | null; documentType: string | null; documentNumber: string | null };
  destinationAgency: { name: string; city: string } | null;
  charges: Charges | null;
  payments: Array<{ amountCve: number; method: PaymentMethod; reference: string | null; at: string }>;
  deliveries: Array<{ id: string; number: string; personName: string; withReceipt: boolean; at: string }>;
  canDeliver: boolean;
  blockers: string[];
}

export interface DeliveryNote {
  id: string;
  number: string;
  issuedAt: string;
  agency: { name: string; city: string; address: string } | null;
  shipment: { code: string; recipientName: string; recipientIsland: string; senderName: string };
  person: { name: string; documentType: string; documentNumber: string };
  withReceipt: boolean;
  volumes: string[];
  amountPaidCve: number;
}

export type DeliverInput =
  | { mode: "recipient"; person: { name: string; documentType: string; documentNumber: string; nif?: string | null } }
  | { mode: "receipt"; pickupCode: string; recipientDocument: string; person: { name: string; documentType: string; documentNumber: string } };

export function listAgencyShipments(query: { stage: AgencyStage; q?: string; page: number; pageSize: number }) {
  const params = new URLSearchParams({ stage: query.stage, page: String(query.page), pageSize: String(query.pageSize) });
  if (query.q?.trim()) params.set("q", query.q.trim());
  return apiRequest<{ items: AgencyShipment[]; total: number; page: number; pageSize: number; counts: Record<AgencyStage, number> }>(
    `/cv-agency/shipments?${params}`,
  );
}

export const collectAtPort = (shipmentIds: string[]) =>
  apiRequest<{ shipments: number; volumes: number }>("/cv-agency/collect", { method: "POST", body: { shipmentIds } });

export const receiveAtAgency = (code: string) =>
  apiRequest<{ result: "received" | "already_here"; volumeCode: string; shipmentCode: string; ready: boolean }>("/cv-agency/receive", {
    method: "POST",
    body: { code },
  });

export const lookupAgencyShipment = (q: string) => apiRequest<AgencyShipmentDetail>(`/cv-agency/lookup?q=${encodeURIComponent(q)}`);

export const getAgencyShipment = (id: string) => apiRequest<AgencyShipmentDetail>(`/cv-agency/shipments/${id}`);

export const payAtAgency = (id: string, input: { amountCve: number; method: PaymentMethod; reference?: string }) =>
  apiRequest<AgencyShipmentDetail>(`/cv-agency/shipments/${id}/payments`, { method: "POST", body: input });

export const deliverAtAgency = (id: string, input: DeliverInput) =>
  apiRequest<DeliveryNote>(`/cv-agency/shipments/${id}/deliver`, { method: "POST", body: input });

export const getDeliveryNote = (id: string) => apiRequest<DeliveryNote>(`/cv-agency/deliveries/${id}`);
