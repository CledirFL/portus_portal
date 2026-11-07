import { roleLabels } from "@/lib/permissions";
import { type ManagedUser, scopeForRole, type UserStatus } from "@/services/api/users";
import type { Role } from "@/types/user";

export const userStatusTones: Record<UserStatus, "success" | "warning" | "danger"> = {
  active: "success",
  review: "warning",
  blocked: "danger",
};

/** Nome do perfil; se a API devolver um perfil que o portal ainda não conhece, mostra o código em vez de "undefined". */
export function roleLabel(role: Role | string) {
  return roleLabels[role as Role] ?? role;
}

/** Agência ou porto onde a pessoa trabalha, ou o que falta associar antes de aprovar. */
export function userScopeLabel(user: ManagedUser) {
  if (user.agency) return `${user.agency.name} (${user.agency.city})`;
  if (user.port) return `${user.port.name}, ${user.port.island}`;
  if (user.role === "super_admin") return "Toda a plataforma";
  if (user.role === "admin") return user.adminProfile ? `Perfil: ${user.adminProfile.name}` : "sem perfil de administração";
  const scope = scopeForRole(user.role);
  if (scope === "agency") return "sem agência";
  if (scope === "port") return "sem porto";
  return "—";
}
