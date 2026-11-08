"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { OperateOnly } from "@/components/layout/read-only";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { paymentMethodLabels, type PaymentMethod } from "@/domain/status-labels";
import { ClearanceStatusBadge, ClearanceSteps, DocumentList, DutiesCard, EventList, OutcomeList, useAction, VehicleSummary } from "@/modules/vehicles/clearance-parts";
import {
  assessVehicle,
  getVehicleClearance,
  registerVehiclePayment,
  requestVehicleChanges,
  reviewVehicleDocument,
  type VehicleClearance,
} from "@/services/api/vehicle-clearance";
import { useAuthStore } from "@/store/auth-store";

function RejectDocument({ onReject }: { onReject: (reason: string) => void }) {
  const [reason, setReason] = useState<string | null>(null);
  if (reason === null) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setReason("")} aria-label="Recusar">
        <X className="h-3.5 w-3.5" aria-hidden /> Recusar
      </Button>
    );
  }
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        onReject(reason);
      }}
    >
      <input
        aria-label="Motivo da recusa"
        placeholder="Motivo"
        className="w-40 rounded-md border border-slate-300 px-2 py-1 text-xs"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        autoFocus
      />
      <Button size="sm" variant="danger" type="submit" disabled={reason.trim().length < 3}>
        Recusar
      </Button>
    </form>
  );
}

function CustomsActions({ clearance, onChange }: { clearance: VehicleClearance; onChange: (clearance: VehicleClearance) => void }) {
  const { busy, error, run } = useAction(onChange);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [assessNote, setAssessNote] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [reference, setReference] = useState("");
  const allAccepted = clearance.documents.length > 0 && clearance.documents.every((document) => document.status === "accepted");

  return (
    <OperateOnly>
      {clearance.status === "submitted" ? (
        <Card title="Decisão" subtitle="Aceite ou recuse cada documento. Peça correções ao dono, ou liquide os direitos quando estiver tudo certo.">
          <form
            className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end"
            data-cy="request-changes"
            onSubmit={(event) => {
              event.preventDefault();
              void run(() => requestVehicleChanges(clearance.id, note));
            }}
          >
            <div className="flex-1">
              <Input label="O que o dono tem de corrigir" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            <Button type="submit" variant="outline" disabled={busy || note.trim().length < 5}>
              Pedir correções
            </Button>
          </form>
          <form
            className="grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2"
            data-cy="assess-form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(() => assessVehicle(clearance.id, { amountCve: amount.trim() ? Number(amount.replace(",", ".")) : null, note: assessNote.trim() || null }));
            }}
          >
            <Input
              label="Direitos a pagar (CVE)"
              inputMode="decimal"
              placeholder={clearance.estimate ? String(clearance.estimate.totalCve) : ""}
              hint="Vazio: o valor calculado pelas regras."
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <Input label="Nota (opcional)" value={assessNote} onChange={(event) => setAssessNote(event.target.value)} />
            {!clearance.arrived ? (
              <p className="flex gap-2 text-sm text-amber-800 sm:col-span-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> A viatura ainda não foi conferida no terminal.
              </p>
            ) : null}
            <Button type="submit" disabled={busy || !allAccepted} className="sm:col-span-2">
              Liquidar os direitos
            </Button>
          </form>
        </Card>
      ) : null}
      {clearance.status === "inspected" ? (
        <Card title="Pagamento dos direitos" subtitle="A inspeção foi aprovada. Registe o pagamento com o nº do recibo (DUC).">
          <form
            className="grid gap-2 sm:grid-cols-2"
            data-cy="vehicle-payment"
            onSubmit={(event) => {
              event.preventDefault();
              void run(() => registerVehiclePayment(clearance.id, { method, reference }));
            }}
          >
            <Select
              label="Meio"
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              options={(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((key) => ({ value: key, label: paymentMethodLabels[key] }))}
            />
            <Input label="Nº do recibo (DUC)" value={reference} onChange={(event) => setReference(event.target.value)} />
            <Button type="submit" disabled={busy || reference.trim().length < 3} className="sm:col-span-2">
              Registar pagamento
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

export default function CustomsVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [clearance, setClearance] = useState<VehicleClearance | null>(null);
  const [error, setError] = useState("");
  const review = useAction(setClearance);

  useEffect(() => {
    if (!user) return;
    getVehicleClearance(id)
      .then(setClearance)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar."));
  }, [user, id]);

  return (
    <AppShell>
      <PageHeader
        backHref="/alfandega/viaturas"
        title={clearance ? clearance.vehicle : "Viatura"}
        description={clearance ? `${clearance.shipmentCode} · dono ${clearance.owner.name} (${clearance.owner.email})` : undefined}
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
            <Card title="Viatura e declaração">
              <VehicleSummary clearance={clearance} />
            </Card>
            <Card title="Documentos">
              <DocumentList
                clearance={clearance}
                actions={(document) =>
                  clearance.status === "submitted" && document.status === "pending" ? (
                    <OperateOnly>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={review.busy}
                        onClick={() => void review.run(() => reviewVehicleDocument(clearance.id, document.id, { status: "accepted" }))}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden /> Aceitar
                      </Button>
                      <RejectDocument onReject={(reason) => void review.run(() => reviewVehicleDocument(clearance.id, document.id, { status: "rejected", reason }))} />
                    </OperateOnly>
                  ) : null
                }
              />
              {review.error ? <p className="mt-2 text-sm text-rose-700">{review.error}</p> : null}
            </Card>
            <CustomsActions clearance={clearance} onChange={setClearance} />
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
