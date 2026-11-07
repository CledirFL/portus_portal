"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, DoorOpen, Search, UserCheck, X } from "lucide-react";
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
import { ChannelBadge, ClearanceStatusBadge, SignaturePad } from "@/modules/arrivals/components/arrivals-ui";
import { ErrorBanner, formatDateTime, formatKg } from "@/modules/consolidation/components/consolidation-ui";
import { VolumeStatusBadge } from "@/modules/shipments/components/shipment-status";
import {
  authorizeThirdParty,
  documentTypes,
  lookupPickup,
  pickUp,
  registerExemption,
  registerPayment,
  revokeAuthorization,
  type DocumentType,
  type PickupView,
} from "@/services/api/arrivals";

/** Código do volume a partir do QR lido (PORTUS|1|<volume>|…) ou do código escrito. */
const volumeCodeOf = (scanned: string) => (scanned.toUpperCase().startsWith("PORTUS|") ? (scanned.split("|")[2] ?? "") : scanned.trim().toUpperCase());

const issuesOf = (cause: unknown) => (cause instanceof ApiError ? cause.issues.map((issue) => issue.message) : []);

function ChargesCard({ view, onChange }: { view: PickupView; onChange: (view: PickupView) => void }) {
  const [amount, setAmount] = useState(String(view.charges.balanceCve));
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [exemption, setExemption] = useState<string | null>(null);
  const readOnly = useReadOnly();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<PickupView>) => {
    setBusy(true);
    setError("");
    try {
      onChange(await action());
      return true;
    } catch (cause) {
      setError([cause instanceof Error ? cause.message : "Não foi possível registar.", ...issuesOf(cause)].join(" "));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const { charges } = view;
  return (
    <Card title="Taxas" subtitle={`Armazenagem: ${charges.storageDays} dia(s) desde a chegada. Levantamento só com tudo pago ou isenção (BR 21).`}>
      <table className="w-full text-sm" data-cy="charges">
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
      {view.clearance.exemptionReason ? <p className="mt-2 text-sm text-slate-600">Isenção: {view.clearance.exemptionReason}</p> : null}
      {view.payments.length ? (
        <ul className="mt-3 space-y-1 text-xs text-slate-500">
          {view.payments.map((payment) => (
            <li key={payment.id}>
              {formatDateTime(payment.createdAt)} · {paymentMethodLabels[payment.method]} · {formatCve(payment.amountCve)}
              {payment.reference ? ` · ${payment.reference}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}

      {charges.balanceCve > 0 && !readOnly ? (
        <>
          <form
            className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2"
            data-cy="payment-form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(() => registerPayment(view.shipment.id, { amountCve: Number(amount.replace(",", ".")), method, reference: reference || null })).then((ok) => ok && setReference(""));
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
          {exemption === null ? (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setExemption("")}>
              Registar isenção…
            </Button>
          ) : (
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                void run(() => registerExemption(view.shipment.id, exemption)).then((ok) => ok && setExemption(null));
              }}
            >
              <div className="flex-1">
                <Input label="Fundamento da isenção" value={exemption} onChange={(event) => setExemption(event.target.value)} autoFocus />
              </div>
              <Button type="submit" variant="outline" disabled={busy || exemption.trim().length < 5}>
                Confirmar isenção
              </Button>
              <Button type="button" variant="ghost" onClick={() => setExemption(null)}>
                Cancelar
              </Button>
            </form>
          )}
        </>
      ) : null}
    </Card>
  );
}

function AuthorizationsCard({ view, onChange }: { view: PickupView; onChange: (view: PickupView) => void }) {
  const [form, setForm] = useState<{ name: string; nif: string; documentType: DocumentType; documentNumber: string; validUntil: string } | null>(null);
  const readOnly = useReadOnly();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Card title="Terceiros autorizados" subtitle="Quando levanta outra pessoa, a autorização prévia com o NIF do autorizado é obrigatória (BR 19).">
      {view.authorizations.length ? (
        <ul className="mb-3 divide-y divide-slate-100 text-sm" data-cy="authorizations">
          {view.authorizations.map((authorization) => (
            <li key={authorization.id} className="flex items-center justify-between gap-2 py-2">
              <span className={authorization.active ? "" : "text-slate-400 line-through"}>
                {authorization.name} · NIF {authorization.nif} · {authorization.documentType} {authorization.documentNumber} · até{" "}
                {new Date(authorization.validUntil).toLocaleDateString("pt-PT")}
              </span>
              {authorization.active && !readOnly ? (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Revogar ${authorization.name}`}
                  onClick={() => void revokeAuthorization(view.shipment.id, authorization.id).then(onChange).catch(() => undefined)}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="mb-2 text-sm text-rose-700">{error}</p> : null}
      {readOnly ? null : form ? (
        <form
          className="grid gap-2 sm:grid-cols-2"
          data-cy="authorization-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              onChange(await authorizeThirdParty(view.shipment.id, form));
              setForm(null);
            } catch (cause) {
              setError([cause instanceof Error ? cause.message : "Não foi possível registar.", ...issuesOf(cause)].join(" "));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input label="Nome do autorizado" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Input label="NIF do autorizado" inputMode="numeric" value={form.nif} onChange={(event) => setForm({ ...form, nif: event.target.value })} />
          <Select
            label="Documento"
            value={form.documentType}
            onChange={(event) => setForm({ ...form, documentType: event.target.value as DocumentType })}
            options={documentTypes.map((type) => ({ value: type, label: type }))}
          />
          <Input label="Nº do documento" value={form.documentNumber} onChange={(event) => setForm({ ...form, documentNumber: event.target.value.toUpperCase() })} />
          <Input label="Válida até" type="date" value={form.validUntil} onChange={(event) => setForm({ ...form, validUntil: event.target.value })} />
          <div className="flex items-end gap-2">
            <Button type="submit" disabled={busy}>
              Registar autorização
            </Button>
            <Button type="button" variant="ghost" onClick={() => setForm(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setForm({ name: "", nif: "", documentType: "CNI", documentNumber: "", validUntil: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10) })}
        >
          <UserCheck className="h-3.5 w-3.5" aria-hidden /> Autorizar terceiro
        </Button>
      )}
    </Card>
  );
}

function HandOverCard({ view }: { view: PickupView }) {
  const router = useRouter();
  const released = view.volumes.filter((volume) => volume.status === "released");
  const activeAuthorizations = view.authorizations.filter((authorization) => authorization.active);
  const recipient = view.shipment.recipient;
  const [who, setWho] = useState<string>("recipient");
  const [name, setName] = useState(recipient.name);
  const [documentType, setDocumentType] = useState<DocumentType>((documentTypes as readonly string[]).includes(recipient.documentType ?? "") ? (recipient.documentType as DocumentType) : "CNI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [nif, setNif] = useState("");
  const [scanned, setScanned] = useState<string[]>([]);
  const [scan, setScan] = useState("");
  const [method, setMethod] = useState<"code" | "signature">("code");
  const [code, setCode] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const scannedCodes = new Set(scanned.map(volumeCodeOf));

  const choose = (value: string) => {
    setWho(value);
    const authorization = activeAuthorizations.find((item) => item.id === value);
    setName(authorization?.name ?? recipient.name);
    setNif(authorization?.nif ?? "");
    setDocumentType((authorization?.documentType as DocumentType | undefined) ?? "CNI");
    setDocumentNumber("");
  };

  return (
    <Card title="Entregar e emitir Gate Pass" subtitle="Confirme o documento, leia o QR de cada volume e peça o código de levantamento ou a assinatura (BR 18–20).">
      <form
        className="space-y-4"
        data-cy="pickup-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const pass = await pickUp(view.shipment.id, {
              volumes: scanned,
              person: { name, documentType, documentNumber, nif: nif.trim() || null },
              authorizationId: who === "recipient" ? null : who,
              confirmation: method === "code" ? { method: "code", code } : { method: "signature", image: signature ?? "" },
            });
            router.push(`/portaria/gate-pass/${pass.id}`);
          } catch (cause) {
            setError([cause instanceof Error ? cause.message : "Não foi possível entregar.", ...issuesOf(cause)].join(" "));
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Quem levanta"
            value={who}
            onChange={(event) => choose(event.target.value)}
            options={[
              { value: "recipient", label: `Destinatário: ${recipient.name}` },
              ...activeAuthorizations.map((authorization) => ({ value: authorization.id, label: `Autorizado: ${authorization.name}` })),
            ]}
          />
          <Input label="Nome" value={name} onChange={(event) => setName(event.target.value)} />
          <Select label="Documento apresentado" value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)} options={documentTypes.map((type) => ({ value: type, label: type }))} />
          <Input
            label="Nº do documento"
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value.toUpperCase())}
            hint={who === "recipient" && recipient.documentNumber ? "Tem de coincidir com o registado na encomenda." : undefined}
          />
          <Input label={who === "recipient" ? "NIF (opcional)" : "NIF do autorizado"} inputMode="numeric" value={nif} onChange={(event) => setNif(event.target.value)} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Volumes entregues</p>
          <div className="flex gap-2">
            <Input
              aria-label="QR do volume a entregar"
              placeholder="Leia o QR de cada volume"
              value={scan}
              onChange={(event) => setScan(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const value = scan.trim();
                if (value && !scannedCodes.has(volumeCodeOf(value))) setScanned((current) => [...current, value]);
                setScan("");
              }}
              className="font-mono"
            />
          </div>
          <ul className="mt-2 space-y-1 text-sm" data-cy="handover-volumes">
            {released.map((volume) => (
              <li key={volume.id} className="flex items-center gap-2">
                {scannedCodes.has(volume.code) ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-slate-300" aria-hidden />
                )}
                <span className="font-mono">{volume.code}</span>
                <span className="text-slate-500">
                  {formatKg(volume.weightKg)}
                  {volume.warehouseLocation ? ` · ${volume.warehouseLocation}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Confirmação</p>
          <div className="mb-2 inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist">
            {(["code", "signature"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={method === option}
                onClick={() => setMethod(option)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${method === option ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"}`}
              >
                {option === "code" ? "Código de levantamento" : "Assinatura"}
              </button>
            ))}
          </div>
          {method === "code" ? (
            <Input aria-label="Código de levantamento" placeholder="LEV-XXXXXX" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="font-mono" />
          ) : (
            <SignaturePad onChange={setSignature} />
          )}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={busy || scanned.length === 0 || !documentNumber || (method === "code" ? !code : !signature)}
        >
          <DoorOpen className="h-4 w-4" aria-hidden /> Entregar {scanned.length} volume(s) e emitir Gate Pass
        </Button>
      </form>
    </Card>
  );
}

