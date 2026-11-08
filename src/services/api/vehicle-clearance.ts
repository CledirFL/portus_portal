import type { VehicleTaxEstimate } from "@/domain/vehicle-taxes";
import { apiDownload, apiRequest } from "@/lib/api-client";

export type VehicleClearanceStatus = "draft" | "submitted" | "changes_requested" | "assessed" | "inspected" | "paid" | "registered";
export type VehicleDocumentStatus = "pending" | "accepted" | "rejected";

export const vehicleClearanceStatusLabels: Record<VehicleClearanceStatus, string> = {
  draft: "Em preparação",
  submitted: "Na Alfândega",
  changes_requested: "Correções pedidas",
  assessed: "Direitos liquidados · inspeção",
  inspected: "Inspeção aprovada · pagar",
  paid: "Pago · matrícula",
  registered: "Matriculada",
};

export const vehicleDocumentStatusLabels: Record<VehicleDocumentStatus | "missing", string> = {
  missing: "Em falta",
  pending: "Por analisar",
  accepted: "Aceite",
  rejected: "Recusado",
};

export interface VehicleClearanceSummary {
  id: string;
  shipmentId: string;
  shipmentCode: string;
  vehicle: string;
  vin: string | null;
  owner: { id: string; name: string; email: string };
  status: VehicleClearanceStatus;
  regime: string;
  submittedAt: string | null;
  vesselName: string | null;
  arrived: boolean;
  assessedCve: number | null;
  plateNumber: string | null;
  updatedAt: string;
}

export interface VehicleClearance extends VehicleClearanceSummary {
  regimeLabel: string;
  valueEur: number;
  transportEur: number;
  insuranceEur: number;
  details: { make: string | null; model: string | null; year: string | null; engineCc: string | null; fuel: string | null; condition: string | null };
  arrivalPort: string | null;
  requiredDocuments: Array<{ type: string; label: string; status: VehicleDocumentStatus | "missing" }>;
  documents: Array<{
    id: string;
    type: string;
    label: string;
    fileName: string;
    contentType: string;
    size: number;
    status: VehicleDocumentStatus;
    rejectionReason: string | null;
    uploadedAt: string;
  }>;
  estimate: VehicleTaxEstimate | null;
  reviewNote: string | null;
  assessment: (VehicleTaxEstimate & { adjustedCve: number | null; note: string | null }) | null;
  assessedAt: string | null;
  inspection: { result: "approved" | "rejected"; notes: string | null; at: string | null } | null;
  payment: { reference: string | null; at: string } | null;
  registeredAt: string | null;
  pickupCode: string | null;
  events: Array<{ action: string; label: string; note: string | null; at: string }>;
  canEdit: boolean;
}

export interface MyVehicle {
  shipmentId: string;
  shipmentCode: string;
  vehicle: string;
  status: VehicleClearanceStatus | null;
  plateNumber: string | null;
}

// Dono (área de cliente)
export const listMyVehicles = () => apiRequest<MyVehicle[]>("/me/vehicles");
export const openMyClearance = (shipmentId: string) => apiRequest<VehicleClearance>(`/me/vehicles/${shipmentId}/clearance`, { method: "POST" });
export const getMyClearance = (shipmentId: string) => apiRequest<VehicleClearance>(`/me/vehicles/${shipmentId}/clearance`);
export const declareMyClearance = (shipmentId: string, input: { regime: string; valueEur: number; transportEur: number; insuranceEur: number }) =>
  apiRequest<VehicleClearance>(`/me/vehicles/${shipmentId}/clearance`, { method: "PUT", body: input });
export function uploadMyDocument(shipmentId: string, type: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<VehicleClearance>(`/me/vehicles/${shipmentId}/clearance/documents?type=${encodeURIComponent(type)}`, { method: "POST", body: form });
}
export const removeMyDocument = (shipmentId: string, documentId: string) =>
  apiRequest<VehicleClearance>(`/me/vehicles/${shipmentId}/clearance/documents/${documentId}`, { method: "DELETE" });
export const submitMyClearance = (shipmentId: string) => apiRequest<VehicleClearance>(`/me/vehicles/${shipmentId}/clearance/submit`, { method: "POST" });

// Alfândega e DGTR
export function listVehicleClearances(statuses: VehicleClearanceStatus[]) {
  return apiRequest<VehicleClearanceSummary[]>(`/vehicle-clearances${statuses.length ? `?status=${statuses.join(",")}` : ""}`);
}
export const getVehicleClearance = (id: string) => apiRequest<VehicleClearance>(`/vehicle-clearances/${id}`);
export const reviewVehicleDocument = (id: string, documentId: string, input: { status: "accepted" } | { status: "rejected"; reason: string }) =>
  apiRequest<VehicleClearance>(`/vehicle-clearances/${id}/documents/${documentId}/review`, { method: "POST", body: input });
export const requestVehicleChanges = (id: string, note: string) =>
  apiRequest<VehicleClearance>(`/vehicle-clearances/${id}/request-changes`, { method: "POST", body: { note } });
export const assessVehicle = (id: string, input: { amountCve: number | null; note: string | null }) =>
  apiRequest<VehicleClearance>(`/vehicle-clearances/${id}/assess`, { method: "POST", body: input });
export const inspectVehicle = (id: string, input: { result: "approved" | "rejected"; notes: string | null }) =>
  apiRequest<VehicleClearance>(`/vehicle-clearances/${id}/inspection`, { method: "POST", body: input });
export const registerVehiclePayment = (id: string, input: { method: "cash" | "card" | "transfer"; reference: string }) =>
  apiRequest<VehicleClearance>(`/vehicle-clearances/${id}/payment`, { method: "POST", body: input });
export const registerVehiclePlate = (id: string, plateNumber: string) =>
  apiRequest<VehicleClearance>(`/vehicle-clearances/${id}/registration`, { method: "POST", body: { plateNumber } });

/** Abre o documento noutro separador (o pedido leva a sessão; o link direto não). */
export async function openVehicleDocument(clearanceId: string, documentId: string) {
  const { blob } = await apiDownload(`/vehicle-clearances/${clearanceId}/documents/${documentId}/file`, "documento");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
