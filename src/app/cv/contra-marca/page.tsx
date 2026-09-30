"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

const contraMarcaRows = [
  { seal: "CM-2481", voyage: "MV Atlantic Star", status: "Aprovada", team: "Operações Norte" },
  { seal: "CM-2517", voyage: "MV Cabo Verde", status: "Pendente", team: "Porto Praia" },
  { seal: "CM-2554", voyage: "MV Ocean Wave", status: "Em revisão", team: "Operações Sul" },
  { seal: "CM-2602", voyage: "MV Horizon Blue", status: "Aprovada", team: "Audit" },
];

export default function ContraMarcaPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Contra-Marca</h2>
        <p className="text-sm text-slate-500">Acompanhamento de selos e validações por operação logística.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Total">
          <p className="text-3xl font-semibold text-slate-900">41</p>
        </Card>
        <Card title="Aprovadas">
          <p className="text-3xl font-semibold text-emerald-600">28</p>
        </Card>
        <Card title="Pendentes">
          <p className="text-3xl font-semibold text-amber-600">6</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Registos recentes">
          <div className="mt-4">
            <Table
              columns={[
                { key: "seal", label: "Selagem" },
                { key: "voyage", label: "Viagem" },
                { key: "team", label: "Equipa" },
                {
                  key: "status",
                  label: "Status",
                  render: (value) => (
                    <Badge
                      tone={
                        value === "Aprovada"
                          ? "success"
                          : value === "Em revisão"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {String(value)}
                    </Badge>
                  ),
                },
              ]}
              rows={contraMarcaRows}
              emptyMessage="Sem registos de contra-marca."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
