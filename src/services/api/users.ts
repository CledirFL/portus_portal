import { apiRequest } from "@/lib/api-client";
import type { Role } from "@/types/user";

export type UserStatus = "active" | "review" | "blocked";

/** Utilizador tal como o administrador o vê na API. */
export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
  organization: string | null;
  accessNote: string | null;
  agency: { id: string; code: string; name: string; city: string } | null;
  port: { id: string; code: string; name: string; island: string } | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserScopes {
  agencies: Array<{ id: string; code: string; name: string; city: string; countryCode: string; status: string }>;
  ports: Array<{ id: string; code: string; name: string; island: string }>;
}

export interface StaffUserInput {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  agencyId?: string | null;
  portId?: string | null;
}

export const userStatusLabels: Record<UserStatus, string> = {
  active: "Ativo",
  review: "Pedido de acesso",
  blocked: "Bloqueado",
};

/** Perfis da equipa e o âmbito que cada um exige (o servidor volta a validar). */
export const agencyRoles: Role[] = ["agente_recolha", "transitario"];
export const portRoles: Role[] = ["agente_maritimo", "cv_operator", "alfandega", "portaria"];
export const staffRoles: Role[] = [...agencyRoles, ...portRoles, "exporter", "admin"];

export function scopeForRole(role: Role): "agency" | "port" | "none" {
  if (agencyRoles.includes(role)) return "agency";
  if (portRoles.includes(role)) return "port";
  return "none";
}

export function listUsers(query: { status?: UserStatus; role?: Role; q?: string; page: number; pageSize: number }) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.status) params.set("status", query.status);
  if (query.role) params.set("role", query.role);
  if (query.q?.trim()) params.set("q", query.q.trim());
  return apiRequest<{ items: ManagedUser[]; total: number; page: number; pageSize: number; pendingReview: number }>(`/users?${params}`);
}

export function getUser(id: string) {
  return apiRequest<ManagedUser>(`/users/${id}`);
}

export function getUserScopes() {
  return apiRequest<UserScopes>("/users/scopes");
}

export function createUser(input: StaffUserInput) {
  return apiRequest<{ user: ManagedUser; temporaryPassword: string }>("/users", { method: "POST", body: input });
}

export function updateUser(id: string, input: Partial<Omit<StaffUserInput, "email">> & { status?: UserStatus }) {
  return apiRequest<ManagedUser>(`/users/${id}`, { method: "PATCH", body: input });
}

export function resetUserPassword(id: string) {
  return apiRequest<{ temporaryPassword: string }>(`/users/${id}/reset-password`, { method: "POST" });
}

/** "Pedir acesso" (público): a conta fica em revisão até o administrador a aprovar. */
export function requestAccess(input: {
  name: string;
  email: string;
  phone: string;
  organization: string;
  role: Role;
  accessNote?: string;
  password: string;
}) {
  return apiRequest<void>("/auth/request-access", { method: "POST", body: input, auth: "none" });
}
