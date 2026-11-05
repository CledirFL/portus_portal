"use client";

import { AlertTriangle, Check, Copy, Ship } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  type ShipmentTracking,
  type TrackingStage,
  trackingStageDescriptions,
  trackingStageLabels,
} from "@/domain/shipment-request";

const stageTones: Record<TrackingStage, "neutral" | "success" | "warning" | "danger" | "info"> = {
  received: "info",
  labelled: "info",
  consolidated: "info",
  in_transit: "info",
  arrived: "info",
  cleared: "success",
  delivered: "success",
  held: "danger",
  abandoned: "danger",
  cancelled: "neutral",
};

const formatDate = (iso: string, withTime = true) =>
  new Date(iso).toLocaleString("pt-PT", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "full" });
const formatCve = (value: number) => `${value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CVE`;

export function TrackingStageBadge({ stage }: { stage: TrackingStage }) {
  return <Badge tone={stageTones[stage]}>{trackingStageLabels[stage]}</Badge>;
}

/** Marcos da encomenda, do balcão da agência à entrega em Cabo Verde. */
export function ShipmentTimeline({ tracking }: { tracking: ShipmentTracking }) {
  const lastDone = tracking.steps.findLastIndex((step) => step.done);

  return (
    <ol data-cy="shipment-timeline">
      {tracking.steps.map((step, index) => {
        const isCurrent = index === lastDone;
        const isProblem = isCurrent && (tracking.stage === "held" || tracking.stage === "abandoned" || tracking.stage === "cancelled");
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {index < tracking.steps.length - 1 ? (
              <span className={`absolute left-[11px] top-6 h-full w-px ${step.done ? "bg-brand-300" : "bg-slate-200"}`} aria-hidden />
            ) : null}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                isProblem ? "bg-rose-100 text-rose-600" : step.done ? "bg-brand-700 text-white" : "border-2 border-slate-200 bg-white"
              }`}
            >
              {isProblem ? <AlertTriangle className="h-3.5 w-3.5" /> : step.done ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
            <div className="-mt-0.5">
              <p className={`text-sm font-medium ${step.done ? "text-slate-900" : "text-slate-400"}`}>{step.label}</p>
              {isCurrent ? <p className="text-xs text-slate-500">{trackingStageDescriptions[tracking.stage]}</p> : null}
              {step.at ? <p className="text-xs text-slate-400">{formatDate(step.at)}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Navio e chegada prevista; quando pronta, o que o destinatário precisa para levantar. */
export function ShipmentTrackingDetails({ tracking }: { tracking: ShipmentTracking }) {
  const [copied, setCopied] = useState(false);
  const { voyage, pickup } = tracking;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700">
        Encomenda <span className="font-mono font-semibold tracking-wider text-slate-900">{tracking.shipmentCode}</span> ·{" "}
        {tracking.volumes} {tracking.volumes === 1 ? "volume" : "volumes"}
      </p>

      {pickup ? (
        <div data-cy="pickup-info" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-semibold">Pronta para levantar em {pickup.port}</p>
          <div className="mt-2 flex items-center justify-between rounded-md bg-white px-3 py-2">
            <span>
              Código de levantamento <span className="font-mono text-base font-semibold tracking-widest">{pickup.code}</span>
            </span>
            <button
              type="button"
              className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-100"
              aria-label="Copiar código de levantamento"
              onClick={() => {
                void navigator.clipboard?.writeText(pickup.code);
                setCopied(true);
              }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2">Taxas a pagar hoje: <strong>{formatCve(pickup.balanceCve)}</strong> (a armazenagem aumenta com os dias).</p>
          <p className="mt-1">
            O destinatário leva o documento de identificação (ou o NIF) e este código. Passe-lhe o código. Se for outra pessoa a
            levantar, tem de ser autorizada na portaria.
          </p>
        </div>
      ) : null}

      {voyage && !pickup && tracking.stage !== "delivered" ? (
        <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
          <p className="flex items-center gap-1.5 font-medium">
            <Ship className="h-4 w-4" aria-hidden /> {voyage.vesselName} → {voyage.arrivalPort}
          </p>
          <p className="mt-0.5">
            {voyage.arrivedAt ? `Chegou em ${formatDate(voyage.arrivedAt, false)}.` : `Chegada prevista: ${formatDate(voyage.eta, false)}.`}
          </p>
        </div>
      ) : null}
    </div>
  );
}
