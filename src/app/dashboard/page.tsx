"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Anchor, Coins, Inbox, PackageCheck, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { formatCve } from "@/domain/clearance";
import { getDispatchCountry } from "@/domain/countries";
import type { VolumeStatus } from "@/domain/state-machine";
import { volumeStatusLabels } from "@/domain/status-labels";
import { type DashboardSummary, getDashboard } from "@/services/api/dashboard";
import { useAuthStore } from "@/store/auth-store";

/** Ordem do percurso de um volume, do balcão à entrega. */
const volumeFlow: VolumeStatus[] = ["draft", "collected", "consolidated", "shipped", "arrived", "deconsolidated", "held", "released", "delivered", "abandoned"];
const formatDay = (iso: string) => new Date(iso).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });

function RankedList({ rows }: { rows: Array<{ label: string; count: number }> }) {
  if (!rows.length) return <p className="text-sm text-slate-500">Sem encomendas neste período.</p>;
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-t border-slate-100 first:border-0">
            <td className="py-2 text-slate-600">{row.label}</td>
            <td className="py-2 text-right font-semibold tabular-nums text-slate-900">{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getDashboard()
      .then(setSummary)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar o painel."));
  }, [user]);

  const volumes = (status: VolumeStatus) => summary?.volumesByStatus[status] ?? 0;

  return (
    <AppShell>
      <PageHeader
        title="Painel geral"
        description={summary ? `Situação em ${formatDay(summary.generatedAt)}.` : "Situação da operação, do pedido à entrega."}
      />

      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!summary ? (
        error ? null : <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : (
        <div className="space-y-6" data-cy="dashboard">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Pedidos por tratar"
              value={summary.requests.submitted}
              hint={`${summary.requests.inProgress} em curso nas agências`}
              tone={summary.requests.submitted ? "warning" : "neutral"}
              icon={<Inbox className="h-4 w-4" />}
            />
            <StatCard
              label="Por levantar"
              value={summary.pickup.volumes}
              hint={`${summary.pickup.shipments} encomendas · ${summary.pickup.storage.paying} já pagam armazenagem · ${summary.pickup.storage.nearAbandon} perto do abandono (${summary.pickup.abandonAfterDays} dias)`}
              tone={summary.pickup.storage.nearAbandon ? "warning" : "info"}
              icon={<PackageCheck className="h-4 w-4" />}
            />
            <StatCard
              label="Retidos na Alfândega"
              value={volumes("held")}
              hint={`${summary.clearances.pending ?? 0} encomendas à espera de despacho`}
              tone={volumes("held") ? "danger" : "neutral"}
              icon={<ShieldAlert className="h-4 w-4" />}
            />
            <StatCard
              label="Cobrado este mês"
              value={formatCve(summary.payments.monthCve)}
              hint={`${summary.payments.monthCount} pagamentos na portaria`}
              tone="success"
              icon={<Coins className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Volumes por estado" subtitle="Do balcão da agência à entrega em Cabo Verde.">
              <table className="w-full text-sm">
                <tbody>
                  {volumeFlow.map((status) => (
                    <tr key={status} className="border-t border-slate-100 first:border-0">
                      <td className="py-2 text-slate-600">{volumeStatusLabels[status]}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-slate-900">{volumes(status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="space-y-6">
              <Card title="Manifestos em atraso" subtitle="Menos de 72 h para a chegada sem manifesto enviado (BR 13).">
                {summary.manifestAlerts.total ? (
                  <ul className="space-y-2 text-sm">
                    {summary.manifestAlerts.voyages.map((voyage) => (
                      <li key={voyage.id} className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 px-3 py-2 text-rose-800">
                        <Link href={`/agencia/viagens/${voyage.id}`} className="flex items-center gap-2 font-medium hover:underline">
                          <AlertTriangle className="h-4 w-4" aria-hidden /> {voyage.vesselName}
                        </Link>
                        <span className="whitespace-nowrap text-xs">ETA {formatDay(voyage.eta)}</span>
                      </li>
                    ))}
                    {summary.manifestAlerts.total > summary.manifestAlerts.voyages.length ? (
                      <li className="text-xs text-slate-500">e mais {summary.manifestAlerts.total - summary.manifestAlerts.voyages.length}.</li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma viagem em atraso.</p>
                )}
              </Card>

              <Card title="A caminho de Cabo Verde">
                {summary.arriving.length ? (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {summary.arriving.map((voyage) => (
                      <li key={voyage.id} className="flex items-center justify-between gap-3 py-2">
                        <span className="flex items-center gap-2">
                          <Anchor className="h-4 w-4 text-slate-400" aria-hidden />
                          <span>
                            <span className="font-medium text-slate-900">{voyage.vesselName}</span>
                            <span className="block text-xs text-slate-500">
                              {voyage.arrivalPort} · {voyage.volumes} volumes
                            </span>
                          </span>
                        </span>
                        <span className="whitespace-nowrap text-xs text-slate-500">ETA {formatDay(voyage.eta)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum navio em viagem.</p>
                )}
              </Card>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Encomendas por agência" subtitle={`Últimos 30 dias · ${summary.last30Days.shipments} encomendas.`}>
              <RankedList rows={summary.last30Days.byAgency.map((row) => ({ label: row.name, count: row.count }))} />
            </Card>
            <Card title="Encomendas por país de onde envia" subtitle="Últimos 30 dias.">
              <RankedList
                rows={summary.last30Days.byCountry.map((row) => ({ label: getDispatchCountry(row.code)?.name ?? row.code, count: row.count }))}
              />
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
