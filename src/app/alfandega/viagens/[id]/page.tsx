"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { channelLabels } from "@/domain/status-labels";
import type { CustomsChannel } from "@/domain/clearance";
import { ChannelBadge, ClearanceStatusBadge, OccurrenceBadge } from "@/modules/arrivals/components/arrivals-ui";
import { ErrorBanner, formatDateTime, formatKg } from "@/modules/consolidation/components/consolidation-ui";
import { VolumeStatusBadge } from "@/modules/shipments/components/shipment-status";
import { holdClearance, listClearances, releaseClearance, setChannel, type Clearance } from "@/services/api/arrivals";
import { useAuthStore } from "@/store/auth-store";

const actionLabels: Record<string, string> = {
  channel_green: "Canal verde",
  channel_red: "Canal vermelho",
  hold: "Retida",
  release: "Liberada",
};

type Action = { kind: "channel"; channel: CustomsChannel; reason: string } | { kind: "hold"; reason: string } | { kind: "release"; duties: string; reason: string };

function ClearanceCard({ clearance, onChange }: { clearance: Clearance; onChange: (updated: Clearance) => void }) {
  const [action, setAction] = useState<Action | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { shipment } = clearance;
  const done = clearance.status === "released";

  const submit = async () => {
    if (!action) return;
    setBusy(true);
    setError("");
    try {
      const updated =
        action.kind === "channel"
          ? await setChannel(clearance.id, action.channel, action.reason || null)
          : action.kind === "hold"
            ? await holdClearance(clearance.id, action.reason)
            : await releaseClearance(clearance.id, Number(action.duties.replace(",", ".")) || 0, action.reason || null);
      onChange(updated);
      setAction(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registar a decisão.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]" data-cy="clearance">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{shipment.recipient.name}</p>
          <p className="text-sm text-slate-500">
            {shipment.code} · {shipment.description} · {shipment.recipient.island}
          </p>
          <p className="text-xs text-slate-500">
            NIF {shipment.recipient.nif ?? "—"} · {shipment.recipient.documentType ?? "Documento"} {shipment.recipient.documentNumber ?? "—"} · remetente {shipment.sender.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ChannelBadge channel={clearance.channel} />
          <ClearanceStatusBadge status={clearance.status} />
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2 text-xs">
        {clearance.volumes.map((volume) => (
          <li key={volume.id} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
            <span className="font-mono">{volume.code}</span>
            <span className="text-slate-500">{formatKg(volume.weightKg)}</span>
            {volume.warehouseLocation ? <span className="text-slate-500">· {volume.warehouseLocation}</span> : null}
            <VolumeStatusBadge status={volume.status} />
          </li>
        ))}
      </ul>

      {clearance.occurrences.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {clearance.occurrences.map((occurrence, index) => (
            <li key={index} className="flex flex-wrap items-center gap-2">
              <OccurrenceBadge type={occurrence.type} />
              <span className="font-mono text-xs">{occurrence.volumeCode}</span>
              <span className="text-slate-600">{occurrence.description}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!done ? (
        <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${clearance.suggestion.channel === "green" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            Sugestão (BR 15): <strong>{channelLabels[clearance.suggestion.channel]}</strong>
            {clearance.suggestion.reasons.length ? ` — ${clearance.suggestion.reasons.join(" ")}` : " — destinatário identificado, sem divergências."}
          </span>
        </div>
      ) : null}

      {clearance.uncheckedVolumes > 0 && !done ? (
        <p className="mt-2 text-sm text-amber-700">{clearance.uncheckedVolumes} volume(s) ainda por conferir no terminal.</p>
      ) : null}

      {clearance.pickupCode ? (
        <p className="mt-3 text-sm text-slate-700">
          Código de levantamento <strong className="font-mono tracking-wider" data-cy="pickup-code">{clearance.pickupCode}</strong>
          {clearance.dutiesCve ? ` · direitos ${clearance.dutiesCve.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} CVE` : ""} — comunique-o ao destinatário com o local
          no armazém.
        </p>
      ) : null}

      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}

      {!done ? (
        action ? (
          <form
            className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            {action.kind === "release" ? (
              <div className="sm:w-40">
                <Input label="Direitos (CVE)" inputMode="decimal" value={action.duties} onChange={(event) => setAction({ ...action, duties: event.target.value })} />
              </div>
            ) : null}
            <div className="flex-1">
              <Input
                label={
                  action.kind === "hold"
                    ? "Motivo da retenção"
                    : action.kind === "release"
                      ? clearance.channel === "red"
                        ? "Resultado da inspeção física"
                        : "Observação (opcional)"
                      : "Motivo (opcional)"
                }
                value={action.reason}
                onChange={(event) => setAction({ ...action, reason: event.target.value })}
                autoFocus
              />
            </div>
            <Button type="submit" variant={action.kind === "hold" ? "danger" : "primary"} disabled={busy || (action.kind === "hold" && action.reason.trim().length < 3)}>
              {action.kind === "channel" ? channelLabels[action.channel] : action.kind === "hold" ? "Reter" : "Libertar"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAction(null)}>
              Cancelar
            </Button>
          </form>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <Button size="sm" variant="outline" onClick={() => setAction({ kind: "channel", channel: "green", reason: "" })}>
              Canal verde
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAction({ kind: "channel", channel: "red", reason: "" })}>
              Canal vermelho
            </Button>
            {clearance.status === "pending" ? (
              <Button size="sm" variant="outline" onClick={() => setAction({ kind: "hold", reason: "" })}>
                Reter
              </Button>
            ) : null}
            <Button
              size="sm"
              disabled={!clearance.channel || !clearance.manifestValidated}
              title={!clearance.manifestValidated ? "O manifesto ainda não foi validado (BR 14)." : !clearance.channel ? "Atribua primeiro o canal." : undefined}
              onClick={() => setAction({ kind: "release", duties: "0", reason: "" })}
              data-cy="release"
            >
              Libertar
            </Button>
          </div>
        )
      ) : null}

      {clearance.history.length ? (
        <ol className="mt-3 space-y-0.5 text-xs text-slate-500">
          {clearance.history.map((event, index) => (
            <li key={index}>
              {formatDateTime(event.at)} · {actionLabels[event.action] ?? event.action}
              {event.reason ? ` — ${event.reason}` : ""}
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  );
}

export default function CustomsVoyagePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [clearances, setClearances] = useState<Clearance[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    listClearances(id)
      .then(setClearances)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar o despacho."));
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const voyage = clearances?.[0]?.voyage;
  const manifestValidated = clearances?.[0]?.manifestValidated ?? false;

  return (
    <AppShell>
      <PageHeader title={voyage ? `Despacho · ${voyage.vesselName}` : "Despacho"} description={voyage ? voyage.code : undefined} />
      <div className="mb-4 text-sm">
        <Link href="/alfandega" className="text-slate-500 hover:text-slate-700">
          ← Viagens
        </Link>
      </div>
      <ErrorBanner message={error} />
      {clearances && clearances.length && !manifestValidated ? (
        <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          O manifesto desta viagem ainda não foi validado: pode atribuir canais e reter, mas não libertar (BR 14).
        </div>
      ) : null}
      {clearances === null ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : clearances.length ? (
        <div className="space-y-4">
          {clearances.map((clearance) => (
            <ClearanceCard
              key={clearance.id}
              clearance={clearance}
              onChange={(updated) => setClearances((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Ainda não há encomendas desta viagem para despachar (o navio já chegou?).
        </div>
      )}
    </AppShell>
  );
}
