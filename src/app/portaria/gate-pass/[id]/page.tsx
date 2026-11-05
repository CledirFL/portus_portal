"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { formatCve } from "@/domain/clearance";
import { ErrorBanner, formatDateTime, formatKg } from "@/modules/consolidation/components/consolidation-ui";
import { QrCode } from "@/modules/shipments/components/qr-code";
import { getGatePass, type GatePass } from "@/services/api/arrivals";
import { useAuthStore } from "@/store/auth-store";

export default function GatePassPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [pass, setPass] = useState<GatePass | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getGatePass(id)
      .then(setPass)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar o Gate Pass."));
  }, [user, id]);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between print:hidden!">
        <Link href="/portaria" className="text-sm text-slate-500 hover:text-slate-700">
          ← Levantamentos
        </Link>
        {pass ? (
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden /> Imprimir
          </Button>
        ) : null}
      </div>
      <ErrorBanner message={error} />
      {pass ? (
        <section className="mx-auto max-w-2xl rounded-xl border-2 border-slate-900 bg-white p-6 text-slate-900" data-cy="gate-pass">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">PORTUS · Gate Pass</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-wider">{pass.gatePassNumber}</p>
              <p className="mt-1 text-sm">
                {pass.port.name} · emitido {formatDateTime(pass.issuedAt)}
                {pass.issuedBy ? ` por ${pass.issuedBy}` : ""}
              </p>
            </div>
            <QrCode value={pass.qr} size={120} label={`QR do Gate Pass ${pass.gatePassNumber}`} />
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Levantado por</dt>
              <dd className="font-medium">
                {pass.person.name}
                {pass.authorizedThirdParty ? " (terceiro autorizado)" : ""}
              </dd>
              <dd>
                {pass.person.documentType} {pass.person.documentNumber}
                {pass.person.nif ? ` · NIF ${pass.person.nif}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Destinatário</dt>
              <dd className="font-medium">{pass.shipment.recipientName}</dd>
              <dd>
                {pass.shipment.code} · {pass.shipment.recipientIsland}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Viagem</dt>
              <dd>
                {pass.voyage.vesselName} · {pass.voyage.code}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Taxas</dt>
              <dd>{pass.exempt ? "Isento" : `Pago ${formatCve(pass.amountPaidCve)}`}</dd>
              <dd>Confirmação: {pass.confirmation === "code" ? "código de levantamento" : "assinatura"}</dd>
            </div>
          </dl>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-900 text-left text-xs uppercase tracking-wide">
                <th className="py-1">Volume</th>
                <th className="py-1">Conteúdo</th>
                <th className="py-1 text-right">Peso</th>
              </tr>
            </thead>
            <tbody>
              {pass.volumes.map((volume) => (
                <tr key={volume.code} className="border-b border-slate-200">
                  <td className="py-1 font-mono">{volume.code}</td>
                  <td className="py-1">{volume.contents ?? "—"}</td>
                  <td className="py-1 text-right">{volume.weightKg !== null ? formatKg(volume.weightKg) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-slate-500">Apresente este Gate Pass à saída do terminal. Os volumes acima foram entregues.</p>
        </section>
      ) : !error ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : null}
    </AppShell>
  );
}
