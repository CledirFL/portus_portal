import type { CargoCategory } from "@/domain/cargo-types";
import type { VolumeStatus } from "@/domain/state-machine";
import type { ShipmentStatus } from "@/domain/status-labels";
import { ApiError, apiRequest } from "@/lib/api-client";

export interface Volume {
  id: string;
  code: string;
  sequence: number;
  weightKg: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  volumeM3: number | null;
  contents: string | null;
  sealed: boolean;
  status: VolumeStatus;
}

export interface Shipment {
  id: string;
  code: string;
  status: ShipmentStatus;
  source: "manual" | "request" | "import";
  requestReference: string | null;
  externalReference: string | null;
  agency: { id: string; code: string; name: string };
  dispatchCountry: string;
  category: CargoCategory;
  description: string;
  details: Record<string, string>;
  sender: { name: string; phone: string; email: string | null };
  recipient: {
    name: string;
    phone: string;
    island: string;
    nif: string | null;
    documentType: string | null;
    documentNumber: string | null;
  };
  /** Encomendas pequenas: agência em Cabo Verde que entrega ao destinatário (null: levanta no porto). */
  destinationAgency: { id: string; code: string; name: string; city: string; address: string; phone: string } | null;
  /** Código de levantamento do comprovativo (nasce ao validar, com agência em Cabo Verde). */
  pickupCode: string | null;
  /** Transporte e seguro pagos na origem (obrigatório nas viaturas antes do contentor e da partida). */
  transport: {
    required: boolean;
    paid: boolean;
    payments: Array<{ id: string; amount: number; currency: string; method: string; reference: string | null; at: string }>;
  };
  volumes: Volume[];
  totals: { volumes: number; weightKg: number; volumeM3: number };
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VolumeInput {
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  volumeM3?: number;
  contents?: string;
  sealed: boolean;
}

export interface ShipmentFieldsInput {
  category: CargoCategory;
  dispatchCountry: string;
  /** Encomendas pequenas: agência em Cabo Verde (sem indicar, escolhe-se a única que serve a ilha). */
  destinationAgencyId?: string | null;
  description: string;
  details: Record<string, string>;
  externalReference?: string;
  sender: { name: string; phone: string; email?: string };
  recipient: {
    name: string;
    phone: string;
    island: string;
    nif?: string;
    documentType?: "BI" | "CNI" | "Passaporte";
    documentNumber?: string;
  };
  confirmDuplicates?: boolean;
}

export interface PossibleDuplicate {
  code: string;
  reason: "same_reference" | "same_vin" | "same_day_parties_weight";
  message: string;
}

/** Lista de possíveis duplicados de um 409 (BR 9, BR 33), ou null se o erro for outro. */
export function possibleDuplicates(error: unknown): PossibleDuplicate[] | null {
  if (error instanceof ApiError && error.status === 409 && error.body.code === "possible_duplicate") {
    return (error.body.duplicates as PossibleDuplicate[] | undefined) ?? [];
  }
  return null;
}

export interface ShipmentPage {
  items: Shipment[];
  total: number;
  page: number;
  pageSize: number;
}

export function listShipments(query: { status?: ShipmentStatus; q?: string; page?: number; pageSize?: number } = {}) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const search = params.toString();
  return apiRequest<ShipmentPage>(`/shipments${search ? `?${search}` : ""}`);
}

export function getShipment(id: string) {
  return apiRequest<Shipment>(`/shipments/${id}`);
}

export function createShipment(input: ShipmentFieldsInput & { volumes: VolumeInput[]; agencyId?: string }) {
  return apiRequest<Shipment>("/shipments", { method: "POST", body: input });
}

export function updateShipment(id: string, input: ShipmentFieldsInput) {
  return apiRequest<Shipment>(`/shipments/${id}`, { method: "PUT", body: input });
}

export function addVolume(id: string, volume: VolumeInput) {
  return apiRequest<Shipment>(`/shipments/${id}/volumes`, { method: "POST", body: volume });
}

export function updateVolume(id: string, volumeId: string, volume: VolumeInput) {
  return apiRequest<Shipment>(`/shipments/${id}/volumes/${volumeId}`, { method: "PUT", body: volume });
}

export function removeVolume(id: string, volumeId: string) {
  return apiRequest<Shipment>(`/shipments/${id}/volumes/${volumeId}`, { method: "DELETE" });
}

export function validateShipment(id: string, confirmDuplicates = false) {
  return apiRequest<Shipment>(`/shipments/${id}/validate`, { method: "POST", body: { confirmDuplicates } });
}

export function payTransport(id: string, input: { amount: number; currency: "EUR" | "USD" | "CVE"; method: "cash" | "card" | "transfer"; reference: string | null }) {
  return apiRequest<Shipment>(`/shipments/${id}/transport-payments`, { method: "POST", body: input });
}

export function cancelShipment(id: string, reason: string) {
  return apiRequest<Shipment>(`/shipments/${id}/cancel`, { method: "POST", body: { reason } });
}

export interface ShipmentLabels {
  shipment: {
    code: string;
    category: CargoCategory;
    dispatchCountry: string;
    validatedAt: string | null;
    agency: { code: string; name: string; city: string };
    sender: { name: string };
    recipient: { name: string; phone: string; island: string };
  };
  labels: Array<{
    volumeCode: string;
    sequence: number;
    totalVolumes: number;
    weightKg: number;
    volumeM3: number | null;
    contents: string | null;
    sealed: boolean;
    qr: string;
  }>;
}

/** Comprovativo de envio para o remetente (o "papel" com o código de levantamento). */
export interface ShipmentReceipt {
  code: string;
  validatedAt: string | null;
  agency: { name: string; city: string; phone: string };
  category: CargoCategory;
  description: string;
  sender: { name: string; phone: string; email: string | null };
  recipient: { name: string; phone: string; island: string; nif: string | null };
  volumes: Array<{ code: string; weightKg: number }>;
  totals: { volumes: number; weightKg: number; volumeM3: number };
  destinationAgency: Shipment["destinationAgency"];
  pickupCode: string | null;
  qr: string | null;
}

export function getShipmentReceipt(id: string) {
  return apiRequest<ShipmentReceipt>(`/shipments/${id}/receipt`);
}

export function getShipmentLabels(id: string) {
  return apiRequest<ShipmentLabels>(`/shipments/${id}/labels`);
}
