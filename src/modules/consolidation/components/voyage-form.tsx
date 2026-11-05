"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Agency } from "@/domain/agency";
import { isValidUnLocode } from "@/domain/containers";
import { ApiError } from "@/lib/api-client";
import { ErrorBanner } from "@/modules/consolidation/components/consolidation-ui";
import { arrivalPorts, type Voyage, type VoyageInput } from "@/services/api/voyages";

/** Portos de embarque frequentes para Cabo Verde (UN/LOCODE); aceita-se qualquer outro código. */
const departurePorts = [
  { code: "PTLIS", name: "Lisboa" },
  { code: "PTLEI", name: "Leixões" },
  { code: "PTSIE", name: "Sines" },
  { code: "FRLEH", name: "Le Havre" },
  { code: "ESVGO", name: "Vigo" },
  { code: "ESALG", name: "Algeciras" },
  { code: "NLRTM", name: "Roterdão" },
  { code: "USBOS", name: "Boston" },
  { code: "USEWR", name: "Newark" },
  { code: "CNSHA", name: "Xangai" },
];

/** `datetime-local` usa a hora local sem fuso; a API recebe ISO 8601 com fuso. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

const fieldLabels: Record<string, string> = {
  vesselName: "Navio",
  voyageNumber: "Nº da viagem",
  departurePort: "Porto de embarque",
  arrivalPortCode: "Porto de chegada",
  etd: "Partida",
  eta: "Chegada (ETA)",
  agencyId: "Agência",
};

export function VoyageForm({
  voyage,
  agencies,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  voyage?: Voyage;
  /** Só para administradores: escolher a agência. */
  agencies?: Agency[];
  submitLabel: string;
  onSubmit: (input: VoyageInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [vesselName, setVesselName] = useState(voyage?.vesselName ?? "");
  const [voyageNumber, setVoyageNumber] = useState(voyage?.voyageNumber ?? "");
  const [departurePort, setDeparturePort] = useState(voyage?.departurePort ?? "PTLIS");
  const [arrivalPortCode, setArrivalPortCode] = useState(voyage?.arrivalPort.code ?? "CVRAI");
  const [etd, setEtd] = useState(toLocalInput(voyage?.etd ?? null));
  const [eta, setEta] = useState(toLocalInput(voyage?.eta ?? null));
  const [agencyId, setAgencyId] = useState("");
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const portError = departurePort.length === 5 && !isValidUnLocode(departurePort) ? "Código UN/LOCODE inválido (ex.: PTLIS)." : undefined;

  return (
    <form
      className="grid gap-4 md:grid-cols-6"
      data-cy="voyage-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        setIssues([]);
        try {
          await onSubmit({
            agencyId: agencies ? agencyId || agencies[0]?.id : undefined,
            vesselName,
            voyageNumber: voyageNumber || null,
            departurePort,
            arrivalPortCode,
            etd: fromLocalInput(etd),
            eta: fromLocalInput(eta) ?? "",
          });
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Não foi possível guardar a viagem.");
          if (cause instanceof ApiError) setIssues(cause.issues.map((issue) => `${fieldLabels[issue.path] ?? issue.path}: ${issue.message}`));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="md:col-span-6">
        <ErrorBanner message={error} items={issues} />
      </div>
      {agencies ? (
        <div className="md:col-span-6">
          <Select
            label="Agência"
            value={agencyId || agencies[0]?.id || ""}
            onChange={(event) => setAgencyId(event.target.value)}
            options={agencies.map((agency) => ({ value: agency.id, label: `${agency.name} (${agency.city})` }))}
          />
        </div>
      ) : null}
      <div className="md:col-span-3">
        <Input label="Navio" placeholder="Sorel" value={vesselName} onChange={(event) => setVesselName(event.target.value)} required />
      </div>
      <div className="md:col-span-3">
        <Input label="Nº da viagem" placeholder="045S (opcional)" value={voyageNumber} onChange={(event) => setVoyageNumber(event.target.value)} />
      </div>
      <div className="md:col-span-3">
        <Input
          label="Porto de embarque"
          list="departure-ports"
          value={departurePort}
          onChange={(event) => setDeparturePort(event.target.value.toUpperCase().slice(0, 5))}
          error={portError}
          hint="Código UN/LOCODE do porto, ex.: PTLIS (Lisboa), FRLEH (Le Havre), USBOS (Boston)."
          required
          className="font-mono"
        />
        <datalist id="departure-ports">
          {departurePorts.map((port) => (
            <option key={port.code} value={port.code}>
              {port.name}
            </option>
          ))}
        </datalist>
      </div>
      <div className="md:col-span-3">
        <Select
          label="Porto de chegada"
          value={arrivalPortCode}
          onChange={(event) => setArrivalPortCode(event.target.value)}
          options={arrivalPorts.map((port) => ({ value: port.code, label: `${port.name} — ${port.island}` }))}
        />
      </div>
      <div className="md:col-span-3">
        <Input label="Partida prevista (ETD)" type="datetime-local" value={etd} onChange={(event) => setEtd(event.target.value)} />
      </div>
      <div className="md:col-span-3">
        <Input
          label="Chegada prevista (ETA)"
          type="datetime-local"
          value={eta}
          onChange={(event) => setEta(event.target.value)}
          hint="O manifesto tem de ser enviado até 72 h antes."
          required
        />
      </div>
      <div className="flex gap-2 md:col-span-6">
        <Button type="submit" disabled={busy || Boolean(portError)}>
          {busy ? "A guardar…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
