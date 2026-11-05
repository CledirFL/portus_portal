"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import type { VoyageStatus } from "@/domain/status-labels";
import type { Agency } from "@/domain/agency";
import {
  DeadlineBadge,
  ErrorBanner,
  formatDateTime,
  formatKg,
  VoyageStatusBadge,
} from "@/modules/consolidation/components/consolidation-ui";
import { VoyageForm } from "@/modules/consolidation/components/voyage-form";
import { fetchAgencies } from "@/services/api/agencies";
import type { Page } from "@/services/api/containers";
import { createVoyage, listVoyages, type Voyage } from "@/services/api/voyages";
import { useAuthStore } from "@/store/auth-store";

const tabs: Array<{ key: VoyageStatus | "all" | "alert"; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "alert", label: "Com alerta" },
  { key: "planned", label: "Planeadas" },
  { key: "departed", label: "Em viagem" },
];

export default function VoyagesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<VoyageStatus | "all" | "alert">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [result, setResult] = useState<Page<Voyage> | null>(null);
  const [alerts, setAlerts] = useState(0);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);

  useEffect(() => {
    if (!user) return;
    listVoyages({ status: tab === "all" || tab === "alert" ? undefined : tab, alert: tab === "alert", page, pageSize })
      .then((voyagePage) => {
        setResult(voyagePage);
        setError("");
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar as viagens."));
    listVoyages({ alert: true, pageSize: 10 })
      .then((alertPage) => setAlerts(alertPage.total))
      .catch(() => undefined);
  }, [user, tab, page, pageSize]);

  useEffect(() => {
    if (isAdmin) fetchAgencies().then(setAgencies).catch(() => undefined);
  }, [isAdmin]);

  return (
    <AppShell>
      <PageHeader
        title="Viagens e manifestos"
        description="Associe contentores selados a uma viagem, gere o manifesto e envie-o até 72 h antes do ETA."
        actions={
          <Button onClick={() => setShowForm((value) => !value)} variant={showForm ? "outline" : "primary"}>
            <Plus className="h-4 w-4" aria-hidden /> {showForm ? "Fechar" : "Nova viagem"}
          </Button>
        }
      />

      {alerts > 0 && tab !== "alert" ? (
        <button
          type="button"
          onClick={() => {
            setTab("alert");
            setPage(1);
          }}
          className="mb-4 flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-800 hover:bg-rose-100"
          data-cy="alert-banner"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong>{alerts === 1 ? "1 viagem" : `${alerts} viagens`}</strong> a menos de 72 h do ETA sem manifesto enviado (BR 13). Ver.
          </span>
        </button>
      ) : null}

      {showForm ? (
        <Card title="Nova viagem" className="mb-6">
          <VoyageForm
            agencies={isAdmin ? agencies : undefined}
            submitLabel="Criar viagem"
            onSubmit={async (input) => {
              const voyage = await createVoyage(input);
              router.push(`/agencia/viagens/${voyage.id}`);
            }}
          />
        </Card>
      ) : null}

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => {
              setTab(item.key);
              setPage(1);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === item.key ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} />

      {result === null ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : result.items.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Viagem</th>
                <th className="px-4 py-3 font-medium">Rota</th>
                <th className="px-4 py-3 font-medium">ETA</th>
                <th className="px-4 py-3 font-medium">Carga</th>
                <th className="px-4 py-3 font-medium">Manifesto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((voyage) => (
                <tr key={voyage.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/agencia/viagens/${voyage.id}`} className="font-semibold text-brand-700 hover:text-brand-800">
                      {voyage.vesselName}
                      {voyage.voyageNumber ? ` · ${voyage.voyageNumber}` : ""}
                    </Link>
                    <p className="font-mono text-xs text-slate-400">{voyage.code}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {voyage.departurePort} → {voyage.arrivalPort.code}
                    <p className="text-xs text-slate-400">{voyage.arrivalPort.name}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatDateTime(voyage.eta)}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {voyage.totals.containers} cont. · {voyage.totals.volumes} vol.
                    <p className="text-xs text-slate-400">{formatKg(voyage.totals.weightKg)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <DeadlineBadge deadline={voyage.manifestDeadline} />
                  </td>
                  <td className="px-4 py-3">
                    <VoyageStatusBadge status={voyage.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            itemLabel="viagens"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          {tab === "alert" ? "Nenhuma viagem com o manifesto em atraso." : "Ainda não há viagens. Crie a primeira com “Nova viagem”."}
        </div>
      )}
    </AppShell>
  );
}
