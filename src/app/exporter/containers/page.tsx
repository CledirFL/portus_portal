"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { getStatusTone } from "@/lib/status";

const containerRows = [
  { container: "CNT-1042", voyage: "MV Atlantic Star", port: "Mindelo", status: "Em inspeção" },
  { container: "CNT-1089", voyage: "MV Cabo Verde", port: "Praia", status: "Liberado" },
  { container: "CNT-1103", voyage: "MV Ocean Wave", port: "Tarrafal", status: "Aguardando descarga" },
  { container: "CNT-1158", voyage: "MV Horizon Blue", port: "Le Havre", status: "Em trânsito" },
];

export default function ContainersPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Containers</h2>
        <p className="text-sm text-slate-500">Monitorização dos contentores por navegação, porto e estado documental.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Ativos">
          <p className="text-3xl font-semibold text-slate-900">412</p>
        </Card>
        <Card title="Em inspeção">
          <p className="text-3xl font-semibold text-amber-600">22</p>
        </Card>
        <Card title="Aguardando descarga">
          <p className="text-3xl font-semibold text-slate-900">31</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Contentores em operação">
          <div className="mt-4">
            <Table
              columns={[
                { key: "container", label: "Container" },
                { key: "voyage", label: "Viagem" },
                { key: "port", label: "Porto" },
                {
                  key: "status",
                  label: "Estado",
                  render: (value) => (
                    <Badge tone={getStatusTone(String(value))}>{String(value)}</Badge>
                  ),
                },
              ]}
              rows={containerRows}
              emptyMessage="Sem contentores registados."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
