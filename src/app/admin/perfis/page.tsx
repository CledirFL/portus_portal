"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api-client";
import { adminPermissionLabels } from "@/lib/permissions";
import {
  type AdminProfile,
  type AdminProfileInput,
  createAdminProfile,
  deleteAdminProfile,
  listAdminPermissions,
  listAdminProfiles,
  updateAdminProfile,
} from "@/services/api/admin-profiles";
import { useAuthStore } from "@/store/auth-store";
import type { AdminPermission } from "@/types/user";

const emptyProfile: AdminProfileInput = { name: "", description: "", permissions: [] };

function ProfileForm({
  initial,
  permissions,
  onSaved,
  onCancel,
  save,
}: {
  initial: AdminProfileInput;
  permissions: Array<{ key: AdminPermission; label: string }>;
  onSaved: () => void;
  onCancel: () => void;
  save: (input: AdminProfileInput) => Promise<unknown>;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (key: AdminPermission) =>
    setValues((current) => ({
      ...current,
      permissions: current.permissions.includes(key) ? current.permissions.filter((item) => item !== key) : [...current.permissions, key],
    }));

  return (
    <form
      className="space-y-4"
      data-cy="profile-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setErrors({});
        setError("");
        try {
          await save({ ...values, description: values.description?.trim() || null });
          onSaved();
        } catch (cause) {
          setErrors(cause instanceof ApiError ? Object.fromEntries(cause.issues.map((issue) => [issue.path, issue.message])) : {});
          setError(cause instanceof Error ? cause.message : "Não foi possível guardar o perfil.");
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome do perfil" placeholder="Governo — supervisão" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} error={errors.name} />
        <Input
          label="Descrição (opcional)"
          value={values.description ?? ""}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
          error={errors.description}
        />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">Permissões</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {permissions.map((permission) => (
            <label key={permission.key} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
              <input type="checkbox" className="mt-0.5" checked={values.permissions.includes(permission.key)} onChange={() => toggle(permission.key)} />
              <span>{permission.label}</span>
            </label>
          ))}
        </div>
        {errors.permissions ? <p className="mt-1 text-sm text-rose-700">{errors.permissions}</p> : null}
        <p className="mt-2 text-xs text-slate-500">
          Nas operações (encomendas, contentores, Alfândega, levantamentos) o administrador só consulta. Administradores, perfis e bloqueios são só do super admin.
        </p>
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          Guardar perfil
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export default function AdminProfilesPage() {
  const user = useAuthStore((state) => state.user);
  const [profiles, setProfiles] = useState<AdminProfile[] | null>(null);
  const [permissions, setPermissions] = useState<Array<{ key: AdminPermission; label: string }>>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let isCurrent = true;
    Promise.all([listAdminProfiles(), listAdminPermissions()])
      .then(([list, available]) => {
        if (!isCurrent) return;
        setProfiles(list);
        setPermissions(available);
      })
      .catch((cause: unknown) => {
        if (isCurrent) setError(cause instanceof Error ? cause.message : "Não foi possível carregar os perfis.");
      });
    return () => {
      isCurrent = false;
    };
  }, [user, refresh]);

  const saved = () => {
    setEditing(null);
    setRefresh((value) => value + 1);
  };

  return (
    <AppShell>
      <PageHeader
        title="Perfis de administração"
        description="Decida que áreas da administração cada administrador da plataforma pode usar. A conta recebe o perfil em Utilizadores."
        actions={
          editing === null ? (
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" aria-hidden /> Novo perfil
            </Button>
          ) : null
        }
      />

      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {editing === "new" ? (
        <Card title="Novo perfil" className="mb-6">
          <ProfileForm initial={emptyProfile} permissions={permissions} onSaved={saved} onCancel={() => setEditing(null)} save={createAdminProfile} />
        </Card>
      ) : null}

      {profiles === null ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">Ainda não há perfis.</div>
      ) : (
        <div className="space-y-4" data-cy="admin-profiles">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              {editing === profile.id ? (
                <ProfileForm
                  initial={{ name: profile.name, description: profile.description ?? "", permissions: profile.permissions }}
                  permissions={permissions}
                  onSaved={saved}
                  onCancel={() => setEditing(null)}
                  save={(input) => updateAdminProfile(profile.id, input)}
                />
              ) : (
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-900">{profile.name}</p>
                    {profile.description ? <p className="text-sm text-slate-500">{profile.description}</p> : null}
                    <div className="flex flex-wrap gap-1.5">
                      {profile.permissions.map((permission) => (
                        <Badge key={permission} tone="info">
                          {adminPermissionLabels[permission]}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      {profile.users.length === 0
                        ? "Nenhuma conta com este perfil."
                        : profile.users.map((account, index) => (
                            <span key={account.id}>
                              {index > 0 ? ", " : ""}
                              <Link href={`/admin/users/${account.id}`} className="text-brand-700 hover:text-brand-800">
                                {account.name}
                              </Link>
                            </span>
                          ))}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(profile.id)} aria-label={`Editar ${profile.name}`}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Apagar ${profile.name}`}
                      onClick={async () => {
                        if (!window.confirm(`Apagar o perfil "${profile.name}"?`)) return;
                        setError("");
                        try {
                          await deleteAdminProfile(profile.id);
                          saved();
                        } catch (cause) {
                          setError(cause instanceof Error ? cause.message : "Não foi possível apagar o perfil.");
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
