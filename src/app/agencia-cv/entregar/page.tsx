"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, DoorOpen, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useReadOnly } from "@/components/layout/read-only";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { formatCve } from "@/domain/clearance";
import { paymentMethodLabels, type PaymentMethod } from "@/domain/status-labels";
import { ApiError } from "@/lib/api-client";
import { ErrorBanner, formatDateTime, formatKg } from "@/modules/consolidation/components/consolidation-ui";
import { VolumeStatusBadge } from "@/modules/shipments/components/shipment-status";
import { documentTypes, type DocumentType } from "@/services/api/arrivals";
import { deliverAtAgency, lookupAgencyShipment, payAtAgency, type AgencyShipmentDetail } from "@/services/api/cv-agency";
import { useAuthStore } from "@/store/auth-store";

const messageOf = (cause: unknown, fallback: string) =>
  [cause instanceof Error ? cause.message : fallback, ...(cause instanceof ApiError ? cause.issues.map((issue) => issue.message) : [])].join(" ");

/** Código de levantamento lido do QR do comprovativo (PORTUS|LEV|<encomenda>|<código>) ou escrito. */
const pickupCodeOf = (scanned: string) => {
  const text = scanned.trim().toUpperCase();
  if (text.startsWith("PORTUS|LEV|")) return text.split("|")[3] ?? "";
  return /^LEV-[A-Z0-9]+$/.test(text) ? text : "";
};

const documentTypeOf = (value: string | null): DocumentType =>
  (documentTypes as readonly string[]).includes(value ?? "") ? (value as DocumentType) : "CNI";

