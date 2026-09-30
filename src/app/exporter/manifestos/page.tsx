"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { getStatusTone } from "@/lib/status";

const manifestRows = [
  { code: "MNF-4401", voyage: "MV Atlantic Star", issue: "14 Sep", status: "Validado" },
  { code: "MNF-4410", voyage: "MV Cabo Verde", issue: "15 Sep", status: "Em revisão" },
  { code: "MNF-4422", voyage: "MV Ocean Wave", issue: "16 Sep", status: "Pendente" },
  { code: "MNF-4438", voyage: "MV Horizon Blue", issue: "17 Sep", status: "Atrasado" },
];

export default function ManifestosPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Manifestos</h2>
        <p className="text-sm text-slate-500">Gestão de manifestos e validação documental por navegação.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Manifestos ativos">
          <p className="text-3xl font-semibold text-slate-900">57</p>
        </Card>
        <Card title="Pendentes">
          <p className="text-3xl font-semibold text-amber-600">9</p>
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
                { key: "code", label: "Manifesto" },
                { key: "voyage", label: "Viagem" },
                { key: "issue", label: "Emissão" },
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
