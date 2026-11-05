"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TemporaryPassword } from "@/modules/admin/temporary-password";
import { fieldErrors, toStaffInput, UserFields, type UserFormValues } from "@/modules/admin/user-form";
import { createUser, type ManagedUser } from "@/services/api/users";

const empty: UserFormValues = { name: "", email: "", phone: "", role: "agente_recolha", agencyId: "", portId: "" };

export default function NewUserPage() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ user: ManagedUser; temporaryPassword: string } | null>(null);

  return (
    <AppShell>
      <PageHeader backHref="/admin/users" title="Nova conta" description="Conta da equipa, ativa logo, com uma palavra-passe temporária." />

      {created ? (
        <Card className="max-w-2xl space-y-4">
          <p className="text-sm text-slate-700">
            Conta criada para <strong>{created.user.name}</strong>.
          </p>
          <TemporaryPassword email={created.user.email} password={created.temporaryPassword} />
          <div className="flex gap-2">
            <Link href={`/admin/users/${created.user.id}`}>
              <Button variant="outline">Ver a conta</Button>
            </Link>
            <Button
              onClick={() => {
                setCreated(null);
                setValues(empty);
              }}
            >
              Criar outra
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setErrors({});
              setError("");
              try {
                setCreated(await createUser(toStaffInput(values)));
              } catch (cause) {
                setErrors(fieldErrors(cause));
                setError(cause instanceof Error ? cause.message : "Não foi possível criar a conta.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <UserFields values={values} onChange={setValues} errors={errors} />
            {error ? (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy}>
              Criar conta
            </Button>
          </form>
        </Card>
      )}
    </AppShell>
  );
}
