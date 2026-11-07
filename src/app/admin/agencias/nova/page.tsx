"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AgencyFields, emptyAgency } from "@/modules/admin/agency-form";
import { fieldErrors } from "@/modules/admin/user-form";
import { agencyKindLabels, createAgency } from "@/services/api/admin-agencies";

function NewAgency() {
  const router = useRouter();
  const kind = useSearchParams().get("tipo") === "origin" ? "origin" : "destination";
  const [values, setValues] = useState(() => emptyAgency(kind));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AppShell>
      <PageHeader backHref="/admin/agencias" title={`Nova ${agencyKindLabels[kind].toLowerCase()}`} />
      <Card className="max-w-3xl">
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setErrors({});
            setError("");
            try {
              const created = await createAgency(values);
              router.push(`/admin/agencias/${created.id}`);
            } catch (cause) {
              setErrors(fieldErrors(cause));
              setError(cause instanceof Error ? cause.message : "Não foi possível criar a agência.");
              setBusy(false);
            }
          }}
        >
          <AgencyFields values={values} onChange={setValues} errors={errors} />
          {error ? (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy}>
            Criar agência
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}

export default function NewAgencyPage() {
  return (
    <Suspense>
      <NewAgency />
    </Suspense>
  );
}
