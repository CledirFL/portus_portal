"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { voyageRows } from "@/mocks/portal";

export default function NaviosPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Navios & Viagens</h2>
        <p className="text-sm text-slate-500">Monitorização das rotas e operações portuárias.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Navios ativos">
          <p className="text-3xl font-semibold">18</p>
        </Card>
        <Card title="Viagens hoje">
          <p className="text-3xl font-semibold">7</p>
        </Card>
        <Card title="Portos monitorizados">
          <p className="text-3xl font-semibold">9</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Operações em curso">
          <div className="mt-4">
            <Table
              columns={[
                {
                  key: "ship",
                  label: "Navio",
                  render: (value, row) => (
                    <a href={`/cv/navios/${row.id}`} className="font-medium text-sky-700 hover:text-sky-800">
                      {String(value)}
                    </a>
                  ),
                },
                { key: "route", label: "Rota" },
                {
                  key: "status",
                  label: "Status",
                  render: (value) => (
                    <Badge
                      tone={
                        value === "Atracado"
                          ? "success"
                          : value === "Em operação"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {String(value)}
                    </Badge>
                  ),
                },
                { key: "eta", label: "ETA" },
              ]}
              rows={voyageRows}
              emptyMessage="Sem operações em curso."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
