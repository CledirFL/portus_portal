"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Send, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { type VehicleCurrency, vehicleCurrencies, vehicleDocumentLabels } from "@/domain/vehicle-taxes";
import { ApiError } from "@/lib/api-client";
import {
  ClearanceStatusBadge,
  ClearanceSteps,
  DocumentList,
  DocumentStatusBadge,
  DutiesCard,
  EventList,
  OutcomeList,
  VehicleSummary,
} from "@/modules/vehicles/clearance-parts";
import {
  declareMyClearance,
  getMyClearance,
  openMyClearance,
  removeMyDocument,
  submitMyClearance,
  uploadMyDocument,
  type VehicleClearance,
} from "@/services/api/vehicle-clearance";
import { listVehicleRegimes, type VehicleRegime } from "@/services/api/vehicles";
import { useAuthStore } from "@/store/auth-store";

const messageOf = (cause: unknown, fallback: string) =>
  [cause instanceof Error ? cause.message : fallback, ...(cause instanceof ApiError ? cause.issues.map((issue) => issue.message) : [])].join(" ");

function DeclarationForm({ clearance, regimes, onSaved }: { clearance: VehicleClearance; regimes: VehicleRegime[]; onSaved: (clearance: VehicleClearance) => void }) {
  const [values, setValues] = useState({
    regime: clearance.regime,
    valueAmount: String(clearance.value.amount || ""),
    valueCurrency: clearance.value.currency,
    transportAmount: String(clearance.transport.amount || ""),
    transportCurrency: clearance.transport.currency,
    insuranceAmount: String(clearance.insurance.amount || ""),
    insuranceCurrency: clearance.insurance.currency,
  });
  const currencyOptions = vehicleCurrencies.map((currency) => ({ value: currency, label: currency }));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const toNumber = (value: string) => Number(value.replace(",", ".") || "0");

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      data-cy="vehicle-declaration"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          onSaved(
            await declareMyClearance(clearance.shipmentId, {
              regime: values.regime,
              valueAmount: toNumber(values.valueAmount),
              valueCurrency: values.valueCurrency,
              transportAmount: toNumber(values.transportAmount),
              transportCurrency: values.transportCurrency,
              insuranceAmount: toNumber(values.insuranceAmount),
              insuranceCurrency: values.insuranceCurrency,
            }),
          );
          setMessage("Guardado.");
        } catch (cause) {
          setMessage(messageOf(cause, "Não foi possível guardar."));
        } finally {
          setBusy(false);
        }
      }}
    >
      <Select
        label="Uso da viatura (regime)"
        value={values.regime}
        onChange={(event) => setValues({ ...values, regime: event.target.value })}
        options={regimes.map((regime) => ({ value: regime.code, label: regime.label }))}
      />
      <div />
      {(
        [
          ["value", "Valor de compra"],
          ["transport", "Valor do transporte"],
          ["insurance", "Valor do seguro"],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className="grid grid-cols-[1fr_6rem] gap-2 sm:col-span-2">
          <Input label={label} inputMode="decimal" value={values[`${key}Amount`]} onChange={(event) => setValues({ ...values, [`${key}Amount`]: event.target.value })} />
          <Select
            label="Moeda"
            value={values[`${key}Currency`]}
            onChange={(event) => setValues({ ...values, [`${key}Currency`]: event.target.value as VehicleCurrency })}
            options={currencyOptions}
          />
        </div>
      ))}
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" variant="outline" disabled={busy}>
          Guardar declaração
        </Button>
        {message ? <span className="text-sm text-slate-600">{message}</span> : null}
      </div>
    </form>
  );
}

