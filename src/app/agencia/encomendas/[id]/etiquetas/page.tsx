"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getCargoType } from "@/domain/cargo-types";
import { getDispatchCountry } from "@/domain/countries";
import { QrCode } from "@/modules/shipments/components/qr-code";
import { getShipmentLabels, type ShipmentLabels } from "@/services/api/shipments";
import { useAuthStore } from "@/store/auth-store";

export default function ShipmentLabelsPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<ShipmentLabels | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getShipmentLabels(id)
      .then(setData)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível obter as etiquetas."));
  }, [id, user]);

  return (
    <AppShell>
      <div className="print:hidden">
        <PageHeader
          backHref={`/agencia/encomendas/${id}`}
          title={data ? `Etiquetas ${data.shipment.code}` : "Etiquetas"}
          description="Uma etiqueta por volume. O QR é assinado: etiquetas alteradas ou copiadas de outra encomenda são rejeitadas na leitura."
          actions={
            data ? (
              <Button onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden /> Imprimir
              </Button>
            ) : null
          }
        />
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {data ? (
        <div className="grid gap-6 md:grid-cols-2 print:block">
          {data.labels.map((label) => (
            <article
              key={label.volumeCode}
              data-cy="volume-label"
              className="break-inside-avoid rounded-xl border-2 border-slate-900 bg-white p-5 text-slate-900 print:mb-6 print:rounded-none"
            >
              <header className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]">PORTUS · Cabo Verde</p>
                  <p className="text-xs">
                    {data.shipment.agency.name} ({data.shipment.agency.code}) ·{" "}
                    {getDispatchCountry(data.shipment.dispatchCountry)?.name ?? data.shipment.dispatchCountry}
                  </p>
                </div>
                <p className="text-right text-sm font-bold">
                  Volume {label.sequence} de {label.totalVolumes}
                </p>
              </header>

              <div className="mt-4 flex gap-5">
                <QrCode value={label.qr} label={`QR do volume ${label.volumeCode}`} size={150} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-2xl font-bold tracking-wider">{label.volumeCode}</p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Destinatário</p>
                  <p className="text-lg font-semibold leading-tight">{data.shipment.recipient.name}</p>
                  <p className="text-base font-bold uppercase">{data.shipment.recipient.island}</p>
                  <p className="text-sm">{data.shipment.recipient.phone}</p>
                </div>
              </div>

              <footer className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-300 pt-3 text-xs">
                <div>
                  <p className="text-slate-500">Peso</p>
                  <p className="font-semibold">{label.weightKg} kg</p>
                </div>
                <div>
                  <p className="text-slate-500">Carga</p>
                  <p className="font-semibold">{getCargoType(data.shipment.category).label}</p>
                </div>
                <div>
                  <p className="text-slate-500">Selo</p>
                  <p className="font-semibold">{label.sealed ? "Intacto" : "Aberto"}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-slate-500">Remetente</p>
                  <p className="font-semibold">{data.shipment.sender.name}</p>
                </div>
              </footer>
            </article>
          ))}
        </div>
      ) : !error ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : null}
    </AppShell>
  );
}
