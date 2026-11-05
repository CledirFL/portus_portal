import { apiRequest } from "@/lib/api-client";

export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  entity: string;
  entityId: string;
  /** Null em ações anónimas (pedido público) ou automáticas. */
  actor: { id: string; name: string; email: string; role: string } | null;
  ip: string | null;
  before: unknown;
  after: unknown;
}

export interface AuditFilters {
  entity?: string;
  action?: string;
  entityId?: string;
  actor?: string;
  from?: string;
  to?: string;
}

export function listAudit(filters: AuditFilters & { page: number; pageSize: number }) {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) });
  for (const key of ["entity", "action", "entityId", "actor", "from", "to"] as const) {
    const value = filters[key]?.trim();
    if (value) params.set(key, value);
  }
  return apiRequest<{ items: AuditEntry[]; total: number; page: number; pageSize: number; entities: string[] }>(`/audit?${params}`);
}

/** Nomes legíveis dos tipos de registo auditados. */
export const auditEntityLabels: Record<string, string> = {
  shipment_request: "Pedido de cliente",
  shipment: "Encomenda",
  shipment_import: "Importação",
  volume: "Volume",
  container: "Contentor",
  voyage: "Viagem",
  manifest: "Manifesto",
  occurrence: "Ocorrência",
  clearance: "Despacho",
  tariff: "Tarifa",
  user: "Utilizador",
};

/** Campos que mudaram entre o antes e o depois (só no primeiro nível). */
export function changedFields(before: unknown, after: unknown) {
  const asRecord = (value: unknown) => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {});
  const left = asRecord(before);
  const right = asRecord(after);
  const ignored = new Set(["updatedAt", "createdAt"]);
  return [...new Set([...Object.keys(left), ...Object.keys(right)])]
    .filter((key) => !ignored.has(key) && JSON.stringify(left[key]) !== JSON.stringify(right[key]))
    .map((key) => ({ key, before: left[key], after: right[key] }));
}
