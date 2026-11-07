import { apiRequest } from "@/lib/api-client";
import type { AdminPermission } from "@/types/user";

export interface AdminProfile {
  id: string;
  name: string;
  description: string | null;
  permissions: AdminPermission[];
  users: Array<{ id: string; name: string; email: string; status: string }>;
  updatedAt: string;
}

export interface AdminProfileInput {
  name: string;
  description: string | null;
  permissions: AdminPermission[];
}

/** Só o super admin gere os perfis de administração. */
export const listAdminProfiles = () => apiRequest<AdminProfile[]>("/admin/profiles");

export const listAdminPermissions = () => apiRequest<Array<{ key: AdminPermission; label: string }>>("/admin/profiles/permissions");

export const getAdminProfile = (id: string) => apiRequest<AdminProfile>(`/admin/profiles/${id}`);

export const createAdminProfile = (input: AdminProfileInput) => apiRequest<AdminProfile>("/admin/profiles", { method: "POST", body: input });

export const updateAdminProfile = (id: string, input: AdminProfileInput) =>
  apiRequest<AdminProfile>(`/admin/profiles/${id}`, { method: "PUT", body: input });

export const deleteAdminProfile = (id: string) => apiRequest<void>(`/admin/profiles/${id}`, { method: "DELETE" });
