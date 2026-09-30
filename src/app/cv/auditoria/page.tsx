"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

const auditRows = [
  { id: "AUD-204", scope: "Docs de embarque", result: "Conforme", assignee: "L. Silva" },
  { id: "AUD-208", scope: "Revisão de gate pass", result: "Observações", assignee: "N. Costa" },
  { id: "AUD-211", scope: "Controlo de peso", result: "Conforme", assignee: "P. Ferreira" },
  { id: "AUD-214", scope: "Validação de roteiros", result: "Não conforme", assignee: "M. Gomes" },
];

export default function AuditoriaPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Auditoria</h2>
        <p className="text-sm text-slate-500">Acompanhamento de verificações, desvios e conformidade documental.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Auditorias">
          <p className="text-3xl font-semibold text-slate-900">23</p>
        </Card>
        <Card title="Não conformes">
          <p className="text-3xl font-semibold text-amber-600">2</p>
        </Card>
        <Card title="Concluídas">
          <p className="text-3xl font-semibold text-emerald-600">19</p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Acompanhamento de verificações">
          <div className="mt-4">
            <Table
              columns={[
                { key: "id", label: "ID" },
                { key: "scope", label: "Área" },
                { key: "assignee", label: "Responsável" },
                {
                  key: "result",
                  label: "Resultado",
                  render: (value) => (
                    <Badge
                      tone={
                        value === "Conforme"
                          ? "success"
                          : value === "Não conforme"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {String(value)}
                    </Badge>
                  ),
                },
              ]}
              rows={auditRows}
              emptyMessage="Sem auditorias em execução."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
