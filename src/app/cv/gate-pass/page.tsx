"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

const gatePassRows = [
  { container: "CNT-1042", vehicle: "TRK-44", destination: "Terminal Norte", status: "Autorizado" },
  { container: "CNT-1089", vehicle: "TRK-31", destination: "Gate B", status: "Em revisão" },
  { container: "CNT-1103", vehicle: "TRK-05", destination: "Porto Sudeste", status: "Recusado" },
];

export default function GatePassPage() {
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
          <p className="text-3xl font-semibold">94</p>
        </Card>
        <Card title="Válidos">
          <p className="text-3xl font-semibold">86</p>
        </Card>
        <Card title="Pendentes">
          <p className="text-3xl font-semibold">7</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Registos recentes">
          <div className="mt-4">
            <Table
              columns={[
                { key: "container", label: "Container" },
                { key: "vehicle", label: "Veículo" },
                { key: "destination", label: "Destino" },
                {
                  key: "status",
                  label: "Status",
                  render: (value) => (
                    <Badge
                      tone={
                        value === "Autorizado"
                          ? "success"
                          : value === "Recusado"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {String(value)}
                    </Badge>
                  ),
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
