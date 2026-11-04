import type { CargoCategory } from "@/domain/cargo-types";
import { apiRequest } from "@/lib/api-client";

export type ImportMapping = Record<string, number | null>;

export interface ImportField {
  key: string;
  label: string;
  required: boolean;
}

export interface ImportReport {
  summary: { rows: number; shipments: number; valid: number; invalid: number; duplicates: number; imported: number };
  groups: Array<{
    key: string;
    rows: number[];
    status: "valid" | "invalid" | "duplicate";
    recipientName: string | null;
    volumes: number;
    weightKg: number;
    errors: Array<{ row: number; column: string | null; message: string }>;
    duplicates: Array<{ code: string; reason: string; message: string }>;
    shipmentCode: string | null;
    shipmentId: string | null;
  }>;
}

export interface ShipmentImport {
  id: string;
  fileName: string;
  status: "uploaded" | "committed";
  agency: { id: string; name: string };
  headers: string[];
  rowCount: number;
  sample: string[][];
  suggestedMapping: ImportMapping;
  mapping: ImportMapping | null;
  report: ImportReport | null;
  shipmentsCreated: number;
  createdAt: string;
  committedAt: string | null;
}

export function getImportFields() {
  return apiRequest<ImportField[]>("/imports/fields");
}

export function uploadImport(file: File, agencyId?: string) {
  const form = new FormData();
  if (agencyId) form.append("agencyId", agencyId);
  form.append("file", file);
  return apiRequest<ShipmentImport>("/imports", { method: "POST", body: form });
}

export function listImports(page = 1, pageSize = 10) {
  return apiRequest<{ items: ShipmentImport[]; total: number; page: number; pageSize: number }>(
    `/imports?page=${page}&pageSize=${pageSize}`,
  );
}

export function previewImport(id: string, mapping: ImportMapping, defaultCategory?: CargoCategory) {
  return apiRequest<ImportReport>(`/imports/${id}/preview`, { method: "POST", body: { mapping, defaultCategory } });
}

export function commitImport(id: string, mapping: ImportMapping, defaultCategory: CargoCategory | undefined, confirmDuplicates: boolean) {
  return apiRequest<ImportReport>(`/imports/${id}/commit`, {
    method: "POST",
    body: { mapping, defaultCategory, confirmDuplicates },
  });
}
