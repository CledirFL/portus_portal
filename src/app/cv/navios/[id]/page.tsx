"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getStatusTone } from "@/lib/status";
import { mockCargo, mockContainers, mockVessels } from "@/mocks/domain";

export default function VesselDetailPage() {
  const params = useParams<{ id: string }>();
  const vessel = mockVessels.find((item) => item.id === params.id);

  if (!vessel) {
    return (
      <AppShell>
        <Card>
          <h2 className="text-xl font-semibold text-slate-900">Navio não encontrado</h2>
          <p className="mt-2 text-sm text-slate-500">A operação solicitada não existe no sistema.</p>
          <Link href="/cv/navios" className="mt-4 inline-block text-sm font-medium text-sky-700">
            Voltar para navios
          </Link>
        </Card>
      </AppShell>
    );
  }

  const cargoNames = vessel.cargoIds.map((id) => mockCargo.find((cargo) => cargo.id === id)?.cargoType ?? id);
  const containerCount = mockContainers.filter((container) => container.vesselId === vessel.id).length;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600">Operação</p>
          <h2 className="text-2xl font-semibold text-slate-900">{vessel.name}</h2>
        </div>

        <Link href="/cv/navios" className="text-sm font-medium text-sky-700 hover:text-sky-800">
          Voltar
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card title="Rota">
          <p className="text-lg font-semibold text-slate-900">{vessel.route}</p>
        </Card>
        <Card title="Porto atual">
          <p className="text-lg font-semibold text-slate-900">{vessel.port}</p>
        </Card>
        <Card title="ETA">
          <p className="text-lg font-semibold text-slate-900">{vessel.eta}</p>
        </Card>
        <Card title="Status">
          <Badge tone={getStatusTone(vessel.status)}>{vessel.status}</Badge>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Resumo da operação">
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Tipo de operação</span>
              <strong className="text-slate-900">{cargoNames.join(", ") || "Carga geral"}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Contentores associados</span>
              <strong className="text-slate-900">{containerCount}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Próximo checkpoint</span>
              <strong className="text-slate-900">{vessel.eta}</strong>
            </div>
          </div>
        </Card>

        <Card title="Ações rápidas">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-lg border border-slate-200 px-3 py-2">Validar gate pass</li>
            <li className="rounded-lg border border-slate-200 px-3 py-2">Verificar contra-marca</li>
            <li className="rounded-lg border border-slate-200 px-3 py-2">Emitir auditoria</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
