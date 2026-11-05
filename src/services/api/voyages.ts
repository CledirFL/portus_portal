import type { ManifestStatus, VoyageStatus } from "@/domain/status-labels";
import { apiDownload, apiRequest } from "@/lib/api-client";
import type { ContainerSummary, ExportFormat, Page } from "@/services/api/containers";

export type ManifestDeadline =
  | { state: "sent" }
  | { state: "pending"; hoursToEta: number }
  | { state: "alert"; hoursToEta: number };

export interface ManifestSummary {
  id: string;
  version: number;
  status: ManifestStatus;
  complete: boolean;
  totalVolumes: number;
  totalWeightKg: number;
  outdated: boolean;
  createdAt: string;
  sentAt: string | null;
}

export interface Manifest extends ManifestSummary {
  content: {
    issues: string[];
    totals: { containers: number; blMasters: number; volumes: number; weightKg: number; volumeM3: number };
    owners: Array<{ recipientName: string; recipientNif: string | null; volumes: number; weightKg: number }>;
  };
}

export interface Voyage {
  id: string;
  code: string;
  status: VoyageStatus;
  vesselName: string;
  voyageNumber: string | null;
  departurePort: string;
  arrivalPort: { code: string; name: string; island: string };
  etd: string | null;
  eta: string;
  departedAt: string | null;
  agency: { id: string; code: string; name: string };
  containers: ContainerSummary[];
  totals: { containers: number; volumes: number; weightKg: number; volumeM3: number };
  manifestDeadline: ManifestDeadline;
  manifests: ManifestSummary[];
  createdAt: string;
}

export interface VoyageInput {
  agencyId?: string;
  vesselName: string;
  voyageNumber?: string | null;
  departurePort: string;
  arrivalPortCode: string;
  etd?: string | null;
  eta: string;
}

/** Portos de chegada em Cabo Verde (os mesmos da seed do backend). */
export const arrivalPorts = [
  { code: "CVRAI", name: "Porto da Praia", island: "Santiago" },
  { code: "CVMIN", name: "Porto Grande (Mindelo)", island: "São Vicente" },
] as const;

export function listVoyages(params: { status?: VoyageStatus; alert?: boolean; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.alert) query.set("alert", "true");
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 25));
  return apiRequest<Page<Voyage>>(`/voyages?${query}`);
}

export function getVoyage(id: string) {
  return apiRequest<Voyage>(`/voyages/${id}`);
}

export function createVoyage(input: VoyageInput) {
  return apiRequest<Voyage>("/voyages", { method: "POST", body: input });
}

export function updateVoyage(id: string, input: VoyageInput) {
  return apiRequest<Voyage>(`/voyages/${id}`, { method: "PUT", body: input });
}

export function assignContainerToVoyage(id: string, containerId: string) {
  return apiRequest<Voyage>(`/voyages/${id}/containers`, { method: "POST", body: { containerId } });
}

export function removeContainerFromVoyage(id: string, containerId: string) {
  return apiRequest<Voyage>(`/voyages/${id}/containers/${containerId}`, { method: "DELETE" });
}

export function departVoyage(id: string) {
  return apiRequest<Voyage>(`/voyages/${id}/depart`, { method: "POST" });
}

export function generateManifest(id: string) {
  return apiRequest<Manifest>(`/voyages/${id}/manifests`, { method: "POST" });
}

export function sendManifest(id: string, manifestId: string) {
  return apiRequest<Voyage>(`/voyages/${id}/manifests/${manifestId}/send`, { method: "POST" });
}

export function exportManifest(voyage: Pick<Voyage, "id" | "code">, manifest: Pick<ManifestSummary, "id" | "version">, format: ExportFormat) {
  return apiDownload(
    `/voyages/${voyage.id}/manifests/${manifest.id}/export?format=${format}`,
    `manifesto-${voyage.code}-v${manifest.version}.${format}`,
  );
}