export default function GatePage() {
  const readOnly = useReadOnly();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<PickupView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const search = async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    setError("");
    try {
      setView(await lookupPickup(text.trim()));
    } catch (cause) {
      setView(null);
      setError(cause instanceof Error ? cause.message : "Não foi possível procurar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader title="Levantamentos" description="Procure pelo código de levantamento, pelo QR de um volume ou pelo código da encomenda." />

      <form
        className="mb-6 flex max-w-2xl gap-2"
        data-cy="pickup-lookup"
        onSubmit={(event) => {
          event.preventDefault();
          void search(query);
        }}
      >
        <Input ref={input} aria-label="Código de levantamento, QR ou encomenda" placeholder="LEV-7KQ2M9 · QR · ENC-…" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus className="font-mono" />
        <Button type="submit" disabled={busy}>
          <Search className="h-4 w-4" aria-hidden /> Procurar
        </Button>
      </form>

      <ErrorBanner message={error} />

      {view ? (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{view.shipment.recipient.name}</p>
                <p className="text-sm text-slate-500">
                  {view.shipment.code} · {view.shipment.description} · {view.voyage.vesselName} ({view.voyage.code})
                </p>
                <p className="text-xs text-slate-500">
                  {view.shipment.recipient.documentType ?? "Documento"} {view.shipment.recipient.documentNumber ?? "não registado"} · NIF{" "}
                  {view.shipment.recipient.nif ?? "—"} · {view.shipment.recipient.phone}
                </p>
              </div>
              <div className="flex gap-2">
                <ChannelBadge channel={view.clearance.channel} />
                <ClearanceStatusBadge status={view.clearance.status} />
              </div>
            </div>
            {view.blockers.length ? (
              <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" data-cy="blockers">
                {view.blockers.map((blocker) => (
                  <li key={blocker} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {blocker}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" data-cy="ready">
                <CheckCircle2 className="h-4 w-4" aria-hidden /> Pronta a levantar.
              </p>
            )}
            <ul className="mt-3 flex flex-wrap gap-2 text-xs">
              {view.volumes.map((volume) => (
                <li key={volume.id} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
                  <span className="font-mono">{volume.code}</span>
                  {volume.warehouseLocation ? <span className="text-slate-500">{volume.warehouseLocation}</span> : null}
                  <VolumeStatusBadge status={volume.status} />
                </li>
              ))}
            </ul>
            {view.pickups.length ? (
              <ul className="mt-3 space-y-1 text-sm">
                {view.pickups.map((pickup) => (
                  <li key={pickup.id}>
                    <Link href={`/portaria/gate-pass/${pickup.id}`} className="font-mono text-brand-700 hover:text-brand-800">
                      {pickup.gatePassNumber}
                    </Link>{" "}
                    · {pickup.personName} · {pickup.volumeCodes.length} volume(s) · {formatDateTime(pickup.issuedAt)}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              {view.clearance.status === "released" ? <ChargesCard key={view.charges.balanceCve} view={view} onChange={setView} /> : null}
              <AuthorizationsCard view={view} onChange={setView} />
            </div>
            {view.canPickUp && !readOnly ? <HandOverCard key={view.shipment.id + view.authorizations.length} view={view} /> : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
