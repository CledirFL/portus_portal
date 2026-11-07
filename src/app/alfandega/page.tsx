"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useReadOnly } from "@/components/layout/read-only";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ManifestCustomsBadge } from "@/modules/arrivals/components/arrivals-ui";
import { ErrorBanner, formatDateTime, formatKg, VoyageStatusBadge } from "@/modules/consolidation/components/consolidation-ui";
import { listCustomsVoyages, rejectManifest, validateManifest, type CustomsVoyage } from "@/services/api/arrivals";
import { useAuthStore } from "@/store/auth-store";

type Decision = { voyageId: string; kind: "validate" | "reject"; text: string };

export default function CustomsPage() {
  const user = useAuthStore((state) => state.user);
  const readOnly = useReadOnly();
  const [voyages, setVoyages] = useState<CustomsVoyage[] | null>(null);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    listCustomsVoyages()
      .then(setVoyages)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar as viagens."));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const decide = async () => {
    if (!decision || !voyages) return;
    const manifest = voyages.find((voyage) => voyage.id === decision.voyageId)?.manifest;
    if (!manifest) return;
    setBusy(true);
    setError("");
    try {
      if (decision.kind === "validate") await validateManifest(manifest.id, decision.text);
      else await rejectManifest(manifest.id, decision.text);
      setDecision(null);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registar a decisão.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Despacho aduaneiro"
        description="Valide os manifestos recebidos e decida o canal, a retenção ou a libertação de cada encomenda."
      />
      <ErrorBanner message={error} />

      {voyages === null ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : voyages.length ? (
        <div className="space-y-4" data-cy="customs-voyages">
          {voyages.map((voyage) => (
            <div key={voyage.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {voyage.vesselName}
                    {voyage.voyageNumber ? ` · ${voyage.voyageNumber}` : ""}
                  </p>
                  <p className="text-sm text-slate-500">
                    {voyage.code} · {voyage.agency.name} · {voyage.arrivedAt ? `chegou ${formatDateTime(voyage.arrivedAt)}` : `ETA ${formatDateTime(voyage.eta)}`}
                  </p>
                </div>
                <VoyageStatusBadge status={voyage.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <ManifestCustomsBadge manifest={voyage.manifest} />
                {voyage.manifest ? (
                  <span className="text-slate-500">
                    {voyage.manifest.totalVolumes} vol. · {formatKg(voyage.manifest.totalWeightKg)}
                    {voyage.manifest.sentAt ? ` · enviado ${formatDateTime(voyage.manifest.sentAt)}` : ""}
                    {voyage.manifest.customsReference ? ` · ref. ${voyage.manifest.customsReference}` : ""}
                  </span>
                ) : null}
                {voyage.manifest?.customsNote ? <span className="text-rose-700">Motivo: {voyage.manifest.customsNote}</span> : null}
              </div>

              {voyage.manifest && voyage.manifest.customsStatus !== "validated" && !readOnly ? (
                decision?.voyageId === voyage.id ? (
                  <form
                    className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void decide();
                    }}
                  >
                    <div className="flex-1">
                      <Input
                        label={decision.kind === "validate" ? "Referência da Alfândega" : "Motivo da rejeição"}
                        value={decision.text}
                        onChange={(event) => setDecision({ ...decision, text: event.target.value })}
                        autoFocus
                      />
                    </div>
                    <Button type="submit" variant={decision.kind === "validate" ? "primary" : "danger"} disabled={busy || decision.text.trim().length < 3}>
                      {decision.kind === "validate" ? "Validar" : "Rejeitar"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setDecision(null)}>
                      Cancelar
                    </Button>
                  </form>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setDecision({ voyageId: voyage.id, kind: "validate", text: "" })} data-cy="validate-manifest">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Validar manifesto
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDecision({ voyageId: voyage.id, kind: "reject", text: "" })}>
                      <XCircle className="h-3.5 w-3.5" aria-hidden /> Rejeitar
                    </Button>
                  </div>
                )
              ) : null}

              {voyage.status === "arrived" ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm">
                  <Badge tone="warning">{voyage.clearances.pending} por despachar</Badge>
                  <Badge tone="danger">{voyage.clearances.held} retidas</Badge>
                  <Badge tone="success">{voyage.clearances.released} liberadas</Badge>
                  <Link href={`/alfandega/viagens/${voyage.id}`} className="ml-auto font-medium text-brand-700 hover:text-brand-800">
                    Despachar encomendas →
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Não há navios a caminho nem chegados a este porto.
        </div>
      )}
    </AppShell>
  );
}
