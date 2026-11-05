"use client";

import { use, useEffect, useState } from "react";
import { Ban, CheckCircle2, KeyRound, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TemporaryPassword } from "@/modules/admin/temporary-password";
import { fieldErrors, toStaffInput, UserFields, type UserFormValues } from "@/modules/admin/user-form";
import { roleLabel, userScopeLabel, userStatusTones } from "@/modules/admin/user-labels";
import { getUser, type ManagedUser, resetUserPassword, staffRoles, updateUser, type UserStatus, userStatusLabels } from "@/services/api/users";
import { useAuthStore } from "@/store/auth-store";

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" }) : "Nunca");

function toValues(user: ManagedUser): UserFormValues {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    agencyId: user.agency?.id ?? "",
    portId: user.port?.id ?? "",
  };
}

export default function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = use(params);
  const currentUser = useAuthStore((state) => state.user);
  const [user, setUser] = useState<ManagedUser | null>(null);
  const [values, setValues] = useState<UserFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    getUser(id)
      .then((found) => {
        setUser(found);
        setValues(toValues(found));
      })
      .catch((cause: unknown) => setMessage({ tone: "error", text: cause instanceof Error ? cause.message : "Não foi possível carregar o utilizador." }));
  }, [currentUser, id]);

  /** Guarda o formulário e, se indicado, muda o estado (aprovar, bloquear, desbloquear). */
  async function save(status?: UserStatus, done = "Alterações guardadas.") {
    if (!values) return;
    setBusy(true);
    setErrors({});
    setMessage(null);
    try {
      const { name, phone, role, agencyId, portId } = toStaffInput(values);
      const updated = await updateUser(id, { name, phone, role, agencyId, portId, ...(status ? { status } : {}) });
      setUser(updated);
      setValues(toValues(updated));
      setMessage({ tone: "ok", text: done });
    } catch (cause) {
      setErrors(fieldErrors(cause));
      setMessage({ tone: "error", text: cause instanceof Error ? cause.message : "Não foi possível guardar." });
    } finally {
      setBusy(false);
    }
  }

  const isSelf = currentUser?.id === id;

  return (
    <AppShell>
      <PageHeader backHref="/admin/users" title={user?.name ?? "Utilizador"} description={user ? `${roleLabel(user.role)} · ${userScopeLabel(user)}` : undefined} />

      {message ? (
        <div
          role={message.tone === "error" ? "alert" : "status"}
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            message.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {!user || !values ? (
        message ? null : <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card title="Dados da conta">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <UserFields
                values={values}
                onChange={setValues}
                errors={errors}
                emailLocked
                roles={user.role === "cliente" ? ["cliente"] : staffRoles}
              />
              <Button type="submit" variant="outline" disabled={busy}>
                Guardar alterações
              </Button>
            </form>
          </Card>

          <div className="space-y-4">
            <Card title="Estado">
              <div className="space-y-3 text-sm">
                <Badge tone={userStatusTones[user.status]}>{userStatusLabels[user.status]}</Badge>
                <p className="text-slate-500">
                  Conta criada em {formatDate(user.createdAt)} · último acesso: {formatDate(user.lastLoginAt)}
                </p>

                {user.status === "review" ? (
                  <div className="rounded-lg bg-amber-50 p-3 text-amber-900">
                    <p className="font-medium">Pedido de acesso</p>
                    {user.organization ? <p>Empresa ou entidade: {user.organization}</p> : null}
                    {user.accessNote ? <p>Onde trabalha: {user.accessNote}</p> : null}
                    <p className="mt-1 text-xs">Confirme a pessoa, escolha a agência ou o porto e aprove. Recebe um email a avisar.</p>
                  </div>
                ) : null}

                {isSelf ? (
                  <p className="text-slate-500">Não pode bloquear a sua própria conta.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.status === "review" ? (
                      <Button disabled={busy} onClick={() => void save("active", "Conta aprovada. A pessoa recebeu um email.")}>
                        <CheckCircle2 className="h-4 w-4" aria-hidden /> Aprovar
                      </Button>
                    ) : null}
                    {user.status === "blocked" ? (
                      <Button variant="outline" disabled={busy} onClick={() => void save("active", "Conta desbloqueada.")}>
                        <RotateCcw className="h-4 w-4" aria-hidden /> Desbloquear
                      </Button>
                    ) : (
                      <Button variant="danger" disabled={busy} onClick={() => void save("blocked", "Conta bloqueada. As sessões abertas terminaram.")}>
                        <Ban className="h-4 w-4" aria-hidden /> {user.status === "review" ? "Recusar e bloquear" : "Bloquear"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Card title="Palavra-passe">
              <div className="space-y-3 text-sm">
                <p className="text-slate-500">Gera uma palavra-passe temporária e termina as sessões abertas desta conta.</p>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setMessage(null);
                    try {
                      setPassword((await resetUserPassword(id)).temporaryPassword);
                    } catch (cause) {
                      setMessage({ tone: "error", text: cause instanceof Error ? cause.message : "Não foi possível repor a palavra-passe." });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <KeyRound className="h-4 w-4" aria-hidden /> Repor palavra-passe
                </Button>
                {password ? <TemporaryPassword email={user.email} password={password} /> : null}
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
