"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { getStatusTone } from "@/lib/status";
import { mockContainers, mockDocuments, mockVessels } from "@/mocks/domain";

export default function GatePassPage() {
  const gatePassRows = mockDocuments.filter((doc) => doc.type === "Gate Pass");
  const getContainer = (vesselId: string) => mockContainers.find((container) => container.vesselId === vesselId)?.containerNumber ?? "N/D";
  const getVesselName = (vesselId: string) => mockVessels.find((vessel) => vessel.id === vesselId)?.name ?? vesselId;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Gate Pass</h2>
          <p className="text-sm text-slate-500">Controle de entrada e saída dos contentores.</p>
        </div>
        <Link href="/cv/gate-pass/new">
          <Button> Novo gate pass </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Emitidos">
          <p className="text-3xl font-semibold">{gatePassRows.length}</p>
        </Card>
        <Card title="Válidos">
          <p className="text-3xl font-semibold">{gatePassRows.filter((row) => row.status === "Validado").length}</p>
        </Card>
        <Card title="Pendentes">
          <p className="text-3xl font-semibold">{gatePassRows.filter((row) => row.status === "Pendente").length}</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Registos recentes">
          <div className="mt-4">
            <Table
              columns={[
                { key: "reference", label: "Gate Pass" },
                {
                  key: "vesselId",
                  label: "Navio",
                  render: (value) => <span className="font-medium text-slate-800">{getVesselName(String(value))}</span>,
                },
                {
                  key: "eta",
                  label: "Container",
                  render: (_, row) => <span>{getContainer(String(row.vesselId))}</span>,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (value) => <Badge tone={getStatusTone(String(value))}>{String(value)}</Badge>,
                },
              ]}
              rows={gatePassRows}
              emptyMessage="Sem registos de gate pass."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
