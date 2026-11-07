"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getCargoType } from "@/domain/cargo-types";
import { QrCode } from "@/modules/shipments/components/qr-code";
import { getShipmentReceipt, type ShipmentReceipt } from "@/services/api/shipments";
import { useAuthStore } from "@/store/auth-store";

/** Comprovativo de envio entregue ao remetente ao fechar a caixa: é com ele que se levanta em Cabo Verde. */
export default function ShipmentReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [receipt, setReceipt] = useState<ShipmentReceipt | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getShipmentReceipt(id)
      .then(setReceipt)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível obter o comprovativo."));
  }, [id, user]);

  return (
    <AppShell>
      <div className="print:hidden">
        <PageHeader
          backHref={`/agencia/encomendas/${id}`}
          title={receipt ? `Comprovativo ${receipt.code}` : "Comprovativo"}
          description="Entregue ao remetente. Também segue por email, para o reencaminhar a quem vai levantar."
          actions={
            receipt ? (
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
      {receipt ? (
        <article data-cy="receipt" className="mx-auto max-w-2xl rounded-2xl border border-slate-300 bg-white p-6 text-sm text-slate-800 print:border-0 print:p-0">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-brand-700">PORTUS · COMPROVATIVO DE ENVIO</p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-widest text-slate-900">{receipt.code}</p>
              <p className="text-slate-500">
                {receipt.agency.name} · {receipt.agency.city} · {receipt.agency.phone}
              </p>
              <p className="text-slate-500">{receipt.validatedAt ? new Date(receipt.validatedAt).toLocaleString("pt-PT", { dateStyle: "long", timeStyle: "short" }) : ""}</p>
            </div>
            {receipt.qr ? <QrCode value={receipt.qr} size={120} label={`QR do comprovativo ${receipt.code}`} /> : null}
          </header>

          <section className="grid gap-4 border-b border-slate-200 py-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Remetente</p>
              <p className="font-medium">{receipt.sender.name}</p>
              <p className="text-slate-500">{receipt.sender.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Destinatário</p>
              <p className="font-medium">{receipt.recipient.name}</p>
              <p className="text-slate-500">
                {receipt.recipient.phone} · {receipt.recipient.island}
                {receipt.recipient.nif ? ` · NIF ${receipt.recipient.nif}` : ""}
              </p>
            </div>
          </section>

          <section className="border-b border-slate-200 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Carga</p>
            <p>
              {getCargoType(receipt.category).label} · {receipt.description}
            </p>
            <p className="text-slate-500">
              {receipt.totals.volumes} {receipt.totals.volumes === 1 ? "volume" : "volumes"} · {receipt.totals.weightKg} kg ·{" "}
              {receipt.volumes.map((volume) => volume.code).join(", ")}
            </p>
          </section>

          <section className="pt-4">
            {receipt.destinationAgency && receipt.pickupCode ? (
              <>
                <p className="text-xs uppercase tracking-wide text-slate-500">Levantamento em Cabo Verde</p>
                <p className="font-medium">{receipt.destinationAgency.name}</p>
                <p className="text-slate-500">
                  {receipt.destinationAgency.address}, {receipt.destinationAgency.city} · {receipt.destinationAgency.phone}
                </p>
                <p className="mt-3 rounded-lg border-2 border-dashed border-slate-400 px-3 py-2 text-center">
                  Código de levantamento <span className="font-mono text-xl font-bold tracking-[0.3em]">{receipt.pickupCode}</span>
                </p>
                <p className="mt-3 text-xs text-slate-600">
                  Levanta o destinatário, com o seu documento de identificação, ou outra pessoa que traga o documento do destinatário e
                  este comprovativo (ou o código). A agência cobra as taxas devidas no levantamento e regista quem levou a carga.
                </p>
              </>
            ) : (
              <p className="text-slate-600">
                Levantamento no porto de chegada. O destinatário é avisado quando a carga for libertada pela Alfândega.
              </p>
            )}
          </section>
        </article>
      ) : null}
    </AppShell>
  );
}
