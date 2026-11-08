"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { vehicleDocumentLabels, vehicleDocumentTypes, type VehicleTaxSettings } from "@/domain/vehicle-taxes";
import { ApiError } from "@/lib/api-client";
import { getVehicleTaxSettings, listVehicleRegimes, updateVehicleRegime, updateVehicleTaxSettings, type VehicleRegime } from "@/services/api/vehicles";

const fuels = ["Gasolina", "Gasóleo", "Híbrido", "Elétrico", "GPL"];
const toNumber = (value: string) => Number(value.replace(",", "."));
const messageOf = (cause: unknown, fallback: string) =>
  [cause instanceof Error ? cause.message : fallback, ...(cause instanceof ApiError ? cause.issues.map((issue) => issue.message) : [])].join(" ");

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

/** Câmbio, IVA, taxa comunitária, taxa específica do ICE e escalões do ICE por idade. */
export function VehicleTaxSettingsForm() {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [tiers, setTiers] = useState<Array<{ maxAgeYears: string; ratePct: string }>>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = (settings: VehicleTaxSettings) => {
    setValues({
      eurToCve: String(settings.eurToCve),
      vatPct: String(settings.vatPct),
      communityTaxPct: String(settings.communityTaxPct),
      specificIceCve: String(settings.specificIceCve),
      specificIceMaxAgeYears: String(settings.specificIceMaxAgeYears),
    });
    setTiers(settings.iceTiers.map((tier) => ({ maxAgeYears: tier.maxAgeYears === null ? "" : String(tier.maxAgeYears), ratePct: String(tier.ratePct) })));
  };

  useEffect(() => {
    getVehicleTaxSettings()
      .then(load)
      .catch((cause: unknown) => setMessage(messageOf(cause, "Não foi possível carregar os impostos de viaturas.")));
  }, []);

  if (!values) return message ? <p className="text-sm text-rose-700">{message}</p> : null;
  const set = (key: string, value: string) => setValues({ ...values, [key]: value });

  return (
    <Card
      title="Impostos de viaturas"
      subtitle="Usados na estimativa que o cliente vê e na liquidação da Alfândega (que os pode ajustar). Mudam com o Orçamento do Estado: confirme os valores todos os anos."
    >
      <form
        className="space-y-4"
        data-cy="vehicle-tax-settings"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            load(
              await updateVehicleTaxSettings({
                eurToCve: toNumber(values.eurToCve!),
                vatPct: toNumber(values.vatPct!),
                communityTaxPct: toNumber(values.communityTaxPct!),
                specificIceCve: toNumber(values.specificIceCve!),
                specificIceMaxAgeYears: toNumber(values.specificIceMaxAgeYears!),
                iceTiers: tiers.map((tier, index) => ({
                  maxAgeYears: index === tiers.length - 1 || tier.maxAgeYears.trim() === "" ? null : toNumber(tier.maxAgeYears),
                  ratePct: toNumber(tier.ratePct),
                })),
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
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Câmbio do euro (CVE)" inputMode="decimal" value={values.eurToCve} onChange={(event) => set("eurToCve", event.target.value)} />
          <Input label="IVA (%)" inputMode="decimal" value={values.vatPct} onChange={(event) => set("vatPct", event.target.value)} />
          <Input label="Taxa comunitária (%)" inputMode="decimal" value={values.communityTaxPct} onChange={(event) => set("communityTaxPct", event.target.value)} />
          <Input label="Taxa específica do ICE (CVE)" inputMode="decimal" value={values.specificIceCve} onChange={(event) => set("specificIceCve", event.target.value)} />
          <Input
            label="Taxa específica: usadas até (anos)"
            inputMode="numeric"
            value={values.specificIceMaxAgeYears}
            onChange={(event) => set("specificIceMaxAgeYears", event.target.value)}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">ICE por idade da viatura</p>
          <ul className="space-y-2">
            {tiers.map((tier, index) => {
              const last = index === tiers.length - 1;
              return (
                <li key={index} className="flex flex-wrap items-end gap-2">
                  <div className="w-44">
                    <Input
                      label={last ? "Idade" : "Até (anos)"}
                      inputMode="numeric"
                      value={last ? "mais velhas" : tier.maxAgeYears}
                      disabled={last}
                      onChange={(event) => setTiers(tiers.map((item, at) => (at === index ? { ...item, maxAgeYears: event.target.value } : item)))}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      label="ICE (%)"
                      inputMode="decimal"
                      value={tier.ratePct}
                      onChange={(event) => setTiers(tiers.map((item, at) => (at === index ? { ...item, ratePct: event.target.value } : item)))}
                    />
                  </div>
                  {tiers.length > 1 ? (
                    <Button type="button" variant="ghost" size="sm" aria-label="Retirar escalão" onClick={() => setTiers(tiers.filter((_, at) => at !== index))}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setTiers([...tiers.slice(0, -1), { maxAgeYears: "", ratePct: "" }, ...tiers.slice(-1)])}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Escalão
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            Guardar impostos
          </Button>
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
        </div>
      </form>
    </Card>
  );
}

function RegimeForm({ regime }: { regime: VehicleRegime }) {
  const [values, setValues] = useState({
    ...regime,
    dutyRatePct: String(regime.dutyRatePct),
    maxEngineCc: regime.maxEngineCc === null ? "" : String(regime.maxEngineCc),
    description: regime.description ?? "",
    requiredFuel: regime.requiredFuel ?? "",
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof values>) => setValues({ ...values, ...patch });

  return (
    <Card title={`Regime: ${regime.label}`} subtitle={regime.active ? undefined : "Inativo: não aparece aos clientes."}>
      <form
        className="space-y-4"
        data-cy={`vehicle-regime-${regime.code}`}
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            await updateVehicleRegime(regime.code, {
              label: values.label,
              description: values.description || null,
              dutyRatePct: toNumber(values.dutyRatePct),
              iceExempt: values.iceExempt,
              specificIceExempt: values.specificIceExempt,
              vatExempt: values.vatExempt,
              maxEngineCc: values.maxEngineCc.trim() ? toNumber(values.maxEngineCc) : null,
              newOnly: values.newOnly,
              requiredFuel: values.requiredFuel || null,
              requiredDocuments: values.requiredDocuments,
              active: values.active,
            });
            setMessage("Guardado.");
          } catch (cause) {
            setMessage(messageOf(cause, "Não foi possível guardar."));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nome" value={values.label} onChange={(event) => set({ label: event.target.value })} />
          <Input label="Descrição" value={values.description} onChange={(event) => set({ description: event.target.value })} />
          <Input label="Direitos de importação (%)" inputMode="decimal" value={values.dutyRatePct} onChange={(event) => set({ dutyRatePct: event.target.value })} />
          <Input
            label="Cilindrada máxima (cm³)"
            inputMode="numeric"
            placeholder="sem limite"
            value={values.maxEngineCc}
            onChange={(event) => set({ maxEngineCc: event.target.value })}
          />
          <Select
            label="Combustível exigido"
            value={values.requiredFuel}
            onChange={(event) => set({ requiredFuel: event.target.value })}
            options={[{ value: "", label: "Qualquer" }, ...fuels.map((fuel) => ({ value: fuel, label: fuel }))]}
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Check label="Só viaturas novas" checked={values.newOnly} onChange={(newOnly) => set({ newOnly })} />
          <Check label="Isento de ICE" checked={values.iceExempt} onChange={(iceExempt) => set({ iceExempt })} />
          <Check label="Isento da taxa específica" checked={values.specificIceExempt} onChange={(specificIceExempt) => set({ specificIceExempt })} />
          <Check label="Isento de IVA" checked={values.vatExempt} onChange={(vatExempt) => set({ vatExempt })} />
          <Check label="Ativo" checked={values.active} onChange={(active) => set({ active })} />
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-slate-700">Documentos que o dono tem de enviar</legend>
          <div className="grid gap-1 sm:grid-cols-2">
            {vehicleDocumentTypes
              .filter((type) => type !== "other")
              .map((type) => (
                <Check
                  key={type}
                  label={vehicleDocumentLabels[type]}
                  checked={values.requiredDocuments.includes(type)}
                  onChange={(checked) =>
                    set({ requiredDocuments: checked ? [...values.requiredDocuments, type] : values.requiredDocuments.filter((item) => item !== type) })
                  }
                />
              ))}
          </div>
        </fieldset>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            Guardar regime
          </Button>
          {message ? <span className="text-sm text-slate-600">{message}</span> : null}
        </div>
      </form>
    </Card>
  );
}

/** Regimes de viatura (particular, táxi, emigrante, elétrico), editáveis. */
export function VehicleRegimesForms() {
  const [regimes, setRegimes] = useState<VehicleRegime[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listVehicleRegimes(true)
      .then(setRegimes)
      .catch((cause: unknown) => setError(messageOf(cause, "Não foi possível carregar os regimes.")));
  }, []);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  return <>{regimes?.map((regime) => <RegimeForm key={regime.code} regime={regime} />)}</>;
}
