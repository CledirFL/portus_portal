import { apiRequest } from "@/lib/api-client";

export type PlatformProcess = "maintenance" | "requests" | "validation" | "departure" | "release" | "delivery";

export interface PlatformStatus {
  maintenance: { message: string } | null;
  blocked: Array<{ process: PlatformProcess; label: string; message: string }>;
}

export interface BlocksOverview {
  processes: Array<{
    process: PlatformProcess;
    label: string;
    description: string;
    blocked: boolean;
    message: string | null;
    blockedAt: string | null;
  }>;
  agencies: Array<{
    id: string;
    code: string;
    name: string;
    city: string;
    kind: "origin" | "destination";
    suspendedAt: string | null;
    suspendedReason: string | null;
  }>;
  ports: Array<{ id: string; code: string; name: string; island: string; suspendedAt: string | null; suspendedReason: string | null }>;
}

/** Público: modo de manutenção e processos parados, para mostrar o aviso. */
export const getPlatformStatus = () => apiRequest<PlatformStatus>("/platform/status", { auth: "none" });

export const getBlocks = () => apiRequest<BlocksOverview>("/admin/blocks");

export const setProcessBlock = (process: PlatformProcess, input: { blocked: boolean; message?: string | null }) =>
  apiRequest<BlocksOverview>(`/admin/blocks/processes/${process}`, { method: "PUT", body: input });

export const suspendAgency = (id: string, input: { suspended: boolean; reason?: string | null }) =>
  apiRequest<BlocksOverview>(`/admin/blocks/agencies/${id}`, { method: "PUT", body: input });

export const suspendPort = (id: string, input: { suspended: boolean; reason?: string | null }) =>
  apiRequest<BlocksOverview>(`/admin/blocks/ports/${id}`, { method: "PUT", body: input });
