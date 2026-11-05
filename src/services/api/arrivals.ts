import type { Charges, CustomsChannel, OccurrenceType, TariffRule } from "@/domain/clearance";
import type { ContainerStatus, VolumeStatus } from "@/domain/state-machine";
import type { ClearanceStatus, ManifestCustomsStatus, PaymentMethod, VoyageStatus } from "@/domain/status-labels";
import { apiDownload, apiRequest } from "@/lib/api-client";
import type { Page } from "@/services/api/containers";

// ---------- Terminal ----------

export interface TerminalVoyage {
  id: string;
  code: string;
  status: VoyageStatus;
  vesselName: string;
  voyageNumber: string | null;
  departurePort: string;
  arrivalPort: { code: string; name: string };
  eta: string;
  departedAt: string | null;
  arrivedAt: string | null;
  agency: { id: string; code: string; name: string };
  manifest: {
    id: string;
    version: number;
    sentAt: string | null;
    customsStatus: ManifestCustomsStatus;
    customsReference: string | null;
    customsNote: string | null;
  } | null;
  containers: Array<{ id: string; number: string; status: ContainerStatus; sealNumber: string | null; volumes: number; accountedFor: number; occurrences: number }>;
}

export interface TerminalContainer {
  id: string;
  number: string;
  status: ContainerStatus;
  sealNumber: string | null;
  arrivedAt: string | null;
  deconsolidatedAt: string | null;
  agency: { code: string; name: string };
  voyage: { id: string; code: string; vesselName: string; arrivalPort: string } | null;
  progress: { volumes: number; checked: number; accountedFor: number };
  volumes: Array<{
    id: string;
    code: string;
    status: VolumeStatus;
    weightKg: number;
    contents: string | null;
    checkedAt: string | null;
    warehouseLocation: string | null;
    occurrenceTypes: OccurrenceType[];
    shipment: { id: string; code: string; recipientName: string; recipientIsland: string };
  }>;
  occurrences: Array<{
    id: string;
    type: OccurrenceType;
    volumeId: string | null;
    volumeCode: string | null;
    description: string;
    createdAt: string;
    photos: Array<{ id: string; contentType: string }>;
  }>;
}

export function listTerminalVoyages(params: { status?: "departed" | "arrived"; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 25) });
  if (params.status) query.set("status", params.status);
  return apiRequest<Page<TerminalVoyage>>(`/terminal/voyages?${query}`);
}

export const getTerminalVoyage = (id: string) => apiRequest<TerminalVoyage>(`/terminal/voyages/${id}`);
export const registerArrival = (id: string) => apiRequest<TerminalVoyage>(`/terminal/voyages/${id}/arrive`, { method: "POST" });
export const getTerminalContainer = (id: string) => apiRequest<TerminalContainer>(`/terminal/containers/${id}`);

export function checkVolume(id: string, code: string, location: string | null) {
  return apiRequest<{ result: "checked" | "already_checked"; volumeCode: string; container: TerminalContainer }>(`/terminal/containers/${id}/check`, {
    method: "POST",
    body: { code, location },
  });
}

export function createOccurrence(id: string, input: { type: OccurrenceType; volumeId?: string; volumeCode?: string; description: string }) {
  return apiRequest<{ occurrenceId: string; container: TerminalContainer }>(`/terminal/containers/${id}/occurrences`, { method: "POST", body: input });
}

export function addOccurrencePhoto(occurrenceId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<TerminalContainer>(`/terminal/occurrences/${occurrenceId}/photos`, { method: "POST", body: form });
}

export const occurrencePhoto = (occurrenceId: string, photoId: string) =>
  apiDownload(`/terminal/occurrences/${occurrenceId}/photos/${photoId}`, "fotografia");

export const updateLocation = (volumeId: string, location: string) =>
  apiRequest<TerminalContainer>(`/terminal/volumes/${volumeId}/location`, { method: "PUT", body: { location } });

export const closeContainer = (id: string) => apiRequest<TerminalContainer>(`/terminal/containers/${id}/close`, { method: "POST" });

// ---------- Alfândega ----------

export interface CustomsVoyage {
  id: string;
  code: string;
  status: VoyageStatus;
  vesselName: string;
  voyageNumber: string | null;
  eta: string;
  arrivedAt: string | null;
  agency: { code: string; name: string };
  arrivalPort: string;
  manifest: {
    id: string;
    version: number;
    sentAt: string | null;
    totalVolumes: number;
    totalWeightKg: number;
    customsStatus: ManifestCustomsStatus;
    customsReference: string | null;
    customsNote: string | null;
  } | null;
  clearances: { pending: number; held: number; released: number };
}

export interface Clearance {
  id: string;
  status: ClearanceStatus;
  channel: CustomsChannel | null;
  dutiesCve: number;
  reason: string | null;
  decidedAt: string | null;
  pickupCode: string | null;
  exempt: boolean;
  manifestValidated: boolean;
  voyage: { id: string; code: string; vesselName: string };
  shipment: {
    id: string;
    code: string;
    category: string;
    description: string;
    sender: { name: string };
    recipient: { name: string; phone: string; island: string; nif: string | null; documentType: string | null; documentNumber: string | null };
  };
  volumes: Array<{ id: string; code: string; status: VolumeStatus; weightKg: number; warehouseLocation: string | null }>;
  occurrences: Array<{ type: OccurrenceType; description: string; volumeCode: string }>;
  uncheckedVolumes: number;
  suggestion: { channel: CustomsChannel; reasons: string[] };
  history: Array<{ action: string; reason: string | null; at: string }>;
}

