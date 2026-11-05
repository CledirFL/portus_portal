"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Anchor } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ManifestCustomsBadge } from "@/modules/arrivals/components/arrivals-ui";
import { CapacityBar, ContainerStatusBadge, ErrorBanner, formatDateTime, VoyageStatusBadge } from "@/modules/consolidation/components/consolidation-ui";
import { getTerminalVoyage, registerArrival, type TerminalVoyage } from "@/services/api/arrivals";
import { useAuthStore } from "@/store/auth-store";

const count = (value: number) => String(value);

export default function ArrivalVoyagePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [voyage, setVoyage] = useState<TerminalVoyage | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(() => {
    getTerminalVoyage(id)
      .then(setVoyage)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar a viagem."));
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!voyage) {
    return (
      <AppShell>
        {error ? <ErrorBanner message={error} /> : <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={`${voyage.vesselName}${voyage.voyageNumber ? ` · ${voyage.voyageNumber}` : ""}`}
        description={`${voyage.code} · ${voyage.departurePort} → ${voyage.arrivalPort.code} (${voyage.arrivalPort.name}) · ${voyage.agency.name}`}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <VoyageStatusBadge status={voyage.status} />
        <span>{voyage.arrivedAt ? `Chegou ${formatDateTime(voyage.arrivedAt)}` : `ETA ${formatDateTime(voyage.eta)}`}</span>
        <ManifestCustomsBadge manifest={voyage.manifest} />
        <Link href="/cv/chegadas" className="ml-auto text-slate-500 hover:text-slate-700">
          ← Chegadas
        </Link>
      </div>

      <ErrorBanner message={error} />

      {voyage.status === "departed" ? (
        <Card title="Chegada do navio" subtitle="Quando o navio atracar e os contentores forem descarregados." className="mb-6">
          {confirming ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-slate-700">Confirma a chegada? Os contentores e os volumes passam a Chegado.</p>
              <Button
                disabled={busy}
                data-cy="confirm-arrival"
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    setVoyage(await registerArrival(voyage.id));
                    setConfirming(false);
                  } catch (cause) {
                    setError(cause instanceof Error ? cause.message : "Não foi possível registar a chegada.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Confirmar chegada
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button onClick={() => setConfirming(true)} data-cy="register-arrival">
              <Anchor className="h-4 w-4" aria-hidden /> Registar chegada
            </Button>
          )}
        </Card>
      ) : null}

      <Card title={`Contentores (${voyage.containers.length})`} subtitle="Abra cada contentor para conferir os volumes por leitura do QR.">
        <ul className="divide-y divide-slate-100" data-cy="arrival-containers">
          {voyage.containers.map((container) => (
            <li key={container.id} className="grid gap-3 py-4 md:grid-cols-[1fr_16rem] md:items-center">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {voyage.status === "arrived" ? (
                  <Link href={`/cv/chegadas/contentores/${container.id}`} className="font-mono font-semibold tracking-wider text-brand-700 hover:text-brand-800">
                    {container.number}
                  </Link>
                ) : (
                  <span className="font-mono font-semibold tracking-wider text-slate-800">{container.number}</span>
                )}
                <ContainerStatusBadge status={container.status} />
                {container.sealNumber ? <span className="text-slate-500">selo {container.sealNumber}</span> : null}
                {container.occurrences ? <span className="text-rose-700">{container.occurrences} ocorrência(s)</span> : null}
              </div>
              <CapacityBar label="Conferidos" used={container.accountedFor} limit={container.volumes || 1} format={count} progress />
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}
