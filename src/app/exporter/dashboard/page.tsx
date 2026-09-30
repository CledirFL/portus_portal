"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { shipmentRows } from "@/mocks/portal";

export default function ExporterDashboardPage() {
  const rows = shipmentRows.map((item) => ({
    ...item,
    statusTone:
      item.status === "Validado"
        ? "success"
        : item.status === "Atrasado"
          ? "danger"
          : item.status === "Pendente"
            ? "warning"
            : "neutral",
  }));

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Área do Exportador</h2>
        <p className="text-sm text-slate-500">Resumo de carregamentos e documentação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Embarques ativos">
          <p className="text-3xl font-semibold">24</p>
        </Card>
        <Card title="Volume em TEUs">
          <p className="text-3xl font-semibold">7.8k</p>
        </Card>
        <Card title="Documentação">
          <p className="text-3xl font-semibold">91%</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Últimos movimentos">
          <div className="mt-4">
            <Table
              columns={[
                { key: "code", label: "Documento" },
                { key: "route", label: "Rota" },
                {
                  key: "status",
                  label: "Status",
                  render: (value, row) => (
                    <Badge
                      tone={
                        row.status === "Validado"
                          ? "success"
                          : row.status === "Atrasado"
                            ? "danger"
                            : row.status === "Pendente"
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
              rows={rows}
              emptyMessage="Sem movimentações para mostrar."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