export const listCustomsVoyages = () => apiRequest<CustomsVoyage[]>("/customs/voyages");
export const validateManifest = (id: string, reference: string) =>
  apiRequest<void>(`/customs/manifests/${id}/validate`, { method: "POST", body: { reference } });
export const rejectManifest = (id: string, reason: string) => apiRequest<void>(`/customs/manifests/${id}/reject`, { method: "POST", body: { reason } });
export const listClearances = (voyageId: string) => apiRequest<Clearance[]>(`/customs/voyages/${voyageId}/clearances`);
export const setChannel = (id: string, channel: CustomsChannel, reason: string | null) =>
  apiRequest<Clearance>(`/customs/clearances/${id}/channel`, { method: "POST", body: { channel, reason } });
export const holdClearance = (id: string, reason: string) => apiRequest<Clearance>(`/customs/clearances/${id}/hold`, { method: "POST", body: { reason } });
export const releaseClearance = (id: string, dutiesCve: number, reason: string | null) =>
  apiRequest<Clearance>(`/customs/clearances/${id}/release`, { method: "POST", body: { dutiesCve, reason } });

// ---------- Portaria ----------

export const documentTypes = ["CNI", "BI", "Passaporte", "Autorização de residência"] as const;
export type DocumentType = (typeof documentTypes)[number];

export interface PickupView {
  shipment: {
    id: string;
    code: string;
    category: string;
    description: string;
    sender: { name: string };
    recipient: { name: string; phone: string; island: string; nif: string | null; documentType: string | null; documentNumber: string | null };
  };
  voyage: { code: string; vesselName: string; port: string };
  clearance: { status: ClearanceStatus; channel: CustomsChannel | null; pickupCode: string | null; exemptionReason: string | null };
  volumes: Array<{ id: string; code: string; status: VolumeStatus; weightKg: number; warehouseLocation: string | null }>;
  charges: Charges;
  payments: Array<{ id: string; amountCve: number; method: PaymentMethod; reference: string | null; createdAt: string }>;
  authorizations: Array<{ id: string; name: string; nif: string; documentType: string; documentNumber: string; validUntil: string; active: boolean }>;
  pickups: Array<{ id: string; gatePassNumber: string; personName: string; volumeCodes: string[]; issuedAt: string }>;
  canPickUp: boolean;
  blockers: string[];
}

export interface PickupInput {
  volumes: string[];
  person: { name: string; documentType: DocumentType; documentNumber: string; nif: string | null };
  authorizationId: string | null;
  confirmation: { method: "code"; code: string } | { method: "signature"; image: string };
}

export interface GatePass {
  id: string;
  gatePassNumber: string;
  qr: string;
  issuedAt: string;
  issuedBy: string | null;
  port: { code: string; name: string };
  voyage: { code: string; vesselName: string };
  shipment: { id: string; code: string; recipientName: string; recipientIsland: string };
  person: { name: string; documentType: string; documentNumber: string; nif: string | null };
  authorizedThirdParty: boolean;
  confirmation: string;
  amountPaidCve: number;
  exempt: boolean;
  volumes: Array<{ code: string; weightKg: number | null; contents: string | null }>;
}

export const lookupPickup = (q: string) => apiRequest<PickupView>(`/pickups/lookup?q=${encodeURIComponent(q)}`);
export const getPickup = (shipmentId: string) => apiRequest<PickupView>(`/pickups/shipments/${shipmentId}`);
export const registerPayment = (shipmentId: string, input: { amountCve: number; method: PaymentMethod; reference: string | null }) =>
  apiRequest<PickupView>(`/pickups/shipments/${shipmentId}/payments`, { method: "POST", body: input });
export const registerExemption = (shipmentId: string, reason: string) =>
  apiRequest<PickupView>(`/pickups/shipments/${shipmentId}/exemption`, { method: "POST", body: { reason } });
export const authorizeThirdParty = (
  shipmentId: string,
  input: { name: string; nif: string; documentType: DocumentType; documentNumber: string; validUntil: string },
) => apiRequest<PickupView>(`/pickups/shipments/${shipmentId}/authorizations`, { method: "POST", body: input });
export const revokeAuthorization = (shipmentId: string, authorizationId: string) =>
  apiRequest<PickupView>(`/pickups/shipments/${shipmentId}/authorizations/${authorizationId}`, { method: "DELETE" });
export const pickUp = (shipmentId: string, input: PickupInput) =>
  apiRequest<GatePass>(`/pickups/shipments/${shipmentId}`, { method: "POST", body: input });
export const getGatePass = (id: string) => apiRequest<GatePass>(`/pickups/${id}/gate-pass`);

// ---------- Tarifas ----------

export const listTariffs = () => apiRequest<TariffRule[]>("/tariffs");
export const updateTariff = (code: string, input: { label?: string; amountCve: number; freeDays: number }) =>
  apiRequest<TariffRule[]>(`/tariffs/${code}`, { method: "PUT", body: input });

/** Prazo até a carga não levantada ser declarada abandonada e dias de aviso antes (BR 25). */
export interface AbandonmentSettings {
  afterDays: number;
  warningDays: number;
}

export const getAbandonmentSettings = () => apiRequest<AbandonmentSettings>("/settings/abandonment");
export const updateAbandonmentSettings = (input: AbandonmentSettings) =>
  apiRequest<AbandonmentSettings>("/settings/abandonment", { method: "PUT", body: input });
/** Corre já a verificação que o servidor faz de hora a hora. */
export const runAbandonmentCheck = () => apiRequest<{ warned: number; abandoned: number }>("/settings/abandonment/run", { method: "POST" });
