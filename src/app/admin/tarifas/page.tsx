"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { formatCve, type TariffRule } from "@/domain/clearance";
import { ErrorBanner } from "@/modules/consolidation/components/consolidation-ui";
import { listTariffs, updateTariff } from "@/services/api/arrivals";
import { useAuthStore } from "@/store/auth-store";

function TariffForm({ tariff, onSaved }: { tariff: TariffRule; onSaved: (tariffs: TariffRule[]) => void }) {
  const [amount, setAmount] = useState(String(tariff.amountCve));
  const [freeDays, setFreeDays] = useState(String(tariff.freeDays));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const daily = tariff.unit === "per_volume_day";

  return (
    <Card title={tariff.label} subtitle={daily ? "Por volume e por dia, depois dos dias grátis (BR 25)." : "Por volume."}>
      <form
        className="grid gap-3 sm:grid-cols-3 sm:items-end"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            onSaved(await updateTariff(tariff.code, { amountCve: Number(amount.replace(",", ".")), freeDays: daily ? Number(freeDays) : 0 }));
            setMessage("Guardado.");
          } catch (cause) {
            setMessage(cause instanceof Error ? cause.message : "Não foi possível guardar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Input label="Valor (CVE)" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} hint={`Atual: ${formatCve(tariff.amountCve)}`} />
        {daily ? <Input label="Dias grátis" inputMode="numeric" value={freeDays} onChange={(event) => setFreeDays(event.target.value)} /> : <div />}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            Guardar
          </Button>
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
        </div>
      </form>
    </Card>
  );
}

export default function TariffsPage() {
  const user = useAuthStore((state) => state.user);
  const [tariffs, setTariffs] = useState<TariffRule[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    listTariffs()
      .then(setTariffs)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar as tarifas."));
  }, [user]);

  return (
    <AppShell>
      <PageHeader
        title="Tarifas"
        description="Valores cobrados na portaria antes do levantamento (RF-A25). Os direitos aduaneiros são fixados pela Alfândega em cada encomenda."
      />
      <ErrorBanner message={error} />
      {tariffs ? (
        <div className="grid max-w-3xl gap-4">
          {tariffs.map((tariff) => (
            <TariffForm key={`${tariff.code}-${tariff.amountCve}-${tariff.freeDays}`} tariff={tariff} onSaved={setTariffs} />
          ))}
        </div>
      ) : !error ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : null}
    </AppShell>
  );
}
