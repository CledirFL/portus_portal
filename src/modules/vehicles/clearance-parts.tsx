"use client";

import { Check, FileText } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCve } from "@/domain/clearance";
import { estimateDisclaimer, TaxLines } from "@/modules/shipments/components/vehicle-estimate";
import {
  openVehicleDocument,
  type VehicleClearance,
  type VehicleClearanceStatus,
  vehicleClearanceStatusLabels,
  type VehicleDocumentStatus,
  vehicleDocumentStatusLabels,
} from "@/services/api/vehicle-clearance";

const formatDateTime = (iso: string) => new Date(iso).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
const formatMoney = (money: { amount: number; currency: string }) =>
  `${money.amount.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${money.currency === "CVE" ? "ECV" : money.currency}`;

const statusTones: Record<VehicleClearanceStatus, "neutral" | "info" | "warning" | "success"> = {
  draft: "neutral",
  submitted: "info",
  changes_requested: "warning",
  assessed: "info",
  inspected: "info",
  paid: "info",
  registered: "success",
};
const documentTones: Record<VehicleDocumentStatus | "missing", "neutral" | "info" | "danger" | "success"> = {
  missing: "neutral",
  pending: "info",
  accepted: "success",
  rejected: "danger",
};

export function ClearanceStatusBadge({ status }: { status: VehicleClearanceStatus | null }) {
  return status ? <Badge tone={statusTones[status]}>{vehicleClearanceStatusLabels[status]}</Badge> : <Badge tone="neutral">Por abrir</Badge>;
}

export function DocumentStatusBadge({ status }: { status: VehicleDocumentStatus | "missing" }) {
  return <Badge tone={documentTones[status]}>{vehicleDocumentStatusLabels[status]}</Badge>;
}

/** Os passos do desalfandegamento, do dono à matrícula. */
const steps: Array<{ label: string; reachedAt: VehicleClearanceStatus[] }> = [
  { label: "Declaração e documentos", reachedAt: ["submitted", "assessed", "inspected", "paid", "registered"] },
  { label: "Alfândega: documentos aceites e direitos liquidados", reachedAt: ["assessed", "inspected", "paid", "registered"] },
  { label: "Inspeção técnica (DGTR)", reachedAt: ["inspected", "paid", "registered"] },
  { label: "Direitos pagos", reachedAt: ["paid", "registered"] },
  { label: "Matrícula emitida (DGTR)", reachedAt: ["registered"] },
];

