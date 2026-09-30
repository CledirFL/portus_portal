"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { getStatusTone } from "@/lib/status";
import { mockDocuments, mockVessels } from "@/mocks/domain";

export default function ManifestosPage() {
  const manifestRows = mockDocuments.filter((doc) => doc.type === "Manifesto");
  const getVesselName = (vesselId: string) => mockVessels.find((vessel) => vessel.id === vesselId)?.name ?? vesselId;

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Manifestos</h2>
        <p className="text-sm text-slate-500">Gestão de manifestos e validação documental por navegação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Manifestos ativos">
          <p className="text-3xl font-semibold text-slate-900">{manifestRows.length}</p>
        </Card>
        <Card title="Pendentes">
          <p className="text-3xl font-semibold text-amber-600">
            {manifestRows.filter((row) => row.status === "Pendente").length}
          </p>
        </Card>
        <Card title="Última validação">
          <p className="text-3xl font-semibold text-slate-900">Hoje</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Fluxo de documentação">
          <div className="mt-4">
            <Table
              columns={[
                { key: "reference", label: "Manifesto" },
                {
                  key: "vesselId",
                  label: "Viagem",
                  render: (value) => <span className="font-medium text-slate-800">{getVesselName(String(value))}</span>,
                },
                { key: "eta", label: "Emissão" },
                {
                  key: "status",
                  label: "Status",
                  render: (value) => (
                    <Badge tone={getStatusTone(String(value))}>{String(value)}</Badge>
                  ),
                },
              ]}
              rows={manifestRows}
              emptyMessage="Sem manifestos em processo."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