function UploadButton({ clearance, type, onUploaded }: { clearance: VehicleClearance; type: string; onUploaded: (clearance: VehicleClearance) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <span className="inline-flex flex-col items-end">
      <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 ${busy ? "opacity-60" : ""}`}>
        <Upload className="h-3.5 w-3.5" aria-hidden /> {busy ? "A enviar…" : "Enviar"}
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="sr-only"
          data-cy={`upload-${type}`}
          disabled={busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setBusy(true);
            setError("");
            try {
              onUploaded(await uploadMyDocument(clearance.shipmentId, type, file));
            } catch (cause) {
              setError(messageOf(cause, "Não foi possível enviar."));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {error ? <span className="mt-1 text-xs text-rose-700">{error}</span> : null}
    </span>
  );
}

export default function MyVehicleClearancePage() {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const user = useAuthStore((state) => state.user);
  const [clearance, setClearance] = useState<VehicleClearance | null>(null);
  const [notOpened, setNotOpened] = useState(false);
  const [regimes, setRegimes] = useState<VehicleRegime[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    listVehicleRegimes()
      .then(setRegimes)
      .catch(() => undefined);
    getMyClearance(shipmentId)
      .then(setClearance)
      .catch((cause: unknown) => {
        if (cause instanceof ApiError && cause.status === 404 && /Ainda não abriu/.test(cause.message)) setNotOpened(true);
        else setError(cause instanceof Error ? cause.message : "Não foi possível carregar.");
      });
  }, [user, shipmentId]);

  const act = async (action: () => Promise<VehicleClearance>) => {
    setBusy(true);
    setError("");
    try {
      setClearance(await action());
      setNotOpened(false);
    } catch (cause) {
      setError(messageOf(cause, "Não foi possível continuar."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        backHref="/cliente/viaturas"
        title={clearance ? clearance.vehicle : "Desalfandegamento da viatura"}
        description={clearance ? `Encomenda ${clearance.shipmentCode}` : undefined}
        actions={clearance ? <ClearanceStatusBadge status={clearance.status} /> : undefined}
      />

      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" data-cy="clearance-error">
          {error}
        </div>
      ) : null}

      {notOpened ? (
        <Card title="Desalfandegue a sua viatura no Portus" className="max-w-2xl">
          <div className="space-y-3 text-sm text-slate-700">
            <p>Faz-se em poucos passos, sem despachante:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>confirma o uso da viatura e os valores (compra, transporte, seguro) e envia os documentos;</li>
              <li>a Alfândega analisa e liquida os direitos;</li>
              <li>o técnico da DGTR faz a inspeção técnica no porto;</li>
              <li>paga os direitos e a DGTR emite a matrícula;</li>
              <li>levanta a viatura na portaria do porto.</li>
            </ol>
            <Button disabled={busy} onClick={() => void act(() => openMyClearance(shipmentId))}>
              Começar o desalfandegamento
            </Button>
          </div>
        </Card>
      ) : !clearance ? (
        error ? null : <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            {clearance.status === "changes_requested" && clearance.reviewNote ? (
              <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-cy="review-note">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> A Alfândega pediu correções: {clearance.reviewNote}
              </p>
            ) : null}
            {clearance.status === "registered" && clearance.pickupCode ? (
              <p className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" data-cy="vehicle-ready">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  Matrícula <strong className="font-mono">{clearance.plateNumber}</strong>. Levante a viatura na portaria do porto com o código{" "}
                  <strong className="font-mono">{clearance.pickupCode}</strong> e o seu documento; pague lá as taxas do porto.
                </span>
              </p>
            ) : null}

            <Card title="Viatura e declaração">
              <VehicleSummary clearance={clearance} />
              {clearance.canEdit ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <DeclarationForm key={clearance.events.length} clearance={clearance} regimes={regimes} onSaved={setClearance} />
                </div>
              ) : null}
            </Card>

            <Card title="Documentos" subtitle="PDF ou fotografia (JPEG, PNG), até 5 MB cada. A Alfândega aceita ou recusa cada um.">
              <ul className="mb-4 divide-y divide-slate-100" data-cy="required-documents">
                {clearance.requiredDocuments.map((item) => (
                  <li key={item.type} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>{item.label}</span>
                    <span className="flex items-center gap-2">
                      <DocumentStatusBadge status={item.status} />
                      {clearance.canEdit && item.status !== "accepted" ? <UploadButton clearance={clearance} type={item.type} onUploaded={setClearance} /> : null}
                    </span>
                  </li>
                ))}
                {clearance.canEdit ? (
                  <li className="flex items-center justify-between gap-3 py-2 text-sm text-slate-500">
                    <span>{vehicleDocumentLabels.other} (opcional)</span>
                    <UploadButton clearance={clearance} type="other" onUploaded={setClearance} />
                  </li>
                ) : null}
              </ul>
              <DocumentList
                clearance={clearance}
                actions={(document) =>
                  clearance.canEdit && document.status !== "accepted" ? (
                    <Button size="sm" variant="ghost" aria-label={`Retirar ${document.fileName}`} onClick={() => void act(() => removeMyDocument(clearance.shipmentId, document.id))}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  ) : null
                }
              />
              {clearance.canEdit ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <Button disabled={busy} onClick={() => void act(() => submitMyClearance(clearance.shipmentId))} data-cy="submit-clearance">
                    <Send className="h-4 w-4" aria-hidden /> Submeter à Alfândega
                  </Button>
                </div>
              ) : null}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Passos">
              <ClearanceSteps clearance={clearance} />
              <div className="mt-4">
                <OutcomeList clearance={clearance} />
              </div>
            </Card>
            <DutiesCard clearance={clearance} />
            <Card title="Histórico">
              <EventList clearance={clearance} />
            </Card>
            <p className="text-xs text-slate-500">
              Dúvidas? Veja os <Link href="/cliente" className="text-brand-700">seus pedidos</Link> ou fale com a agência.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
