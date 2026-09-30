"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

const routes = [
  { ship: "MV Atlantic Star", port: "Mindelo", status: "Em rota", eta: "18:30" },
  { ship: "MV Cabo Verde", port: "Praia", status: "Atracado", eta: "21:15" },
  { ship: "MV Ocean Wave", port: "Tarrafal", status: "Em operação", eta: "08:00" },
];

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
          <div className="mt-4 space-y-3">
            {routes.map((route) => (
              <div key={route.ship} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{route.ship}</p>
                  <p className="text-sm text-slate-500">{route.port}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">{route.status}</p>
                  <p className="text-xs text-slate-500">ETA {route.eta}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
