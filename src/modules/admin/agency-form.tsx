"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cargoTypes, type CargoCategory } from "@/domain/cargo-types";
import { dispatchCountries } from "@/domain/countries";
import { caboVerdeIslands } from "@/domain/shipment-request";
import type { AgencyInput } from "@/services/api/admin-agencies";

export const emptyAgency = (kind: AgencyInput["kind"]): AgencyInput => ({
  code: "",
  name: "",
  kind,
  countryCode: kind === "destination" ? "CV" : "PT",
  city: "",
  address: "",
  phone: kind === "destination" ? "+238 " : "",
  email: "",
  islands: [],
  categories: kind === "origin" ? ["encomenda_pequena"] : [],
  offersPickup: false,
  status: "active",
});

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Campos da agência; as de Cabo Verde não têm país de envio, tipos de carga nem recolhas. */
export function AgencyFields({
  values,
  onChange,
  errors,
}: {
  values: AgencyInput;
  onChange: (values: AgencyInput) => void;
  errors: Record<string, string>;
}) {
  const set = (patch: Partial<AgencyInput>) => onChange({ ...values, ...patch });
  const isOrigin = values.kind === "origin";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Código" placeholder={isOrigin ? "LIS01" : "PRA01"} value={values.code} onChange={(event) => set({ code: event.target.value.toUpperCase() })} error={errors.code} />
        <Input label="Nome" value={values.name} onChange={(event) => set({ name: event.target.value })} error={errors.name} />
        {isOrigin ? (
          <Select
            label="País de onde envia"
            value={values.countryCode}
            onChange={(event) => set({ countryCode: event.target.value })}
            options={dispatchCountries.map((country) => ({ value: country.code, label: country.name }))}
            error={errors.countryCode}
          />
        ) : (
          <Input label="País" value="Cabo Verde" disabled />
        )}
        <Input label="Cidade" value={values.city} onChange={(event) => set({ city: event.target.value })} error={errors.city} />
        <Input label="Morada" value={values.address} onChange={(event) => set({ address: event.target.value })} error={errors.address} />
        <Input label="Telefone" type="tel" value={values.phone} onChange={(event) => set({ phone: event.target.value })} error={errors.phone} />
        <Input label="Email" type="email" value={values.email} onChange={(event) => set({ email: event.target.value })} error={errors.email} />
        <Select
          label="Estado"
          value={values.status}
          onChange={(event) => set({ status: event.target.value as AgencyInput["status"] })}
          options={[
            { value: "active", label: "Ativa" },
            { value: "inactive", label: "Inativa" },
          ]}
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-700">
          {isOrigin ? "Ilhas para onde envia" : "Ilhas dos destinatários que atende"}
        </legend>
        <div className="flex flex-wrap gap-2">
          {caboVerdeIslands.map((island) => (
            <label key={island} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm">
              <input type="checkbox" checked={values.islands.includes(island)} onChange={() => set({ islands: toggle(values.islands, island) })} />
              {island}
            </label>
          ))}
        </div>
        {errors.islands ? <p className="mt-1 text-xs text-rose-600">{errors.islands}</p> : null}
      </fieldset>

      {isOrigin ? (
        <>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-slate-700">Tipos de carga que recebe</legend>
            <div className="flex flex-wrap gap-2">
              {cargoTypes.map((type) => (
                <label key={type.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={values.categories.includes(type.id)}
                    onChange={() => set({ categories: toggle<CargoCategory>(values.categories, type.id) })}
                  />
                  {type.label}
                </label>
              ))}
            </div>
            {errors.categories ? <p className="mt-1 text-xs text-rose-600">{errors.categories}</p> : null}
          </fieldset>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={values.offersPickup} onChange={(event) => set({ offersPickup: event.target.checked })} />
            Faz recolhas na morada do cliente
          </label>
        </>
      ) : null}
    </div>
  );
}
