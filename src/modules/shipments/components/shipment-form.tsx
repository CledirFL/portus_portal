"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, fieldClasses, fieldErrorClasses } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Agency } from "@/domain/agency";
import { cargoTypes, fieldValueLabel, getCargoType, type CargoCategory, type CargoFieldDefinition } from "@/domain/cargo-types";
import { VehicleEstimate } from "@/modules/shipments/components/vehicle-estimate";
import { deliveredByAgency } from "@/domain/destination";
import { listDestinationAgencies } from "@/services/api/admin-agencies";
import { dispatchCountries } from "@/domain/countries";
import { caboVerdeIslands } from "@/domain/shipment-request";
import { ApiError } from "@/lib/api-client";
import { fetchAgencies } from "@/services/api/agencies";
import { possibleDuplicates, type PossibleDuplicate, type Shipment, type ShipmentFieldsInput, type VolumeInput } from "@/services/api/shipments";
import { useAuthStore } from "@/store/auth-store";
import { emptyVolume, toVolumeInput, VolumeFields, type VolumeRow } from "./volume-fields";
import { isAdminRole } from "@/lib/permissions";

export interface ShipmentFormValues {
  agencyId: string;
  category: CargoCategory;
  dispatchCountry: string;
  description: string;
  externalReference: string;
  details: Record<string, string>;
  sender: { name: string; phone: string; email: string };
  recipient: { name: string; phone: string; island: string; nif: string; documentType: string; documentNumber: string };
  /** Encomendas pequenas: agência em Cabo Verde ("" = a única que serve a ilha, escolhida ao validar). */
  destinationAgencyId: string;
}

export const emptyShipmentForm: ShipmentFormValues = {
  agencyId: "",
  category: "encomenda_pequena",
  dispatchCountry: "",
  description: "",
  externalReference: "",
  details: {},
  sender: { name: "", phone: "", email: "" },
  recipient: { name: "", phone: "+238 ", island: "Santiago", nif: "", documentType: "", documentNumber: "" },
  destinationAgencyId: "",
};

export function shipmentToForm(shipment: Shipment): ShipmentFormValues {
  return {
    agencyId: shipment.agency.id,
    category: shipment.category,
    dispatchCountry: shipment.dispatchCountry,
    description: shipment.description,
    externalReference: shipment.externalReference ?? "",
    details: shipment.details,
    sender: { name: shipment.sender.name, phone: shipment.sender.phone, email: shipment.sender.email ?? "" },
    recipient: {
      name: shipment.recipient.name,
      phone: shipment.recipient.phone,
      island: shipment.recipient.island,
      nif: shipment.recipient.nif ?? "",
      documentType: shipment.recipient.documentType ?? "",
      documentNumber: shipment.recipient.documentNumber ?? "",
    },
    destinationAgencyId: shipment.destinationAgency?.id ?? "",
  };
}

function toFieldsInput(values: ShipmentFormValues, confirmDuplicates: boolean): ShipmentFieldsInput {
  const operatorKeys = new Set(getCargoType(values.category).operatorFields.map((field) => field.key));
  return {
    category: values.category,
    dispatchCountry: values.dispatchCountry,
    description: values.description,
    // Só envia os campos do tipo de carga atual (mudar de tipo não arrasta campos antigos).
    details: Object.fromEntries(Object.entries(values.details).filter(([key, value]) => operatorKeys.has(key) && value.trim())),
    externalReference: values.externalReference.trim() || undefined,
    sender: { name: values.sender.name, phone: values.sender.phone, email: values.sender.email.trim() || undefined },
    recipient: {
      name: values.recipient.name,
      phone: values.recipient.phone,
      island: values.recipient.island,
      nif: values.recipient.nif.trim() || undefined,
      documentType: (values.recipient.documentType || undefined) as ShipmentFieldsInput["recipient"]["documentType"],
      documentNumber: values.recipient.documentNumber.trim() || undefined,
    },
    destinationAgencyId: deliveredByAgency(values.category) ? values.destinationAgencyId || null : null,
    confirmDuplicates,
  };
}

