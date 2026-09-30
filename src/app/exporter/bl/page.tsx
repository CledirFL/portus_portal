"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { getStatusTone } from "@/lib/status";

const blRows = [
  { doc: "BL-2024-001", shipper: "Atlantic Exports", consignee: "Apex Logistics", status: "Validado" },
  { doc: "BL-2024-014", shipper: "Norte Mar Ltd.", consignee: "BluePort GmbH", status: "Pendente" },
  { doc: "BL-2024-029", shipper: "Sao Vicente Cargo", consignee: "CMA Iberia", status: "Em revisão" },
  { doc: "BL-2024-033", shipper: "Cabo Verde Trade", consignee: "EuroCargo", status: "Atrasado" },
];

export default function BlPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">BL / BL Master</h2>
        <p className="text-sm text-slate-500">Acompanhamento documental de bordo e validações de viagem.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="BLs emitidos">
          <p className="text-3xl font-semibold text-slate-900">180</p>
        </Card>
        <Card title="Pendentes">
          <p className="text-3xl font-semibold text-amber-600">12</p>
        </Card>
        <Card title="Aprovados hoje">
          <p className="text-3xl font-semibold text-emerald-600">34</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Documentos em revisão">
          <div className="mt-4">
            <Table
              columns={[
                { key: "doc", label: "Documento" },
                { key: "shipper", label: "Shipper" },
                { key: "consignee", label: "Consignee" },
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
