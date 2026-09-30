"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

const dashboardViews = {
  "7d": {
    label: "Últimos 7 dias",
    metrics: [
      { label: "Embarques", value: "41", change: "+8%" },
      { label: "Volume total", value: "6.4k", change: "+5%" },
      { label: "BLs pendentes", value: "11", change: "-3%" },
      { label: "Gate Pass", value: "34", change: "+11%" },
    ],
    ports: [
      { name: "Mindelo", share: 42, value: "12 ops" },
      { name: "Praia", share: 28, value: "8 ops" },
      { name: "Tarrafal", share: 18, value: "5 ops" },
      { name: "Rotterdam", share: 12, value: "3 ops" },
    ],
  },
  "30d": {
    label: "Últimos 30 dias",
    metrics: [
      { label: "Embarques", value: "124", change: "+12%" },
      { label: "Volume total", value: "18.4k", change: "+8%" },
      { label: "BLs pendentes", value: "31", change: "-4%" },
      { label: "Gate Pass", value: "89", change: "+9%" },
    ],
    ports: [
      { name: "Mindelo", share: 36, value: "28 ops" },
      { name: "Praia", share: 24, value: "19 ops" },
      { name: "Tarrafal", share: 20, value: "16 ops" },
      { name: "Rotterdam", share: 20, value: "16 ops" },
    ],
  },
  "90d": {
    label: "Últimos 90 dias",
    metrics: [
      { label: "Embarques", value: "381", change: "+17%" },
      { label: "Volume total", value: "52.2k", change: "+14%" },
      { label: "BLs pendentes", value: "76", change: "-7%" },
      { label: "Gate Pass", value: "241", change: "+16%" },
    ],
    ports: [
      { name: "Mindelo", share: 40, value: "84 ops" },
      { name: "Praia", share: 26, value: "55 ops" },
      { name: "Tarrafal", share: 18, value: "39 ops" },
      { name: "Rotterdam", share: 16, value: "34 ops" },
    ],
  },
} as const;

type RangeKey = keyof typeof dashboardViews;

const operationalRows = [
  { id: "OP-412", route: "Mindelo → Rotterdam", status: "Em trânsito", progress: 72 },
  { id: "OP-389", route: "Praia → Antwerp", status: "Validado", progress: 91 },
  { id: "OP-371", route: "Tarrafal → Lisbon", status: "Pendente", progress: 46 },
  { id: "OP-366", route: "Mindelo → Hamburg", status: "Atrasado", progress: 35 },
];

const activityFeed = [
  { time: "08:40", text: "BL-2024-001 validado por auditoria documental." },
  { time: "09:15", text: "Gate pass CNT-1042 foi autorizado em Mindelo." },
  { time: "10:30", text: "Viagem MV Ocean Wave entrou em fase de descarga." },
  { time: "11:05", text: "Volume de Praia → Antwerp excedeu a capacidade prevista em 6%." },
];

const priorityTasks = [
  { title: "Revisão de manifesto", owner: "Ana Silva", due: "Hoje, 14:00", tone: "warning" },
  { title: "Validação de contra-marca", owner: "Duarte Nunes", due: "Hoje, 16:30", tone: "success" },
  { title: "Trafego em atraso", owner: "Bruno Costa", due: "Hoje, 18:00", tone: "danger" },
];

export default function DashboardPage() {
  const [range, setRange] = useState<RangeKey>("30d");

  const view = useMemo(() => dashboardViews[range], [range]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard geral</h2>
          <p className="text-sm text-slate-500">Visão consolidada das operações PORTUS.</p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
          {Object.entries(dashboardViews).map(([key, item]) => (
            <Button
              key={key}
              type="button"
              variant={range === key ? "primary" : "ghost"}
              onClick={() => setRange(key as RangeKey)}
              className="px-3 py-1.5"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {view.metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-slate-500">{metric.label}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <span className="text-3xl font-semibold text-slate-900">{metric.value}</span>
              <span className="text-sm font-medium text-emerald-600">{metric.change}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Status das operações">
          <div className="space-y-4">
            {[
              { label: "Navios em trânsito", value: 12, total: 18 },
              { label: "Contêineres conferidos", value: 642, total: 800 },
              { label: "Manifestos validados", value: 49, total: 60 },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <strong className="text-slate-900">{item.value}</strong>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-sky-600"
                    style={{ width: `${(item.value / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1.2fr]">
        <Card title="Volume por porto">
          <div className="space-y-4">
            {view.ports.map((port) => (
              <div key={port.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{port.name}</span>
                  <span className="font-medium text-slate-900">{port.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${port.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Operações em curso">
          <div className="mt-4">
            <Table
              columns={[
                { key: "id", label: "ID" },
                { key: "route", label: "Rota" },
                {
                  key: "status",
                  label: "Status",
                  render: (value) => (
                    <Badge
                      tone={
                        value === "Validado"
                          ? "success"
                          : value === "Atrasado"
                            ? "danger"
                            : value === "Pendente"
                              ? "warning"
                              : "neutral"
                      }
                    >
                      {String(value)}
                    </Badge>
                  ),
                },
                {
                  key: "progress",
                  label: "Progresso",
                  render: (value) => <span className="font-medium text-slate-700">{String(value)}%</span>,
                },
              ]}
              rows={operationalRows}
              emptyMessage="Sem operações em curso."
            />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Atividade recente">
          <div className="mt-4 space-y-4">
            {activityFeed.map((item) => (
              <div key={item.time} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                  {item.time.split(":")[0]}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{item.time}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Tarefas prioritárias">
          <div className="mt-4 space-y-3">
            {priorityTasks.map((task) => (
              <div key={task.title} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{task.owner}</p>
                  </div>
                  <Badge
                    tone={
                      task.tone === "success"
                        ? "success"
                        : task.tone === "danger"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {task.tone === "success" ? "OK" : task.tone === "danger" ? "Urgente" : "Pendente"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-600">Entrega: {task.due}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
