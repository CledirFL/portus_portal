"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { getStatusTone } from "@/lib/status";
import { mockSealRecords, mockVessels } from "@/mocks/domain";

export default function ContraMarcaPage() {
  const getVesselName = (vesselId: string) => mockVessels.find((vessel) => vessel.id === vesselId)?.name ?? vesselId;

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Contra-Marca</h2>
        <p className="text-sm text-slate-500">Acompanhamento de selos e validações por operação logística.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total">
          <p className="text-3xl font-semibold text-slate-900">{mockSealRecords.length}</p>
        </Card>
        <Card title="Aprovadas">
          <p className="text-3xl font-semibold text-emerald-600">
            {mockSealRecords.filter((seal) => seal.status === "Aprovada").length}
          </p>
        </Card>
        <Card title="Pendentes">
          <p className="text-3xl font-semibold text-amber-600">
            {mockSealRecords.filter((seal) => seal.status === "Pendente").length}
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Registos recentes">
          <div className="mt-4">
            <Table
              columns={[
                { key: "code", label: "Selagem" },
                {
                  key: "vesselId",
                  label: "Viagem",
                  render: (value) => <span className="font-medium text-slate-800">{getVesselName(String(value))}</span>,
                },
                { key: "team", label: "Equipa" },
                {
                  key: "status",
                  label: "Status",
                  render: (value) => (
                    <Badge tone={getStatusTone(String(value))}>{String(value)}</Badge>
                  ),
                },
              ]}
              rows={mockSealRecords}
              emptyMessage="Sem registos de contra-marca."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
