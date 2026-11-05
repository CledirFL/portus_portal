import type { ContainerType, LoadType } from "@/domain/containers";
import type { ContainerStatus, VolumeStatus } from "@/domain/state-machine";
import { apiDownload, apiRequest } from "@/lib/api-client";

export type ExportFormat = "xlsx" | "pdf" | "csv";

export interface Load {
  volumes: number;
  weightKg: number;
  volumeM3: number;
}

export interface BlMaster {
  id: string;
  number: string;
  loadType: LoadType;
  maxWeightKg: number | null;
  maxVolumeM3: number | null;
  totals: Load;
}

export interface ContainerVolume {
  id: string;
  code: string;
  status: VolumeStatus;
  weightKg: number;
  volumeM3: number | null;
  contents: string | null;
  blMasterId: string | null;
  consolidatedAt: string | null;
  shipment: { id: string; code: string; category: string; senderName: string; recipientName: string; recipientIsland: string };
}

export interface ContainerSummary {
  id: string;
  number: string;
  sizeType: string;
  sizeTypeLabel: string;
  carrier: string | null;
  status: ContainerStatus;
  sealNumber: string | null;
  sealedAt: string | null;
  agency: { id: string; code: string; name: string };
  voyage: { id: string; code: string; vesselName: string; eta: string; status: string } | null;
  capacity: { maxWeightKg: number; maxVolumeM3: number | null };
  totals: Load;
  volumesWithoutBl: number;
  blMasterNumbers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Container extends Omit<ContainerSummary, "blMasterNumbers"> {
  blMasters: BlMaster[];
  volumes: ContainerVolume[];
  history: Array<{ fromStatus: ContainerStatus | null; toStatus: ContainerStatus; reason: string | null; at: string }>;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateContainerInput {
  agencyId?: string;
  number: string;
  sizeType: string;
  carrier?: string;
  maxWeightKg?: number;
  maxVolumeM3?: number | null;
}

export function getContainerTypes() {
  return apiRequest<ContainerType[]>("/containers/types");
}

export function listContainers(params: { status?: ContainerStatus; q?: string; unassigned?: boolean; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.unassigned !== undefined) query.set("unassigned", String(params.unassigned));
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 25));
  return apiRequest<Page<ContainerSummary>>(`/containers?${query}`);
}

export function getContainer(id: string) {
  return apiRequest<Container>(`/containers/${id}`);
}

export function createContainer(input: CreateContainerInput) {
  return apiRequest<Container>("/containers", { method: "POST", body: input });
}

export function addBlMaster(id: string, input: { number: string; loadType: LoadType; maxWeightKg?: number | null; maxVolumeM3?: number | null }) {
  return apiRequest<Container>(`/containers/${id}/bl-masters`, { method: "POST", body: input });
}

export function removeBlMaster(id: string, blMasterId: string) {
  return apiRequest<Container>(`/containers/${id}/bl-masters/${blMasterId}`, { method: "DELETE" });
}

export function scanVolume(id: string, code: string, blMasterId: string | null) {
  return apiRequest<{ result: "added" | "already_here"; volumeCode: string; container: Container }>(`/containers/${id}/volumes`, {
    method: "POST",
    body: { code, blMasterId },
  });
}

export function assignBlMaster(id: string, volumeId: string, blMasterId: string | null) {
  return apiRequest<Container>(`/containers/${id}/volumes/${volumeId}/bl-master`, { method: "PUT", body: { blMasterId } });
}

export function removeContainerVolume(id: string, volumeId: string, reason: string) {
  return apiRequest<Container>(`/containers/${id}/volumes/${volumeId}/remove`, { method: "POST", body: { reason } });
}

export function sealContainer(id: string, sealNumber: string) {
  return apiRequest<Container>(`/containers/${id}/seal`, { method: "POST", body: { sealNumber } });
}

export function reopenContainer(id: string, reason: string) {
  return apiRequest<Container>(`/containers/${id}/reopen`, { method: "POST", body: { reason } });
}

export function exportContainer(id: string, number: string, format: ExportFormat) {
  return apiDownload(`/containers/${id}/export?format=${format}`, `contentor-${number}.${format}`);
}
