"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ManifestCustomsBadge } from "@/modules/arrivals/components/arrivals-ui";
import { ErrorBanner, formatDateTime, VoyageStatusBadge } from "@/modules/consolidation/components/consolidation-ui";
import { listTerminalVoyages, type TerminalVoyage } from "@/services/api/arrivals";
import { useAuthStore } from "@/store/auth-store";

const tabs = [
  { key: "departed", label: "A caminho" },
  { key: "arrived", label: "Chegadas" },
] as const;

export default function ArrivalsPage() {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<"departed" | "arrived">("departed");
  const [voyages, setVoyages] = useState<TerminalVoyage[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    listTerminalVoyages({ status: tab, pageSize: 50 })
      .then((page) => {
        setVoyages(page.items);
        setError("");
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar as viagens."));
  }, [user, tab]);

  return (
    <AppShell>
      <PageHeader title="Chegadas" description="Navios a caminho do seu porto. Registe a chegada e confira os contentores volume a volume." />

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => {
              setTab(item.key);
              setVoyages(null);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === item.key ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} />

      {voyages === null ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : voyages.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {voyages.map((voyage) => {
            const volumes = voyage.containers.reduce((sum, container) => sum + container.volumes, 0);
            const accounted = voyage.containers.reduce((sum, container) => sum + container.accountedFor, 0);
            return (
              <Link
                key={voyage.id}
                href={`/cv/chegadas/${voyage.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-brand-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {voyage.vesselName}
                      {voyage.voyageNumber ? ` · ${voyage.voyageNumber}` : ""}
                    </p>
                    <p className="text-sm text-slate-500">
                      {voyage.code} · {voyage.departurePort} → {voyage.arrivalPort.code} · {voyage.agency.name}
                    </p>
                  </div>
                  <VoyageStatusBadge status={voyage.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span>{voyage.arrivedAt ? `Chegou ${formatDateTime(voyage.arrivedAt)}` : `ETA ${formatDateTime(voyage.eta)}`}</span>
                  <span>·</span>
                  <span>
                    {voyage.containers.length} contentor(es), {volumes} volume(s)
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ManifestCustomsBadge manifest={voyage.manifest} />
                  {voyage.status === "arrived" ? (
                    <Badge tone={accounted === volumes ? "success" : "info"}>
                      Conferidos {accounted}/{volumes}
                    </Badge>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          {tab === "departed" ? "Não há navios a caminho deste porto." : "Ainda não chegou nenhum navio."}
        </div>
      )}
    </AppShell>
  );
}
