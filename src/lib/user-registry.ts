import type { User, UserStatus } from "@/types/user";

export const userStatusConfig: Record<
  UserStatus,
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  active: { label: "Ativo", tone: "success" },
  review: { label: "Em revisão", tone: "warning" },
  blocked: { label: "Bloqueado", tone: "danger" },
};

export function getUserStatusLabel(status?: UserStatus) {
  return status ? userStatusConfig[status].label : userStatusConfig.active.label;
}

export function getUserStatusTone(status?: UserStatus) {
  return status ? userStatusConfig[status].tone : userStatusConfig.active.tone;
}

export function filterUsersByQuery(users: User[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return users;
  }

  return users.filter((user) => {
    const haystack = [
      user.name,
      user.email,
      user.company,
      user.role,
      ...(user.permissions ?? []),
      user.department ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
