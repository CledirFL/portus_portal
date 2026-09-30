"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

const volumeRows = [
  { route: "Mindelo → Rotterdam", volume: "2.8k TEU", utilization: "76%", status: "Ótimo" },
  { route: "Praia → Antwerp", volume: "1.9k TEU", utilization: "64%", status: "Normal" },
  { route: "Tarrafal → Lisbon", volume: "3.1k TEU", utilization: "89%", status: "Elevado" },
  { route: "Mindelo → Hamburg", volume: "1.4k TEU", utilization: "53%", status: "Normal" },
];

export default function VolumesPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Volumes e capacidade</h2>
        <p className="text-sm text-slate-500">Acompanhamento de capacidade por rota e necessidade de carga.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="TEUs total">
          <p className="text-3xl font-semibold text-slate-900">12.4k</p>
        </Card>
        <Card title="Capacidade livre">
          <p className="text-3xl font-semibold text-slate-900">3.1k</p>
        </Card>
        <Card title="Ajustes pendentes">
          <p className="text-3xl font-semibold text-amber-600">5</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Performance por rota">
          <div className="mt-4">
            <Table
              columns={[
                { key: "route", label: "Rota" },
                { key: "volume", label: "Volume" },
                { key: "utilization", label: "Utilização" },
                {
                  key: "status",
                  label: "Status",
                  render: (value) => (
                    <Badge
                      tone={value === "Elevado" ? "warning" : value === "Ótimo" ? "success" : "neutral"}
                    >
                      {String(value)}
                    </Badge>
                  ),
                },
              ]}
              rows={volumeRows}
              emptyMessage="Sem registos de volume para este período."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
