"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { formatCve, type TariffRule } from "@/domain/clearance";
import { ErrorBanner } from "@/modules/consolidation/components/consolidation-ui";
import {
  type AbandonmentSettings,
  getAbandonmentSettings,
  listTariffs,
  runAbandonmentCheck,
  updateAbandonmentSettings,
  updateTariff,
} from "@/services/api/arrivals";
import { VehicleRegimesForms, VehicleTaxSettingsForm } from "@/modules/admin/vehicle-settings";
import { useAuthStore } from "@/store/auth-store";

const unitLabels = {
  per_volume: "Por volume.",
  per_volume_day: "Por volume e por dia, depois dos dias grátis (BR 25).",
  per_shipment: "Uma vez por encomenda.",
} as const;
const categoryNames: Record<string, string> = { veiculo: "viaturas" };

function TariffForm({ tariff, onSaved }: { tariff: TariffRule; onSaved: (tariffs: TariffRule[]) => void }) {
  const [amount, setAmount] = useState(String(tariff.amountCve));
  const [freeDays, setFreeDays] = useState(String(tariff.freeDays));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const daily = tariff.unit === "per_volume_day";

  return (
    <Card
      title={tariff.label}
      subtitle={`${unitLabels[tariff.unit]}${tariff.categories?.length ? ` Só ${tariff.categories.map((category) => categoryNames[category] ?? category).join(", ")}.` : ""}`}
    >
      <form
        className="grid gap-3 sm:grid-cols-3 sm:items-start"
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
        {/* Ao nível dos campos: a etiqueta acima deles ocupa 1,625rem. */}
        <div className="flex items-center gap-3 sm:pt-[1.625rem]">
          <Button type="submit" disabled={busy}>
            Guardar
          </Button>
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
        </div>
      </form>
    </Card>
  );
}

function AbandonmentForm() {
  const [settings, setSettings] = useState<AbandonmentSettings | null>(null);
  const [afterDays, setAfterDays] = useState("");
  const [warningDays, setWarningDays] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAbandonmentSettings()
      .then((current) => {
        setSettings(current);
        setAfterDays(String(current.afterDays));
        setWarningDays(String(current.warningDays));
      })
      .catch((cause: unknown) => setMessage(cause instanceof Error ? cause.message : "Não foi possível carregar o prazo."));
  }, []);

  return (
    <Card
      title="Prazo de abandono"
      subtitle="Carga liberada e não levantada passa a Abandonada depois destes dias, contados da chegada do navio (BR 25). O remetente é avisado por email antes."
    >
      <form
        data-cy="abandonment-form"
        className="grid gap-3 sm:grid-cols-3 sm:items-end"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            setSettings(await updateAbandonmentSettings({ afterDays: Number(afterDays), warningDays: Number(warningDays) }));
            setMessage("Guardado.");
          } catch (cause) {
            setMessage(cause instanceof Error ? cause.message : "Não foi possível guardar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Input label="Dias até ao abandono" inputMode="numeric" value={afterDays} onChange={(event) => setAfterDays(event.target.value)} />
        <Input label="Avisar quantos dias antes" inputMode="numeric" value={warningDays} onChange={(event) => setWarningDays(event.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={busy || !settings}>
            Guardar
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const result = await runAbandonmentCheck();
                setMessage(`Verificado: ${result.warned} aviso(s) enviados, ${result.abandoned} encomenda(s) abandonada(s).`);
              } catch (cause) {
                setMessage(cause instanceof Error ? cause.message : "Não foi possível verificar.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Verificar agora
          </Button>
        </div>
      </form>
      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
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
        description="Valores cobrados na portaria antes do levantamento (RF-A25), regimes e impostos das viaturas. Os direitos aduaneiros são fixados pela Alfândega em cada encomenda."
      />
      <ErrorBanner message={error} />
      {tariffs ? (
        <div className="grid max-w-3xl gap-4">
          {tariffs.map((tariff) => (
            <TariffForm key={`${tariff.code}-${tariff.amountCve}-${tariff.freeDays}`} tariff={tariff} onSaved={setTariffs} />
          ))}
          <AbandonmentForm />
          <h2 className="mt-6 text-lg font-semibold text-slate-900">Viaturas</h2>
          <VehicleTaxSettingsForm />
          <VehicleRegimesForms />
        </div>
      ) : !error ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : null}
    </AppShell>
  );
}
