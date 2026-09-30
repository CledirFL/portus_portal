"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { getStatusTone } from "@/lib/status";
import { mockAuditRecords, mockCargo, mockVessels } from "@/mocks/domain";

export default function AuditoriaPage() {
  const getVesselName = (vesselId: string) => mockVessels.find((vessel) => vessel.id === vesselId)?.name ?? vesselId;
  const getCargoName = (cargoId: string) => mockCargo.find((cargo) => cargo.id === cargoId)?.cargoType ?? cargoId;

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Auditoria</h2>
        <p className="text-sm text-slate-500">Acompanhamento de verificações, desvios e conformidade documental.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Auditorias">
          <p className="text-3xl font-semibold text-slate-900">{mockAuditRecords.length}</p>
        </Card>
        <Card title="Não conformes">
          <p className="text-3xl font-semibold text-amber-600">
            {mockAuditRecords.filter((audit) => audit.result === "Não conforme").length}
          </p>
        </Card>
        <Card title="Concluídas">
          <p className="text-3xl font-semibold text-emerald-600">
            {mockAuditRecords.filter((audit) => audit.result === "Conforme").length}
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Acompanhamento de verificações">
          <div className="mt-4">
            <Table
              columns={[
                { key: "id", label: "ID" },
                { key: "scope", label: "Área" },
                {
                  key: "vesselId",
                  label: "Navio",
                  render: (value) => <span className="font-medium text-slate-800">{getVesselName(String(value))}</span>,
                },
                {
                  key: "cargoId",
                  label: "Carga",
                  render: (value) => <span className="text-slate-700">{getCargoName(String(value))}</span>,
                },
                { key: "assignee", label: "Responsável" },
                {
                  key: "result",
                  label: "Resultado",
                  render: (value) => (
                    <Badge tone={getStatusTone(String(value))}>{String(value)}</Badge>
                  ),
                },
              ]}
              rows={mockAuditRecords}
              emptyMessage="Sem auditorias em execução."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