export interface ShipmentFormSubmit {
  fields: ShipmentFieldsInput;
  volumes: VolumeInput[];
  agencyId?: string;
}

interface ShipmentFormProps {
  initialValues?: ShipmentFormValues;
  /** Formulário de criação inclui os volumes; na edição os volumes gerem-se no detalhe. */
  withVolumes: boolean;
  submitLabel: string;
  onSubmit: (data: ShipmentFormSubmit) => Promise<void>;
}

export function ShipmentForm({ initialValues = emptyShipmentForm, withVolumes, submitLabel, onSubmit }: ShipmentFormProps) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = isAdminRole(user?.role);
  const [values, setValues] = useState(initialValues);
  const [volumes, setVolumes] = useState<VolumeRow[]>([{ ...emptyVolume }]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [duplicates, setDuplicates] = useState<PossibleDuplicate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [destinations, setDestinations] = useState<Array<{ id: string; name: string; city: string }>>([]);

  // O país de onde envia vem da agência do agente; o admin escolhe a agência.
  useEffect(() => {
    fetchAgencies()
      .then((items) => {
        setAgencies(items);
        setValues((current) => {
          if (current.dispatchCountry) return current;
          const own = items.find((agency) => agency.id === user?.agencyId);
          return own ? { ...current, dispatchCountry: own.countryCode, agencyId: own.id } : current;
        });
      })
      .catch(() => setAgencies([]));
  }, [user?.agencyId]);

  // Encomendas pequenas: agências em Cabo Verde da agência de origem que servem a ilha do destinatário.
  const isAgencyDelivered = deliveredByAgency(values.category);
  useEffect(() => {
    if (!isAgencyDelivered || !values.agencyId) return;
    listDestinationAgencies(values.recipient.island, isAdminRole(user?.role) ? values.agencyId : undefined)
      .then(setDestinations)
      .catch(() => setDestinations([]));
  }, [isAgencyDelivered, values.recipient.island, values.agencyId, user?.role]);

  const cargoType = getCargoType(values.category);
  const update = (patch: Partial<ShipmentFormValues>) => setValues((current) => ({ ...current, ...patch }));
  const err = (path: string) => errors[path];

  const submit = async (confirmDuplicates: boolean) => {
    setBusy(true);
    setErrors({});
    setFormError("");
    setDuplicates(null);
    try {
      await onSubmit({
        fields: toFieldsInput(values, confirmDuplicates),
        volumes: volumes.map(toVolumeInput),
        agencyId: isAdmin ? values.agencyId || undefined : undefined,
      });
    } catch (error) {
      const found = possibleDuplicates(error);
      if (found) {
        setDuplicates(found);
      } else if (error instanceof ApiError && error.issues.length) {
        setErrors(Object.fromEntries(error.issues.map((issue) => [issue.path, issue.message])));
        setFormError("Corrija os campos assinalados.");
      } else {
        setFormError(error instanceof Error ? error.message : "Não foi possível guardar a encomenda.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  };

  const volumeErrors = (index: number) =>
    Object.fromEntries(
      Object.entries(errors)
        .filter(([path]) => path.startsWith(`volumes.${index}.`))
        .map(([path, message]) => [path.split(".").pop()!, message]),
    );

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(false);
      }}
    >
      {formError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </div>
      ) : null}

      {duplicates ? (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden /> Possível encomenda duplicada
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {duplicates.map((duplicate) => (
              <li key={`${duplicate.code}-${duplicate.reason}`}>{duplicate.message}</li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" onClick={() => void submit(true)} disabled={busy}>
              Registar mesmo assim
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setDuplicates(null)}>
              Rever os dados
            </Button>
          </div>
        </div>
      ) : null}

      <Card title="Carga">
        <div className="grid gap-4 sm:grid-cols-2">
          {isAdmin ? (
            <Select
              label="Agência"
              value={values.agencyId}
              onChange={(event) => {
                const agency = agencies.find((item) => item.id === event.target.value);
                update({ agencyId: event.target.value, dispatchCountry: agency?.countryCode ?? values.dispatchCountry });
              }}
              options={[{ value: "", label: "Escolha a agência" }, ...agencies.map((agency) => ({ value: agency.id, label: agency.name }))]}
              error={err("agencyId")}
            />
          ) : null}
          <Select
            label="Tipo de carga"
            value={values.category}
            onChange={(event) => update({ category: event.target.value as CargoCategory })}
            options={cargoTypes.map((type) => ({ value: type.id, label: type.label }))}
            error={err("category")}
          />
          <Select
            label="País de onde envia"
            value={values.dispatchCountry}
            onChange={(event) => update({ dispatchCountry: event.target.value })}
            options={[
              { value: "", label: "Escolha o país" },
              ...dispatchCountries.map((country) => ({ value: country.code, label: country.name })),
            ]}
            error={err("dispatchCountry")}
          />
          <Input
            label="Nº de guia da agência (opcional)"
            value={values.externalReference}
            onChange={(event) => update({ externalReference: event.target.value })}
            error={err("externalReference")}
          />
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Conteúdo declarado</span>
            <textarea
              rows={2}
              value={values.description}
              onChange={(event) => update({ description: event.target.value })}
              className={`${fieldClasses} ${err("description") ? fieldErrorClasses : ""}`}
            />
            {err("description") ? <span className="mt-1 block text-xs text-rose-600">{err("description")}</span> : null}
          </label>
        </div>

        {cargoType.operatorFields.length ? (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-3 text-sm font-semibold text-slate-900">Dados de {cargoType.label.toLowerCase()}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {cargoType.operatorFields.map((field) => (
                <OperatorField
                  key={`${values.category}-${field.key}`}
                  field={field}
                  value={values.details[field.key] ?? ""}
                  error={err(`details.${field.key}`)}
                  onChange={(value) => update({ details: { ...values.details, [field.key]: value } })}
                />
              ))}
            </div>
            {values.category === "veiculo" ? (
              <div className="mt-4">
                <VehicleEstimate details={values.details} dispatchCountry={values.dispatchCountry} />
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Remetente">
          <div className="space-y-4">
            <Input
              label="Nome"
              value={values.sender.name}
              onChange={(event) => update({ sender: { ...values.sender, name: event.target.value } })}
              error={err("sender.name")}
            />
            <Input
              label="Telefone"
              type="tel"
              value={values.sender.phone}
              hint="Com indicativo, ex.: +351 912 345 678"
              onChange={(event) => update({ sender: { ...values.sender, phone: event.target.value } })}
              error={err("sender.phone")}
            />
            <Input
              label="Email (opcional)"
              type="email"
              value={values.sender.email}
              onChange={(event) => update({ sender: { ...values.sender, email: event.target.value } })}
              error={err("sender.email")}
            />
          </div>
        </Card>
        <Card title="Destinatário">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Nome"
                value={values.recipient.name}
                onChange={(event) => update({ recipient: { ...values.recipient, name: event.target.value } })}
                error={err("recipient.name")}
              />
            </div>
            <Input
              label="Telefone"
              type="tel"
              value={values.recipient.phone}
              onChange={(event) => update({ recipient: { ...values.recipient, phone: event.target.value } })}
              error={err("recipient.phone")}
            />
            <Select
              label="Ilha"
              value={values.recipient.island}
              onChange={(event) => update({ recipient: { ...values.recipient, island: event.target.value } })}
              options={caboVerdeIslands.map((island) => ({ value: island, label: island }))}
              error={err("recipient.island")}
            />
            {isAgencyDelivered ? (
              <Select
                label="Agência em Cabo Verde"
                value={values.destinationAgencyId}
                onChange={(event) => update({ destinationAgencyId: event.target.value })}
                options={[
                  {
                    value: "",
                    label:
                      destinations.length === 1
                        ? `${destinations[0]!.name} (a única que serve a ilha)`
                        : destinations.length
                          ? "Escolha a agência"
                          : "Sem agência em Cabo Verde: levanta no porto",
                  },
                  ...(destinations.length > 1 ? destinations.map((agency) => ({ value: agency.id, label: `${agency.name} · ${agency.city}` })) : []),
                ]}
                hint="Entrega a encomenda ao destinatário e recebe o código de levantamento."
                error={err("destinationAgencyId")}
              />
            ) : null}
            <Input
              label="NIF"
              inputMode="numeric"
              value={values.recipient.nif}
              onChange={(event) => update({ recipient: { ...values.recipient, nif: event.target.value } })}
              error={err("recipient.nif")}
            />
            <Select
              label="Documento"
              value={values.recipient.documentType}
              onChange={(event) => update({ recipient: { ...values.recipient, documentType: event.target.value } })}
              options={[
                { value: "", label: "—" },
                { value: "CNI", label: "CNI" },
                { value: "BI", label: "BI" },
                { value: "Passaporte", label: "Passaporte" },
              ]}
            />
            <div className="sm:col-span-2">
              <Input
                label="Nº do documento (opcional)"
                value={values.recipient.documentNumber}
                hint="Usado no levantamento para confirmar a identidade (BR 18)."
                onChange={(event) => update({ recipient: { ...values.recipient, documentNumber: event.target.value } })}
                error={err("recipient.documentNumber")}
              />
            </div>
          </div>
        </Card>
      </div>

      {withVolumes ? (
        <Card title="Volumes" subtitle="Cada caixa, veículo ou palete recebe a sua etiqueta QR depois de validar.">
          {err("volumes") ? <p className="mb-3 text-sm text-rose-600">{err("volumes")}</p> : null}
          <div className="space-y-5">
            {volumes.map((volume, index) => (
              <div key={index} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Volume {index + 1}</p>
                  {volumes.length > 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setVolumes(volumes.filter((_, position) => position !== index))}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remover
                    </Button>
                  ) : null}
                </div>
                <VolumeFields
                  idPrefix={`volume-${index}`}
                  value={volume}
                  errors={volumeErrors(index)}
                  onChange={(next) => setVolumes(volumes.map((item, position) => (position === index ? next : item)))}
                />
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" className="mt-4" onClick={() => setVolumes([...volumes, { ...emptyVolume }])}>
            <Plus className="h-4 w-4" aria-hidden /> Acrescentar volume
          </Button>
        </Card>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-6">
        <Button type="submit" disabled={busy}>
          {busy ? "A guardar…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function OperatorField({
  field,
  value,
  error,
  onChange,
}: {
  field: CargoFieldDefinition;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const label = `${field.label}${field.unit ? ` (${field.unit})` : ""}`;
  const hint = field.required ? "Obrigatório para validar." : undefined;

  if (field.type === "select") {
    return (
      <Select
        label={label}
        value={value}
        hint={hint}
        onChange={(event) => onChange(event.target.value)}
        options={[{ value: "", label: "—" }, ...(field.options ?? []).map((option) => ({ value: option, label: fieldValueLabel(field, option) }))]}
        error={error}
      />
    );
  }
  if (field.type === "textarea") {
    return (
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
        <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClasses} ${error ? fieldErrorClasses : ""}`} />
        {error ? (
          <span className="mt-1 block text-xs text-rose-600">{error}</span>
        ) : hint ? (
          <span className="mt-1 block text-xs text-slate-500">{hint}</span>
        ) : null}
      </label>
    );
  }
  return (
    <Input
      label={label}
      value={value}
      placeholder={field.placeholder}
      inputMode={field.type === "number" ? "decimal" : undefined}
      className={field.format === "vin" ? "font-mono uppercase" : ""}
      hint={hint}
      onChange={(event) => onChange(event.target.value)}
      error={error}
    />
  );
}