function ChargesCard({ view, onChange }: { view: AgencyShipmentDetail; onChange: (view: AgencyShipmentDetail) => void }) {
  const charges = view.charges!;
  const [amount, setAmount] = useState(String(charges.balanceCve));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const readOnly = useReadOnly();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Card title="Taxas" subtitle="Tarifas gerais e direitos fixados pela Alfândega. A entrega só é possível com tudo pago.">
      <table className="w-full text-sm" data-cy="agency-charges">
        <tbody>
          {charges.lines.map((line) => (
            <tr key={line.code} className="border-b border-slate-100">
              <td className="py-1.5 text-slate-600">
                {line.label}
                {line.quantity > 1 ? <span className="text-slate-400"> × {line.quantity}</span> : null}
              </td>
              <td className="py-1.5 text-right tabular-nums">{formatCve(line.amountCve)}</td>
            </tr>
          ))}
          <tr>
            <td className="pt-2 font-medium">Total</td>
            <td className="pt-2 text-right font-medium tabular-nums">{formatCve(charges.totalCve)}</td>
          </tr>
          <tr>
            <td className="text-slate-600">Pago</td>
            <td className="text-right tabular-nums text-slate-600">{formatCve(charges.paidCve)}</td>
          </tr>
          <tr>
            <td className="font-semibold">Em dívida</td>
            <td className={`text-right font-semibold tabular-nums ${charges.balanceCve > 0 ? "text-rose-700" : "text-emerald-700"}`}>
              {charges.exempt ? "Isento" : formatCve(charges.balanceCve)}
            </td>
          </tr>
        </tbody>
      </table>
      {view.payments.length ? (
        <ul className="mt-3 space-y-1 text-xs text-slate-500">
          {view.payments.map((payment) => (
            <li key={payment.at}>
              {formatDateTime(payment.at)} · {paymentMethodLabels[payment.method]} · {formatCve(payment.amountCve)}
              {payment.reference ? ` · ${payment.reference}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      {charges.balanceCve > 0 && !readOnly ? (
        <form
          className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2"
          data-cy="agency-payment"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              onChange(await payAtAgency(view.id, { amountCve: Number(amount.replace(",", ".")), method, reference: reference || undefined }));
            } catch (cause) {
              setError(messageOf(cause, "Não foi possível registar o pagamento."));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input label="Valor (CVE)" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <Select
            label="Meio"
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            options={(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((key) => ({ value: key, label: paymentMethodLabels[key] }))}
          />
          <Input label="Recibo / referência" value={reference} onChange={(event) => setReference(event.target.value)} />
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full">
              Registar pagamento
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}

function HandOverCard({ view, scannedCode }: { view: AgencyShipmentDetail; scannedCode: string }) {
  const router = useRouter();
  const { recipient } = view;
  const [mode, setMode] = useState<"recipient" | "receipt">(scannedCode ? "receipt" : "recipient");
  const [name, setName] = useState(scannedCode ? "" : recipient.name);
  const [documentType, setDocumentType] = useState<DocumentType>(scannedCode ? "CNI" : documentTypeOf(recipient.documentType));
  const [documentNumber, setDocumentNumber] = useState("");
  const [nif, setNif] = useState("");
  const [pickupCode, setPickupCode] = useState(scannedCode);
  const [recipientDocument, setRecipientDocument] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const choose = (next: "recipient" | "receipt") => {
    setMode(next);
    setName(next === "recipient" ? recipient.name : "");
    setDocumentType(next === "recipient" ? documentTypeOf(recipient.documentType) : "CNI");
    setDocumentNumber("");
    setNif("");
    setError("");
  };

  const ready = name.trim() && documentNumber.trim() && (mode === "recipient" || (pickupCode.trim() && recipientDocument.trim()));

  return (
    <Card title="Entregar" subtitle="Confirme quem levanta. Fica registado na encomenda e é emitido o comprovativo de entrega.">
      <form
        className="space-y-4"
        data-cy="agency-deliver"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const person = { name, documentType, documentNumber };
            const note = await deliverAtAgency(
              view.id,
              mode === "recipient" ? { mode, person: { ...person, nif: nif.trim() || null } } : { mode, pickupCode, recipientDocument, person },
            );
            router.push(`/agencia-cv/entregas/${note.id}`);
          } catch (cause) {
            setError(messageOf(cause, "Não foi possível entregar."));
            setBusy(false);
          }
        }}
      >
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist">
          {(["recipient", "receipt"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={mode === option}
              onClick={() => choose(option)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === option ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              {option === "recipient" ? "O destinatário" : "Outra pessoa, com o comprovativo"}
            </button>
          ))}
        </div>

        {mode === "receipt" ? (
          <div className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
            <Input
              label="Código do comprovativo"
              placeholder="LEV-XXXXXX"
              value={pickupCode}
              onChange={(event) => setPickupCode(event.target.value.toUpperCase())}
              className="font-mono"
              hint="Está no comprovativo que o remetente recebeu."
            />
            <Input
              label="Documento do destinatário"
              value={recipientDocument}
              onChange={(event) => setRecipientDocument(event.target.value.toUpperCase())}
              hint={`Nº do documento ou NIF de ${recipient.name}.`}
            />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label={mode === "recipient" ? "Nome" : "Nome de quem levanta"} value={name} onChange={(event) => setName(event.target.value)} />
          <Select
            label="Documento apresentado"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value as DocumentType)}
            options={documentTypes.map((type) => ({ value: type, label: type }))}
          />
          <Input
            label="Nº do documento"
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value.toUpperCase())}
            hint={mode === "recipient" ? "O nº do documento ou o NIF tem de coincidir com o registado na encomenda." : undefined}
          />
          {mode === "recipient" ? (
            <Input label="NIF (opcional)" inputMode="numeric" value={nif} onChange={(event) => setNif(event.target.value)} />
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={busy || !ready}>
          <DoorOpen className="h-4 w-4" aria-hidden /> Entregar {view.volumes.filter((volume) => volume.status === "at_agency").length} volume(s)
        </Button>
      </form>
    </Card>
  );
}

function DeliverView() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const user = useAuthStore((state) => state.user);
  const readOnly = useReadOnly();
  const [query, setQuery] = useState(initial);
  const [scannedCode, setScannedCode] = useState(pickupCodeOf(initial));
  const [view, setView] = useState<AgencyShipmentDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Aberta a partir da lista ("Entregar"): procura logo a encomenda.
  useEffect(() => {
    if (!user || !initial) return;
    lookupAgencyShipment(initial)
      .then(setView)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível procurar."));
  }, [user, initial]);

  const search = async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      setView(await lookupAgencyShipment(text.trim()));
      setScannedCode(pickupCodeOf(text));
    } catch (cause) {
      setView(null);
      setError(cause instanceof Error ? cause.message : "Não foi possível procurar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Entregar ao destinatário"
        description="Leia o QR do comprovativo ou escreva o código de levantamento, o código da encomenda ou de um volume."
        actions={
          <Link href="/agencia-cv" className="text-sm text-slate-500 hover:text-slate-700">
            ← Encomendas a entregar
          </Link>
        }
      />

      <form
        className="mb-6 flex max-w-2xl gap-2"
        data-cy="agency-lookup"
        onSubmit={(event) => {
          event.preventDefault();
          void search(query);
        }}
      >
        <Input aria-label="Código de levantamento, QR ou encomenda" placeholder="LEV-… · QR · ENC-…" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus className="font-mono" />
        <Button type="submit" disabled={busy}>
          <Search className="h-4 w-4" aria-hidden /> Procurar
        </Button>
      </form>

      <ErrorBanner message={error} />

      {view ? (
        <div className="space-y-6">
          <Card>
            <div>
              <p className="text-lg font-semibold text-slate-900" data-cy="agency-recipient">
                {view.recipient.name}
              </p>
              <p className="text-sm text-slate-500">
                {view.code} · de {view.sender.name} · {view.recipient.island}
              </p>
              <p className="text-xs text-slate-500">
                {view.recipient.documentType ?? "Documento"} {view.recipient.documentNumber ?? "não registado"} · NIF {view.recipient.nif ?? "—"} · {view.recipient.phone}
              </p>
            </div>
            {view.blockers.length ? (
              <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" data-cy="agency-blockers">
                {view.blockers.map((blocker) => (
                  <li key={blocker} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {blocker}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" data-cy="agency-ready">
                <CheckCircle2 className="h-4 w-4" aria-hidden /> Pronta a entregar.
              </p>
            )}
            <ul className="mt-3 flex flex-wrap gap-2 text-xs">
              {view.volumes.map((volume) => (
                <li key={volume.code} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
                  <span className="font-mono">{volume.code}</span>
                  <span className="text-slate-500">{formatKg(volume.weightKg)}</span>
                  <VolumeStatusBadge status={volume.status} />
                </li>
              ))}
            </ul>
            {view.deliveries.length ? (
              <ul className="mt-3 space-y-1 text-sm">
                {view.deliveries.map((delivery) => (
                  <li key={delivery.id}>
                    <Link href={`/agencia-cv/entregas/${delivery.id}`} className="font-mono text-brand-700 hover:text-brand-800">
                      {delivery.number}
                    </Link>{" "}
                    · {delivery.personName}
                    {delivery.withReceipt ? " (com comprovativo)" : ""} · {formatDateTime(delivery.at)}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {view.charges ? <ChargesCard key={view.charges.balanceCve} view={view} onChange={setView} /> : <div />}
            {view.canDeliver && !readOnly ? <HandOverCard key={view.id + scannedCode} view={view} scannedCode={scannedCode} /> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function DeliverPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="py-10 text-center text-sm text-slate-500">A carregar…</p>}>
        <DeliverView />
      </Suspense>
    </AppShell>
  );
}
