"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { getStatusTone } from "@/lib/status";
import { mockDocuments, mockVessels } from "@/mocks/domain";

export default function BlPage() {
  const blRows = mockDocuments.filter((doc) => doc.type === "BL");
  const getVesselName = (vesselId: string) => mockVessels.find((vessel) => vessel.id === vesselId)?.name ?? vesselId;

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">BL / BL Master</h2>
        <p className="text-sm text-slate-500">Acompanhamento documental de bordo e validações de viagem.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="BLs emitidos">
          <p className="text-3xl font-semibold text-slate-900">{blRows.length}</p>
        </Card>
        <Card title="Pendentes">
          <p className="text-3xl font-semibold text-amber-600">
            {blRows.filter((row) => row.status === "Pendente").length}
          </p>
        </Card>
        <Card title="Aprovados hoje">
          <p className="text-3xl font-semibold text-emerald-600">
            {blRows.filter((row) => row.status === "Validado").length}
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Documentos em revisão">
          <div className="mt-4">
            <Table
              columns={[
                { key: "reference", label: "Documento" },
                { key: "shipper", label: "Shipper" },
                { key: "consignee", label: "Consignee" },
                {
                  key: "vesselId",
                  label: "Navio",
                  render: (value) => <span className="font-medium text-slate-800">{getVesselName(String(value))}</span>,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (value) => (
                    <Badge tone={getStatusTone(String(value))}>{String(value)}</Badge>
                  ),
                },
              ]}
              rows={blRows}
              emptyMessage="Sem documentos em revisão."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