export function ClearanceSteps({ clearance }: { clearance: VehicleClearance }) {
  return (
    <ol className="space-y-2" data-cy="clearance-steps">
      {steps.map((step, index) => {
        const done = step.reachedAt.includes(clearance.status);
        const current = !done && (index === 0 || steps[index - 1]!.reachedAt.includes(clearance.status));
        return (
          <li key={step.label} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                done ? "bg-brand-700 text-white" : current ? "border-2 border-brand-700 text-brand-700" : "border-2 border-slate-200 text-slate-400"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
            </span>
            <span className={done ? "text-slate-900" : current ? "font-medium text-brand-800" : "text-slate-400"}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Dados da viatura, valores declarados e porto. */
export function VehicleSummary({ clearance }: { clearance: VehicleClearance }) {
  const { details } = clearance;
  const rows: Array<[string, string]> = [
    ["Viatura", clearance.vehicle],
    ["VIN", clearance.vin ?? "—"],
    ["Estado", details.condition ?? "—"],
    ["Cilindrada", details.engineCc ? `${details.engineCc} cm³` : "—"],
    ["Combustível", details.fuel ?? "—"],
    ["Regime", clearance.regimeLabel],
    ["Valor de compra", formatMoney(clearance.value)],
    ["Transporte", formatMoney(clearance.transport)],
    ["Seguro", formatMoney(clearance.insurance)],
    ["País de onde envia", clearance.dispatchCountry],
    ["Porto de chegada", clearance.arrivalPort ?? "ainda em viagem"],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 border-b border-slate-100 py-1">
          <dt className="text-slate-500">{label}</dt>
          <dd className={`text-right font-medium text-slate-900 ${label === "VIN" ? "font-mono" : ""}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Documentos enviados, com o estado e, para a equipa, as ações de cada um. */
export function DocumentList({
  clearance,
  actions,
}: {
  clearance: VehicleClearance;
  actions?: (document: VehicleClearance["documents"][number]) => React.ReactNode;
}) {
  const [error, setError] = useState("");
  if (!clearance.documents.length) return <p className="text-sm text-slate-500">Ainda não há documentos.</p>;
  return (
    <>
      <ul className="divide-y divide-slate-100" data-cy="vehicle-documents">
        {clearance.documents.map((document) => (
          <li key={document.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{document.label}</p>
              <button
                type="button"
                className="inline-flex max-w-full items-center gap-1 truncate text-xs text-brand-700 hover:text-brand-800"
                onClick={() => void openVehicleDocument(clearance.id, document.id).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível abrir."))}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden /> {document.fileName} · {(document.size / 1024).toFixed(0)} KB
              </button>
              {document.rejectionReason ? <p className="text-xs text-rose-700">Motivo: {document.rejectionReason}</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DocumentStatusBadge status={document.status} />
              {actions?.(document)}
            </div>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </>
  );
}

/** Direitos: a estimativa com as regras atuais ou, depois de liquidados, o valor da Alfândega. */
export function DutiesCard({ clearance }: { clearance: VehicleClearance }) {
  const source = clearance.assessment ?? clearance.estimate;
  return (
    <Card
      title={clearance.assessedCve !== null ? "Direitos liquidados" : "Estimativa dos direitos"}
      subtitle={clearance.assessedCve !== null ? "Valor fixado pela Alfândega." : "Com os valores em vigor na plataforma; o valor final é o da Alfândega."}
    >
      {source ? (
        <div data-cy="vehicle-duties">
          <TaxLines estimate={source} totalLabel={clearance.assessedCve !== null ? "A pagar" : "Total estimado"} totalCve={clearance.assessedCve ?? source.totalCve} />
          {clearance.assessedCve === null ? <p className="mt-2 text-xs text-slate-500">{estimateDisclaimer}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Sem estimativa (regime desconhecido).</p>
      )}
      {clearance.assessment?.adjustedCve !== null && clearance.assessment?.adjustedCve !== undefined ? (
        <p className="mt-2 text-xs text-slate-500">A Alfândega ajustou o valor calculado ({formatCve(clearance.assessment.totalCve)}).</p>
      ) : null}
      {clearance.assessment?.note ? <p className="mt-1 text-sm text-slate-600">Nota da Alfândega: {clearance.assessment.note}</p> : null}
      {clearance.estimate?.issues.length && clearance.assessedCve === null ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{clearance.estimate.issues.join(" ")}</p>
      ) : null}
    </Card>
  );
}

/** Inspeção, pagamento, matrícula e código de levantamento, quando existem. */
export function OutcomeList({ clearance }: { clearance: VehicleClearance }) {
  const items: Array<[string, string]> = [];
  if (clearance.inspection) {
    items.push([
      "Inspeção técnica",
      `${clearance.inspection.result === "approved" ? "Aprovada" : "Reprovada"}${clearance.inspection.at ? ` em ${formatDateTime(clearance.inspection.at)}` : ""}${clearance.inspection.notes ? ` · ${clearance.inspection.notes}` : ""}`,
    ]);
  }
  if (clearance.payment) items.push(["Direitos pagos", `${formatDateTime(clearance.payment.at)}${clearance.payment.reference ? ` · recibo ${clearance.payment.reference}` : ""}`]);
  if (clearance.plateNumber) items.push(["Matrícula", clearance.plateNumber]);
  if (clearance.pickupCode) items.push(["Código de levantamento no porto", clearance.pickupCode]);
  if (!items.length) return null;
  return (
    <dl className="space-y-1 text-sm" data-cy="vehicle-outcome">
      {items.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 border-b border-slate-100 py-1">
          <dt className="text-slate-500">{label}</dt>
          <dd className={`text-right font-medium text-slate-900 ${label === "Matrícula" || label.startsWith("Código") ? "font-mono" : ""}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EventList({ clearance }: { clearance: VehicleClearance }) {
  return (
    <ol className="space-y-1 text-xs text-slate-500">
      {clearance.events.map((event, index) => (
        <li key={index}>
          {formatDateTime(event.at)} · {event.label}
          {event.note ? ` — ${event.note}` : ""}
        </li>
      ))}
    </ol>
  );
}

/** Botão que corre uma ação e mostra o erro (usado nas páginas da Alfândega e da DGTR). */
export function useAction(onDone: (clearance: VehicleClearance) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (action: () => Promise<VehicleClearance>) => {
    setBusy(true);
    setError("");
    try {
      onDone(await action());
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível guardar.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

