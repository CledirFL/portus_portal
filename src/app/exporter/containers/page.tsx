"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { getStatusTone } from "@/lib/status";
import { mockCargo, mockContainers, mockVessels } from "@/mocks/domain";

export default function ContainersPage() {
  const getVesselName = (vesselId: string) => mockVessels.find((vessel) => vessel.id === vesselId)?.name ?? vesselId;
  const getCargoName = (cargoId: string) => mockCargo.find((cargo) => cargo.id === cargoId)?.cargoType ?? cargoId;

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Containers</h2>
        <p className="text-sm text-slate-500">Monitorização dos contentores por navegação, porto e estado documental.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Ativos">
          <p className="text-3xl font-semibold text-slate-900">{mockContainers.length}</p>
        </Card>
        <Card title="Em inspeção">
          <p className="text-3xl font-semibold text-amber-600">
            {mockContainers.filter((container) => container.status === "Em inspeção").length}
          </p>
        </Card>
        <Card title="Aguardando descarga">
          <p className="text-3xl font-semibold text-slate-900">
            {mockContainers.filter((container) => container.status === "Aguardando descarga").length}
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Contentores em operação">
          <div className="mt-4">
            <Table
              columns={[
                { key: "containerNumber", label: "Container" },
                {
                  key: "vesselId",
                  label: "Viagem",
                  render: (value) => <span className="font-medium text-slate-800">{getVesselName(String(value))}</span>,
                },
                {
                  key: "cargoId",
                  label: "Carga",
                  render: (value) => <span className="text-slate-700">{getCargoName(String(value))}</span>,
                },
                { key: "port", label: "Porto" },
                {
                  key: "status",
                  label: "Estado",
                  render: (value) => (
                    <Badge tone={getStatusTone(String(value))}>{String(value)}</Badge>
                  ),
                },
              ]}
              rows={mockContainers}
              emptyMessage="Sem contentores registados."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
