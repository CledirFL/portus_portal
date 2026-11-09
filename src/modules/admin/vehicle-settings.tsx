"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { type FuelGroup, fuelGroupLabels, vehicleDocumentLabels, vehicleDocumentTypes, type VehicleTaxSettings } from "@/domain/vehicle-taxes";
import { ApiError } from "@/lib/api-client";
import { getVehicleTaxSettings, listVehicleRegimes, updateVehicleRegime, updateVehicleTaxSettings, type VehicleRegime } from "@/services/api/vehicles";

const fuels = ["Gasolina", "Gasóleo", "Híbrido", "Elétrico", "GPL"];
const fuelGroups = Object.keys(fuelGroupLabels) as FuelGroup[];
const toNumber = (value: string) => Number(value.replace(",", "."));
const optional = (value: string) => (value.trim() === "" ? null : toNumber(value));
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

interface TierRow {
  limit: string;
  ratePct: string;
}

/** Escalões editáveis (limite + %); o último fica sem limite. */
function TierList({ title, limitLabel, lastLabel, rows, onChange }: { title: string; limitLabel: string; lastLabel: string; rows: TierRow[]; onChange: (rows: TierRow[]) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{title}</p>
      <ul className="space-y-2">
        {rows.map((row, index) => {
          const last = index === rows.length - 1;
          return (
            <li key={index} className="flex flex-wrap items-end gap-2">
              <div className="w-40">
                <Input
                  label={last ? "Limite" : limitLabel}
                  inputMode="numeric"
                  value={last ? lastLabel : row.limit}
                  disabled={last}
                  onChange={(event) => onChange(rows.map((item, at) => (at === index ? { ...item, limit: event.target.value } : item)))}
                />
              </div>
              <div className="w-28">
                <Input
                  label="%"
                  inputMode="decimal"
                  value={row.ratePct}
                  onChange={(event) => onChange(rows.map((item, at) => (at === index ? { ...item, ratePct: event.target.value } : item)))}
                />
              </div>
              {rows.length > 1 ? (
                <Button type="button" variant="ghost" size="sm" aria-label="Retirar escalão" onClick={() => onChange(rows.filter((_, at) => at !== index))}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={() => onChange([...rows.slice(0, -1), { limit: "", ratePct: "" }, ...rows.slice(-1)])}>
        <Plus className="h-3.5 w-3.5" aria-hidden /> Escalão
      </Button>
    </div>
  );
}

const toRows = (tiers: Array<{ limit: number | null; ratePct: number }>): TierRow[] =>
  tiers.map((tier) => ({ limit: tier.limit === null ? "" : String(tier.limit), ratePct: String(tier.ratePct) }));
const fromRows = (rows: TierRow[]) => rows.map((row, index) => ({ limit: index === rows.length - 1 ? null : optional(row.limit), ratePct: toNumber(row.ratePct) }));

/** Pauta 8703: câmbios, IVA, CEDEAO, TEA, DI por combustível e cilindrada, ICE por idade. */
export function VehicleTaxSettingsForm() {
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [bands, setBands] = useState<Record<FuelGroup, TierRow[]>>({ gasolina: [], gasoleo: [], hibrido: [], eletrico: [] });
  const [iceTiers, setIceTiers] = useState<TierRow[]>([]);
  const [electricTiers, setElectricTiers] = useState<TierRow[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = (settings: VehicleTaxSettings) => {
    setValues({
      eurToCve: String(settings.eurToCve),
      usdToCve: String(settings.usdToCve),
      vatPct: String(settings.vatPct),
      communityTaxPct: String(settings.communityTaxPct),
      teaCve: String(settings.teaCve),
      specificIceCve: String(settings.specificIceCve),
      specificIceMaxAgeYears: String(settings.specificIceMaxAgeYears),
    });
    setBands(
      Object.fromEntries(
        fuelGroups.map((fuel) => [
          fuel,
          toRows(settings.dutyBands.filter((band) => band.fuel === fuel).map((band) => ({ limit: band.maxEngineCc, ratePct: band.ratePct }))),
        ]),
      ) as Record<FuelGroup, TierRow[]>,
    );
    setIceTiers(toRows(settings.iceTiers.map((tier) => ({ limit: tier.maxAgeYears, ratePct: tier.ratePct }))));
    setElectricTiers(toRows(settings.iceElectricTiers.map((tier) => ({ limit: tier.maxAgeYears, ratePct: tier.ratePct }))));
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
      title="Impostos de viaturas (Pauta 8703)"
      subtitle="Usados na estimativa que o cliente vê e na liquidação da Alfândega (que os pode ajustar). Mudam com o Orçamento do Estado: confirme os valores todos os anos."
    >
      <form
        className="space-y-5"
        data-cy="vehicle-tax-settings"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            load(
              await updateVehicleTaxSettings({
                eurToCve: toNumber(values.eurToCve!),
                usdToCve: toNumber(values.usdToCve!),
                vatPct: toNumber(values.vatPct!),
                communityTaxPct: toNumber(values.communityTaxPct!),
                teaCve: toNumber(values.teaCve!),
                dutyBands: fuelGroups.flatMap((fuel) => fromRows(bands[fuel]).map((row) => ({ fuel, maxEngineCc: row.limit, ratePct: row.ratePct }))),
                specificIceCve: toNumber(values.specificIceCve!),
                specificIceMaxAgeYears: toNumber(values.specificIceMaxAgeYears!),
                iceTiers: fromRows(iceTiers).map((row) => ({ maxAgeYears: row.limit, ratePct: row.ratePct })),
                iceElectricTiers: fromRows(electricTiers).map((row) => ({ maxAgeYears: row.limit, ratePct: row.ratePct })),
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
          <Input label="Câmbio do euro (ECV)" inputMode="decimal" value={values.eurToCve} onChange={(event) => set("eurToCve", event.target.value)} />
          <Input label="Câmbio do dólar (ECV)" inputMode="decimal" value={values.usdToCve} onChange={(event) => set("usdToCve", event.target.value)} hint="Varia: atualize-o." />
          <Input label="IVA (%)" inputMode="decimal" value={values.vatPct} onChange={(event) => set("vatPct", event.target.value)} />
          <Input label="Taxa CEDEAO (% do CIF)" inputMode="decimal" value={values.communityTaxPct} onChange={(event) => set("communityTaxPct", event.target.value)} hint="Só de países de fora da CEDEAO." />
          <Input label="TEA por despacho (ECV)" inputMode="decimal" value={values.teaCve} onChange={(event) => set("teaCve", event.target.value)} />
        </div>

        <div>
          <p className="mb-1 text-sm font-semibold text-slate-900">Direitos de importação (DI) por combustível e cilindrada</p>
          <p className="mb-3 text-xs text-slate-500">O GPL segue a gasolina. Os regimes com DI próprio (táxi, turismo, emigrante) sobrepõem-se a esta tabela.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {fuelGroups.map((fuel) => (
              <TierList
                key={fuel}
                title={fuelGroupLabels[fuel]}
                limitLabel="Até (cm³)"
                lastLabel="acima"
                rows={bands[fuel]}
                onChange={(rows) => setBands({ ...bands, [fuel]: rows })}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-semibold text-slate-900">Imposto sobre consumos especiais (ICE)</p>
          <p className="mb-3 text-xs text-slate-500">Novas: não pagam. Usadas recentes: valor fixo. Mais velhas: % de (CIF + DI) pela idade.</p>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <Input label="ICE fixo das usadas recentes (ECV)" inputMode="decimal" value={values.specificIceCve} onChange={(event) => set("specificIceCve", event.target.value)} />
            <Input label="Usadas recentes: até (anos)" inputMode="numeric" value={values.specificIceMaxAgeYears} onChange={(event) => set("specificIceMaxAgeYears", event.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TierList title="Usadas mais velhas" limitLabel="Até (anos)" lastLabel="mais velhas" rows={iceTiers} onChange={setIceTiers} />
            <TierList title="Elétricas usadas" limitLabel="Até (anos)" lastLabel="mais velhas" rows={electricTiers} onChange={setElectricTiers} />
          </div>
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
    dutyRatePct: regime.dutyRatePct === null ? "" : String(regime.dutyRatePct),
    maxEngineCc: regime.maxEngineCc === null ? "" : String(regime.maxEngineCc),
    oncePerYears: regime.oncePerYears === null ? "" : String(regime.oncePerYears),
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
              dutyRatePct: optional(values.dutyRatePct),
              iceExempt: values.iceExempt,
              vatExempt: values.vatExempt,
              maxEngineCc: optional(values.maxEngineCc),
              newOnly: values.newOnly,
              requiredFuel: values.requiredFuel || null,
              requiredDocuments: values.requiredDocuments,
              oncePerYears: optional(values.oncePerYears),
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
          <Input
            label="Direitos de importação (%)"
            inputMode="decimal"
            placeholder="pela Pauta"
            hint="Vazio: segue a Pauta (combustível e cilindrada)."
            value={values.dutyRatePct}
            onChange={(event) => set({ dutyRatePct: event.target.value })}
          />
          <Input label="Cilindrada máxima (cm³)" inputMode="numeric" placeholder="sem limite" value={values.maxEngineCc} onChange={(event) => set({ maxEngineCc: event.target.value })} />
          <Select
            label="Combustível exigido"
            value={values.requiredFuel}
            onChange={(event) => set({ requiredFuel: event.target.value })}
            options={[{ value: "", label: "Qualquer" }, ...fuels.map((fuel) => ({ value: fuel, label: fuel }))]}
          />
          <Input
            label="Uma viatura por pessoa a cada (anos)"
            inputMode="numeric"
            placeholder="sem limite"
            value={values.oncePerYears}
            onChange={(event) => set({ oncePerYears: event.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Check label="Só viaturas novas" checked={values.newOnly} onChange={(newOnly) => set({ newOnly })} />
          <Check label="Isento de ICE" checked={values.iceExempt} onChange={(iceExempt) => set({ iceExempt })} />
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

/** Regimes de viatura (uso privado, táxi, turismo, emigrante), editáveis. */
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
