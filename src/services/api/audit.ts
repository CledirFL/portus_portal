import { apiDownload, apiRequest, saveFile } from "@/lib/api-client";

export type AuditCategory = "change" | "session" | "access" | "refusal";
export type AuditOutcome = "success" | "denied" | "failed";

export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  entity: string;
  entityId: string;
  /** Null em ações anónimas (pedido público) ou automáticas. */
  actor: { id: string; name: string; email: string; role: string } | null;
  ip: string | null;
  category: AuditCategory;
  outcome: AuditOutcome;
  /** Perfil de quem fez, na altura (vazio nos registos antigos). */
  actorRole: string | null;
  userAgent: string | null;
  /** Pedido HTTP, ex.: "POST /api/shipments/…/validate". */
  path: string | null;
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
  category?: AuditCategory | "";
  outcome?: AuditOutcome | "";
  role?: string;
  ip?: string;
}

const filterKeys = ["entity", "action", "entityId", "actor", "from", "to", "category", "outcome", "role", "ip"] as const;

function filterParams(filters: AuditFilters) {
  const params = new URLSearchParams();
  for (const key of filterKeys) {
    const value = filters[key]?.trim();
    if (value) params.set(key, value);
  }
  return params;
}

export function listAudit(filters: AuditFilters & { page: number; pageSize: number }) {
  const params = filterParams(filters);
  params.set("page", String(filters.page));
  params.set("pageSize", String(filters.pageSize));
  return apiRequest<{ items: AuditEntry[]; total: number; page: number; pageSize: number; entities: string[] }>(`/audit?${params}`);
}

/** CSV com os mesmos filtros (abre no Excel); a exportação também fica registada. */
export async function exportAudit(filters: AuditFilters) {
  const { blob, fileName } = await apiDownload(`/audit/export?${filterParams(filters)}`, `registo-de-atividade-${new Date().toISOString().slice(0, 10)}.csv`);
  saveFile(blob, fileName);
}

export const auditCategoryLabels: Record<AuditCategory, string> = {
  change: "Alteração",
  session: "Sessão",
  access: "Consulta",
  refusal: "Recusa",
};

export const auditOutcomeLabels: Record<AuditOutcome, string> = {
  success: "Feito",
  denied: "Recusado",
  failed: "Falhado",
};

/** Nomes legíveis dos tipos de registo. */
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
  agency: "Agência",
  port: "Porto",
  pickup: "Levantamento",
  admin_profile: "Perfil de administração",
  process: "Processo",
  request: "Pedido HTTP",
  audit_log: "Registo de atividade",
  feedback_report: "Problema reportado",
};

/** Nomes legíveis das ações de sessão, consulta e recusa (as alterações mostram o código, ex.: shipment.validate). */
export const auditActionLabels: Record<string, string> = {
  "session.login": "Entrou",
  "session.login_failed": "Entrada falhada",
  "session.login_blocked": "Entrada recusada",
  "session.logout": "Saiu",
  "session.token_reuse": "Sessão reutilizada (possível roubo)",
  "access.denied": "Acesso negado",
  "refusal.wrong_code": "Código de levantamento errado",
  "refusal.identity_mismatch": "Documento ou NIF não corresponde",
  "refusal.authorization_invalid": "Autorização inválida",
  "refusal.invalid_label": "Etiqueta inválida",
  "refusal.wrong_claim_code": "Código errado ao juntar pedidos",
  "refusal.invalid_link": "Link pessoal inválido",
  "shipment.view": "Abriu a encomenda",
  "receipt.view": "Abriu o comprovativo de envio",
  "labels.print": "Abriu as etiquetas",
  "pickup.lookup": "Procurou na portaria",
  "pickup.view": "Abriu o levantamento",
  "gate_pass.view": "Abriu o Gate Pass",
  "agency_delivery.lookup": "Procurou na agência em Cabo Verde",
  "agency_delivery.view": "Abriu a entrega na agência",
  "delivery_note.view": "Abriu o comprovativo de entrega",
  "cargo_list.export": "Exportou a lista de carga",
  "manifest.export": "Exportou o manifesto",
  "occurrence_photo.view": "Viu a fotografia da ocorrência",
  "feedback_screenshot.view": "Viu a captura do problema",
  "user.view": "Abriu a conta",
  "clearance.view": "Abriu o despacho",
  "activity.export": "Exportou o registo de atividade",
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
