"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { OperateOnly } from "@/components/layout/read-only";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { paymentMethodLabels, type PaymentMethod } from "@/domain/status-labels";
import { ApiError } from "@/lib/api-client";
import { payTransport, type Shipment } from "@/services/api/shipments";

const currencies = ["EUR", "USD", "CVE"] as const;
const formatMoney = (amount: number, currency: string) =>
  `${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

/** Viaturas: transporte e seguro pagos na agência de origem, obrigatório antes do contentor e da partida. */
export function TransportPaymentCard({ shipment, onChange }: { shipment: Shipment; onChange: (shipment: Shipment) => void }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof currencies)[number]>("EUR");
  const [method, setMethod] = useState<PaymentMethod>("transfer");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { transport } = shipment;

  return (
    <Card title="Transporte e seguro" subtitle="Pagos na agência antes de a viatura entrar no contentor e no navio.">
      {transport.paid ? (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" data-cy="transport-paid">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> Pago: pode seguir para o contentor.
        </p>
      ) : (
        <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" data-cy="transport-unpaid">
          <AlertTriangle className="h-4 w-4" aria-hidden /> Por pagar: a viatura não entra no contentor.
        </p>
      )}
      {transport.payments.length ? (
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {transport.payments.map((payment) => (
            <li key={payment.id}>
              {new Date(payment.at).toLocaleDateString("pt-PT")} · {paymentMethodLabels[payment.method as PaymentMethod] ?? payment.method} ·{" "}
              <strong>{formatMoney(payment.amount, payment.currency)}</strong>
              {payment.reference ? ` · ${payment.reference}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
      {shipment.status !== "cancelled" ? (
        <OperateOnly>
          <form
            className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2"
            data-cy="transport-payment-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              setError("");
              try {
                onChange(await payTransport(shipment.id, { amount: Number(amount.replace(",", ".")), currency, method, reference: reference || null }));
                setAmount("");
                setReference("");
              } catch (cause) {
                setError([cause instanceof Error ? cause.message : "Não foi possível registar.", ...(cause instanceof ApiError ? cause.issues.map((issue) => issue.message) : [])].join(" "));
              } finally {
                setBusy(false);
              }
            }}
          >
            <Input label="Valor" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
            <Select
              label="Moeda"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as (typeof currencies)[number])}
              options={currencies.map((item) => ({ value: item, label: item }))}
            />
            <Select
              label="Meio"
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              options={(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((key) => ({ value: key, label: paymentMethodLabels[key] }))}
            />
            <Input label="Recibo / referência" value={reference} onChange={(event) => setReference(event.target.value)} />
            {error ? <p className="text-sm text-rose-700 sm:col-span-2">{error}</p> : null}
            <Button type="submit" disabled={busy || !amount.trim()} className="sm:col-span-2">
              Registar pagamento do transporte e seguro
            </Button>
          </form>
        </OperateOnly>
      ) : null}
    </Card>
  );
}
