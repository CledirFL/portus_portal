import type { ManagedUser, UserStatus } from "@/services/api/users";

export const userStatusTones: Record<UserStatus, "success" | "warning" | "danger"> = {
  active: "success",
  review: "warning",
  blocked: "danger",
};

/** Agência ou porto onde a pessoa trabalha. */
export function userScopeLabel(user: ManagedUser) {
  if (user.agency) return `${user.agency.name} (${user.agency.city})`;
  if (user.port) return `${user.port.name}, ${user.port.island}`;
  return "—";
}
