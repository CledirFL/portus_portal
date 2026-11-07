"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { roleLabels } from "@/lib/permissions";
import { type AdminProfile, listAdminProfiles } from "@/services/api/admin-profiles";
import { administrationRoles, getUserScopes, scopeForRole, staffRoles, type StaffUserInput, type UserScopes } from "@/services/api/users";
import { useAuthStore } from "@/store/auth-store";
import type { Role } from "@/types/user";

export interface UserFormValues {
  name: string;
  email: string;
  phone: string;
  role: Role;
  agencyId: string;
  portId: string;
  adminProfileId: string;
}

/** Valores do formulário prontos para a API: só a agência ou o porto que o perfil exige. */
export function toStaffInput(values: UserFormValues): StaffUserInput {
  const scope = scopeForRole(values.role);
  return {
    name: values.name,
    email: values.email,
    phone: values.phone.trim() || undefined,
    role: values.role,
    agencyId: scope === "agency" ? values.agencyId || null : null,
    portId: scope === "port" ? values.portId || null : null,
    adminProfileId: values.role === "admin" ? values.adminProfileId || null : null,
  };
}

/** Erros por campo vindos da API (ex.: "Escolha o porto deste utilizador."). */
export function fieldErrors(error: unknown): Record<string, string> {
  return error instanceof ApiError ? Object.fromEntries(error.issues.map((issue) => [issue.path, issue.message])) : {};
}

interface UserFieldsProps {
  values: UserFormValues;
  onChange: (values: UserFormValues) => void;
  errors: Record<string, string>;
  /** O email não se muda depois de criada a conta. */
  emailLocked?: boolean;
  /** Perfis permitidos (o cliente só aparece se a conta já for de cliente). */
  roles?: Role[];
}

export function UserFields({ values, onChange, errors, emailLocked = false, roles = staffRoles }: UserFieldsProps) {
  const [scopes, setScopes] = useState<UserScopes | null>(null);
  const [profiles, setProfiles] = useState<AdminProfile[] | null>(null);
  // Só o super admin cria ou muda contas de administração (e escolhe o perfil de administração).
  const isOwner = useAuthStore((state) => state.user?.role === "super_admin");
  const allowedRoles = isOwner ? roles : roles.filter((role) => !administrationRoles.includes(role));
  const scope = scopeForRole(values.role);
  const set = (patch: Partial<UserFormValues>) => onChange({ ...values, ...patch });

  useEffect(() => {
    void getUserScopes().then(setScopes).catch(() => setScopes({ agencies: [], ports: [] }));
  }, []);

  useEffect(() => {
    if (isOwner) void listAdminProfiles().then(setProfiles).catch(() => setProfiles([]));
  }, [isOwner]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Nome" value={values.name} onChange={(event) => set({ name: event.target.value })} error={errors.name} />
      <Input
        label="Email"
        type="email"
        value={values.email}
        disabled={emailLocked}
        onChange={(event) => set({ email: event.target.value })}
        error={errors.email}
      />
      <Input label="Telefone (opcional)" type="tel" value={values.phone} onChange={(event) => set({ phone: event.target.value })} error={errors.phone} />
      <Select
        label="Perfil"
        value={values.role}
        onChange={(event) => set({ role: event.target.value as Role })}
        // O perfil atual aparece sempre, mesmo fora da lista, para o campo nunca ficar em branco.
        options={(allowedRoles.includes(values.role) ? allowedRoles : [values.role, ...allowedRoles]).map((role) => ({ value: role, label: roleLabels[role] ?? role }))}
        error={errors.role}
      />
      {scope === "agency" ? (
        <Select
          label="Agência"
          value={values.agencyId}
          onChange={(event) => set({ agencyId: event.target.value })}
          options={[
            { value: "", label: scopes ? "Escolha a agência" : "A carregar…" },
            ...(scopes?.agencies ?? []).map((agency) => ({
              value: agency.id,
              label: `${agency.name} · ${agency.city} (${agency.countryCode})${agency.status === "active" ? "" : " · inativa"}`,
            })),
          ]}
          error={errors.agencyId}
        />
      ) : null}
      {values.role === "admin" && isOwner ? (
        <Select
          label="Perfil de administração"
          value={values.adminProfileId}
          onChange={(event) => set({ adminProfileId: event.target.value })}
          options={[
            { value: "", label: profiles ? "Escolha o perfil de administração" : "A carregar…" },
            ...(profiles ?? []).map((profile) => ({ value: profile.id, label: profile.name })),
          ]}
          error={errors.adminProfileId}
        />
      ) : null}
      {scope === "port" ? (
        <Select
          label="Porto"
          value={values.portId}
          onChange={(event) => set({ portId: event.target.value })}
          options={[
            { value: "", label: scopes ? "Escolha o porto" : "A carregar…" },
            ...(scopes?.ports ?? []).map((port) => ({ value: port.id, label: `${port.name} · ${port.island}` })),
          ]}
          error={errors.portId}
        />
      ) : null}
    </div>
  );
}
