"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ContainerStatus } from "@/domain/state-machine";
import {
  containerStatusLabels,
  manifestStatusLabels,
  voyageStatusLabels,
  type ManifestStatus,
  type VoyageStatus,
} from "@/domain/status-labels";
import { saveFile } from "@/lib/api-client";
import type { ExportFormat } from "@/services/api/containers";
import type { ManifestDeadline } from "@/services/api/voyages";

const containerTones: Record<ContainerStatus, "info" | "success" | "warning" | "neutral"> = {
  open: "warning",
  sealed: "success",
  shipped: "info",
  arrived: "info",
  deconsolidated: "neutral",
};

export function ContainerStatusBadge({ status }: { status: ContainerStatus }) {
  return <Badge tone={containerTones[status]}>{containerStatusLabels[status]}</Badge>;
}

export function VoyageStatusBadge({ status }: { status: VoyageStatus }) {
  return <Badge tone={status === "planned" ? "neutral" : "info"}>{voyageStatusLabels[status]}</Badge>;
}

export function ManifestStatusBadge({ status, outdated }: { status: ManifestStatus; outdated?: boolean }) {
  if (outdated) return <Badge tone="warning">Desatualizado</Badge>;
  return <Badge tone={status === "sent" ? "success" : "neutral"}>{manifestStatusLabels[status]}</Badge>;
}

export const formatKg = (value: number) => `${value.toLocaleString("pt-PT", { maximumFractionDigits: 2 })} kg`;
export const formatM3 = (value: number) => `${value.toLocaleString("pt-PT", { maximumFractionDigits: 3 })} m³`;
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Ocupação do contentor (BR 11): fica âmbar a partir de 90% e vermelha se chegar ao limite. */
export function CapacityBar({ label, used, limit, format }: { label: string; used: number; limit: number | null; format: (value: number) => string }) {
  if (limit === null) {
    return (
      <div className="text-sm">
        <div className="flex justify-between text-slate-600">
          <span>{label}</span>
          <span className="tabular-nums">{format(used)} · sem limite</span>
        </div>
      </div>
    );
  }
  const ratio = limit > 0 ? used / limit : 0;
  const percent = Math.min(100, Math.round(ratio * 100));
  const color = ratio >= 1 ? "bg-rose-500" : ratio >= 0.9 ? "bg-amber-500" : "bg-brand-600";
  return (
    <div className="text-sm">
      <div className="mb-1 flex justify-between text-slate-600">
        <span>{label}</span>
        <span className="tabular-nums">
          {format(used)} / {format(limit)} <span className="text-slate-400">({percent}%)</span>
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** Descarrega a exportação em .xlsx, .pdf ou .csv (BR 8). */
export function ExportButtons({ onExport, label = "Exportar" }: { onExport: (format: ExportFormat) => Promise<{ blob: Blob; fileName: string }>; label?: string }) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState("");
  const download = async (format: ExportFormat) => {
    setBusy(format);
    setError("");
    try {
      const file = await onExport(format);
      saveFile(file.blob, file.fileName);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível exportar.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {(["xlsx", "pdf", "csv"] as const).map((format) => (
        <Button key={format} size="sm" variant="outline" disabled={busy !== null} onClick={() => void download(format)} data-cy={`export-${format}`}>
          <Download className="h-3.5 w-3.5" aria-hidden />
          {busy === format ? "…" : `.${format}`}
        </Button>
      ))}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}

const hoursText = (hours: number) => {
  if (hours < 0) return `o ETA passou há ${Math.abs(hours)} h`;
  if (hours < 48) return `faltam ${hours} h para o ETA`;
  return `faltam ${Math.floor(hours / 24)} dias para o ETA`;
};

/** Prazo do manifesto (BR 13, RF-A14). */
export function DeadlineBadge({ deadline }: { deadline: ManifestDeadline }) {
  if (deadline.state === "sent") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Manifesto enviado
      </span>
    );
  }
  if (deadline.state === "alert") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700" data-cy="manifest-alert">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Manifesto por enviar · {hoursText(deadline.hoursToEta)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <Clock className="h-3.5 w-3.5" aria-hidden /> Enviar manifesto até 72 h antes do ETA · {hoursText(deadline.hoursToEta)}
    </span>
  );
}

export function ErrorBanner({ message, items = [] }: { message: string; items?: string[] }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <p className="font-medium">{message}</p>
      {items.length ? (
        <ul className="mt-1 list-disc pl-5">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
