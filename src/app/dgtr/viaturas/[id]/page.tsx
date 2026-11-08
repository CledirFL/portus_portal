"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { OperateOnly } from "@/components/layout/read-only";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ClearanceStatusBadge, ClearanceSteps, DocumentList, DutiesCard, EventList, OutcomeList, useAction, VehicleSummary } from "@/modules/vehicles/clearance-parts";
import { getVehicleClearance, inspectVehicle, registerVehiclePlate, type VehicleClearance } from "@/services/api/vehicle-clearance";
import { useAuthStore } from "@/store/auth-store";

function DgtrActions({ clearance, onChange }: { clearance: VehicleClearance; onChange: (clearance: VehicleClearance) => void }) {
  const { busy, error, run } = useAction(onChange);
  const [result, setResult] = useState<"approved" | "rejected">("approved");
  const [notes, setNotes] = useState("");
  const [plate, setPlate] = useState("");

  return (
    <OperateOnly>
      {clearance.status === "assessed" ? (
        <Card title="Inspeção técnica" subtitle="Verifique a viatura no porto (VIN, estado, segurança). Reprovada, o dono corrige e pede nova inspeção.">
          <form
            className="space-y-3"
            data-cy="inspection-form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(() => inspectVehicle(clearance.id, { result, notes: notes.trim() || null }));
            }}
          >
            <div className="flex gap-4 text-sm">
              {(["approved", "rejected"] as const).map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input type="radio" name="result" checked={result === option} onChange={() => setResult(option)} />
                  {option === "approved" ? "Aprovada" : "Reprovada"}
                </label>
              ))}
            </div>
            <Input label={result === "rejected" ? "Porque foi reprovada" : "Observações (opcional)"} value={notes} onChange={(event) => setNotes(event.target.value)} />
            <Button type="submit" disabled={busy || (result === "rejected" && notes.trim().length < 3)}>
              Registar inspeção
            </Button>
          </form>
        </Card>
      ) : null}
      {clearance.status === "inspected" ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Inspeção aprovada. A matrícula emite-se depois de a Alfândega registar o pagamento dos direitos.
        </p>
      ) : null}
      {clearance.status === "paid" ? (
        <Card title="Matrícula" subtitle="Os direitos estão pagos. Ao emitir a matrícula, a viatura fica libertada para a portaria.">
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            data-cy="registration-form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(() => registerVehiclePlate(clearance.id, plate));
            }}
          >
            <div className="flex-1">
              <Input label="Matrícula" placeholder="ST-12-AB" value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase())} className="font-mono" />
            </div>
            <Button type="submit" disabled={busy || plate.trim().length < 4}>
              Emitir matrícula
            </Button>
          </form>
        </Card>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </OperateOnly>
  );
}

export default function DgtrVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [clearance, setClearance] = useState<VehicleClearance | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getVehicleClearance(id)
      .then(setClearance)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar."));
  }, [user, id]);

  return (
    <AppShell>
      <PageHeader
        backHref="/dgtr"
        title={clearance ? clearance.vehicle : "Viatura"}
        description={clearance ? `${clearance.shipmentCode} · dono ${clearance.owner.name}` : undefined}
        actions={clearance ? <ClearanceStatusBadge status={clearance.status} /> : undefined}
      />
      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {clearance ? (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <Card title="Viatura">
              <VehicleSummary clearance={clearance} />
            </Card>
            <DgtrActions clearance={clearance} onChange={setClearance} />
            <Card title="Documentos (aceites pela Alfândega)">
              <DocumentList clearance={clearance} />
            </Card>
          </div>
          <div className="space-y-6">
            <Card title="Passos">
              <ClearanceSteps clearance={clearance} />
              <div className="mt-4">
                <OutcomeList clearance={clearance} />
              </div>
            </Card>
            <DutiesCard clearance={clearance} />
            <Card title="Histórico">
              <EventList clearance={clearance} />
            </Card>
          </div>
        </div>
      ) : !error ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : null}
    </AppShell>
  );
}
