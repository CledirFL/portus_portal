"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { formatCve } from "@/domain/clearance";
import { ErrorBanner, formatDateTime } from "@/modules/consolidation/components/consolidation-ui";
import { getDeliveryNote, type DeliveryNote } from "@/services/api/cv-agency";
import { useAuthStore } from "@/store/auth-store";

export default function DeliveryNotePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [note, setNote] = useState<DeliveryNote | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getDeliveryNote(id)
      .then(setNote)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar o comprovativo de entrega."));
  }, [user, id]);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between print:hidden!">
        <Link href="/agencia-cv/entregar" className="text-sm text-slate-500 hover:text-slate-700">
          ← Entregar ao destinatário
        </Link>
        {note ? (
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden /> Imprimir
          </Button>
        ) : null}
      </div>
      <ErrorBanner message={error} />
      {note ? (
        <section className="mx-auto max-w-2xl rounded-xl border-2 border-slate-900 bg-white p-6 text-slate-900" data-cy="delivery-note">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">PORTUS · Comprovativo de entrega</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-wider">{note.number}</p>
          <p className="mt-1 text-sm">
            {note.agency ? `${note.agency.name} · ${note.agency.address}, ${note.agency.city} · ` : ""}
            {formatDateTime(note.issuedAt)}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Levantado por</dt>
              <dd className="font-medium">
                {note.person.name}
                {note.withReceipt ? " (com o comprovativo do remetente)" : ""}
              </dd>
              <dd>
                {note.person.documentType} {note.person.documentNumber}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Destinatário</dt>
              <dd className="font-medium">{note.shipment.recipientName}</dd>
              <dd>
                {note.shipment.code} · {note.shipment.recipientIsland}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Remetente</dt>
              <dd>{note.shipment.senderName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Taxas pagas</dt>
              <dd>{formatCve(note.amountPaidCve)}</dd>
            </div>
          </dl>

          <p className="mt-6 text-xs uppercase tracking-wide text-slate-500">Volumes entregues</p>
          <ul className="mt-1 flex flex-wrap gap-2 font-mono text-sm">
            {note.volumes.map((code) => (
              <li key={code} className="rounded border border-slate-300 px-2 py-0.5">
                {code}
              </li>
            ))}
          </ul>

          <div className="mt-10 grid grid-cols-2 gap-6 text-xs text-slate-500">
            <p className="border-t border-slate-400 pt-1">Assinatura de quem levanta</p>
            <p className="border-t border-slate-400 pt-1">Pela agência</p>
          </div>
        </section>
      ) : !error ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : null}
    </AppShell>
  );
}
