"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

const rows = [
  { name: "BL-2024-001", status: "Validado", date: "12/09" },
  { name: "CNT-1042", status: "Em trânsito", date: "13/09" },
  { name: "Manifesto 88", status: "Pendente", date: "14/09" },
];

export default function ExporterDashboardPage() {
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
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name} className="border-t border-slate-200">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
