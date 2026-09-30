"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { shipmentRows } from "@/mocks/portal";

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>();
  const shipment = shipmentRows.find((item) => item.id === params.id);

  if (!shipment) {
    return (
      <AppShell>
        <Card>
          <h2 className="text-xl font-semibold text-slate-900">Embarque não encontrado</h2>
          <p className="mt-2 text-sm text-slate-500">O registo solicitado não existe no portal.</p>
          <Link href="/exporter/shipments" className="mt-4 inline-block text-sm font-medium text-sky-700">
            Voltar para embarques
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-600">Embarque</p>
          <h2 className="text-2xl font-semibold text-slate-900">{shipment.code}</h2>
        </div>

        <Link href="/exporter/shipments" className="text-sm font-medium text-sky-700 hover:text-sky-800">
          Voltar
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card title="Exportador">
          <p className="text-lg font-semibold text-slate-900">{shipment.exporter}</p>
        </Card>
        <Card title="Rota">
          <p className="text-lg font-semibold text-slate-900">{shipment.route}</p>
        </Card>
        <Card title="ETA">
          <p className="text-lg font-semibold text-slate-900">{shipment.eta}</p>
        </Card>
        <Card title="Status">
          <Badge
            tone={
              shipment.status === "Validado"
                ? "success"
                : shipment.status === "Atrasado"
                  ? "danger"
                  : shipment.status === "Pendente"
                    ? "warning"
                    : "neutral"
            }
          >
            {shipment.status}
          </Badge>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="Resumo operativo">
          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Volume</span>
              <strong className="text-slate-900">{shipment.volume}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Progresso</span>
              <strong className="text-slate-900">{shipment.progress}%</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Última atualização</span>
              <strong className="text-slate-900">Hoje, 08:40</strong>
            </div>
          </div>
        </Card>

        <Card title="Documentação">
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-lg border border-slate-200 px-3 py-2">BL master validado</li>
            <li className="rounded-lg border border-slate-200 px-3 py-2">Manifesto em revisão</li>
            <li className="rounded-lg border border-slate-200 px-3 py-2">Gate pass aprovado</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
