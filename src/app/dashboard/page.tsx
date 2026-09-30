"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

const metrics = [
  { label: "Embarques", value: "124", change: "+12%" },
  { label: "Volume total", value: "18.4k", change: "+8%" },
  { label: "BLs pendentes", value: "31", change: "-4%" },
  { label: "Gate Pass", value: "89", change: "+9%" },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard geral</h2>
        <p className="text-sm text-slate-500">Visão consolidada das operações PORTUS.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-slate-500">{metric.label}</p>
            <div className="mt-4 flex items-end justify-between">
              <span className="text-3xl font-semibold text-slate-900">{metric.value}</span>
              <span className="text-sm font-medium text-emerald-600">{metric.change}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Status das operações">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Navios em trânsito</span>
              <strong className="text-slate-900">12</strong>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Contêineres conferidos</span>
              <strong className="text-slate-900">642</strong>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Manifestos validados</span>
              <strong className="text-slate-900">49</strong>
            </li>
          </ul>
        </Card>

        <Card title="Alertas recentes">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              3 BLs com revisão pendente.
            </li>
            <li className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
              2 gate passes aguardando conferência.
            </li>
            <li className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              5 documentos validados hoje.
            </li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
