"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Plus, Printer, Trash2, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useReadOnly } from "@/components/layout/read-only";
import { CargoTypeIcon } from "@/components/cargo-type-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { fieldValueLabel, getCargoType } from "@/domain/cargo-types";
import { VehicleEstimate } from "@/modules/shipments/components/vehicle-estimate";
import { TransportPaymentCard } from "@/modules/shipments/components/transport-payment-card";
import { getDispatchCountry } from "@/domain/countries";
import { ApiError } from "@/lib/api-client";
import { ShipmentStatusBadge, VolumeStatusBadge } from "@/modules/shipments/components/shipment-status";
import { emptyVolume, toVolumeInput, VolumeFields, type VolumeRow } from "@/modules/shipments/components/volume-fields";
import {
  addVolume,
  cancelShipment,
  getShipment,
  possibleDuplicates,
  removeVolume,
  validateShipment,
  type PossibleDuplicate,
  type Shipment,
} from "@/services/api/shipments";
import { useAuthStore } from "@/store/auth-store";

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const readOnly = useReadOnly();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loadError, setLoadError] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [actionError, setActionError] = useState("");
  const [duplicates, setDuplicates] = useState<PossibleDuplicate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelReason, setCancelReason] = useState<string | null>(null);

  const load = useCallback(() => {
    getShipment(id)
      .then(setShipment)
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Não foi possível carregar a encomenda."));
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  /** Corre uma ação e mostra erros de validação com os nomes dos campos do tipo de carga. */
  const run = async (action: () => Promise<Shipment>) => {
    if (!shipment) return false;
    setBusy(true);
    setIssues([]);
    setActionError("");
    setDuplicates(null);
    try {
      setShipment(await action());
      return true;
    } catch (error) {
      const found = possibleDuplicates(error);
      if (found) {
        setDuplicates(found);
      } else if (error instanceof ApiError && error.issues.length) {
        const labels: Record<string, string> = {
          weightKg: "Peso",
          volumeM3: "Volume",
          lengthCm: "Comprimento",
          widthCm: "Largura",
          heightCm: "Altura",
          contents: "Conteúdo",
          reason: "Motivo",
          ...Object.fromEntries(getCargoType(shipment.category).operatorFields.map((field) => [field.key, field.label])),
        };
        setActionError(error.message);
        setIssues(
          error.issues.map((issue) => {
            const key = issue.path.replace(/^details\./, "");
            return issue.path === "volumes" ? issue.message : `${labels[key] ?? key}: ${issue.message}`;
          }),
        );
      } else {
        setActionError(error instanceof Error ? error.message : "Não foi possível concluir a operação.");
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <AppShell>
        <PageHeader backHref="/agencia/encomendas" title="Encomenda" />
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </div>
      </AppShell>
    );
  }
  if (!shipment) {
    return (
      <AppShell>
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      </AppShell>
    );
  }

  const type = getCargoType(shipment.category);
  // Rascunho que esta conta pode alterar (o admin da plataforma só consulta).
  const isDraft = shipment.status === "draft" && !readOnly;
  const detailEntries = type.operatorFields.filter((field) => shipment.details[field.key]);

  return (
    <AppShell>
      <PageHeader
        backHref="/agencia/encomendas"
        eyebrow={shipment.agency.name}
        title={shipment.code}
        description={
          shipment.requestReference
            ? `Criada a partir do pedido ${shipment.requestReference}.`
            : `Registada a ${new Date(shipment.createdAt).toLocaleDateString("pt-PT")}.`
        }
        actions={
          <>
            <ShipmentStatusBadge status={shipment.status} />
            {isDraft ? (
              <>
                <Link href={`/agencia/encomendas/${shipment.id}/editar`}>
                  <Button variant="outline">
                    <Pencil className="h-4 w-4" aria-hidden /> Editar dados
                  </Button>
                </Link>
                <Button disabled={busy} onClick={() => run(() => validateShipment(shipment.id))}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Validar
                </Button>
              </>
            ) : null}
            {shipment.status === "validated" ? (
              <Link href={`/agencia/encomendas/${shipment.id}/comprovativo`}>
                <Button variant="outline">
                  <Printer className="h-4 w-4" aria-hidden /> Comprovativo
                </Button>
              </Link>
            ) : null}
            {shipment.status === "validated" ? (
              <Link href={`/agencia/encomendas/${shipment.id}/etiquetas`}>
                <Button>
                  <Printer className="h-4 w-4" aria-hidden /> Imprimir etiquetas
                </Button>
              </Link>
            ) : null}
            {shipment.status !== "cancelled" && cancelReason === null && !readOnly ? (
              <Button variant="ghost" onClick={() => setCancelReason("")}>
                <XCircle className="h-4 w-4" aria-hidden /> Cancelar
              </Button>
            ) : null}
          </>
        }
      />

      {cancelReason !== null ? (
        <Card className="mb-6">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void run(() => cancelShipment(shipment.id, cancelReason)).then((ok) => ok && setCancelReason(null));
            }}
          >
            <Input label="Motivo do cancelamento" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
            <Button type="submit" variant="danger" disabled={busy}>
              Confirmar cancelamento
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCancelReason(null)}>
              Voltar
            </Button>
          </form>
        </Card>
      ) : null}

      {actionError ? (
        <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-medium">{actionError}</p>
          {issues.length ? (
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {duplicates ? (
        <div role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden /> Possível encomenda duplicada
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {duplicates.map((duplicate) => (
              <li key={`${duplicate.code}-${duplicate.reason}`}>{duplicate.message}</li>
            ))}
          </ul>
          <Button className="mt-3" size="sm" disabled={busy} onClick={() => run(() => validateShipment(shipment.id, true))}>
            Validar mesmo assim
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Carga" className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <CargoTypeIcon icon={type.icon} />
            </span>
            <div>
              <p className="font-medium text-slate-900">{type.label}</p>
              <p className="text-sm text-slate-500">
                Enviado de {getDispatchCountry(shipment.dispatchCountry)?.name ?? shipment.dispatchCountry}
                {shipment.externalReference ? ` · guia ${shipment.externalReference}` : ""}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-700">{shipment.description}</p>
          {detailEntries.length ? (
            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {detailEntries.map((field) => (
                <div key={field.key} className="flex justify-between gap-3 border-b border-slate-100 py-1">
                  <dt className="text-slate-500">{field.label}</dt>
                  <dd className={`text-right font-medium text-slate-900 ${field.format === "vin" ? "font-mono" : ""}`}>
                    {fieldValueLabel(field, shipment.details[field.key] ?? "")}
                    {field.unit ? ` ${field.unit}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {type.requiredDocuments.length ? (
            <p className="mt-4 text-xs text-slate-500">Documentos a recolher: {type.requiredDocuments.join(", ")}.</p>
          ) : null}
          {shipment.category === "veiculo" ? (
            <div className="mt-4">
              <VehicleEstimate details={shipment.details} />
            </div>
          ) : null}
        </Card>

        <div className="space-y-6">
          {shipment.transport.required ? <TransportPaymentCard shipment={shipment} onChange={setShipment} /> : null}
          <Card title="Remetente">
            <p className="font-medium text-slate-900">{shipment.sender.name}</p>
            <p className="text-sm text-slate-500">{shipment.sender.phone}</p>
            {shipment.sender.email ? <p className="text-sm text-slate-500">{shipment.sender.email}</p> : null}
          </Card>
          <Card title="Destinatário">
            <p className="font-medium text-slate-900">{shipment.recipient.name}</p>
            <p className="text-sm text-slate-500">
              {shipment.recipient.phone} · {shipment.recipient.island}
            </p>
            {shipment.recipient.nif ? <p className="text-sm text-slate-500">NIF {shipment.recipient.nif}</p> : null}
            {shipment.recipient.documentNumber ? (
              <p className="text-sm text-slate-500">
                {shipment.recipient.documentType ?? "Documento"} {shipment.recipient.documentNumber}
              </p>
            ) : null}
          </Card>
          <Card title="Levantamento em Cabo Verde">
            {shipment.destinationAgency ? (
              <div data-cy="destination-agency" className="space-y-1 text-sm">
                <p className="font-medium text-slate-900">{shipment.destinationAgency.name}</p>
                <p className="text-slate-500">
                  {shipment.destinationAgency.address}, {shipment.destinationAgency.city} · {shipment.destinationAgency.phone}
                </p>
                {shipment.pickupCode ? (
                  <p>
                    Código de levantamento <span className="font-mono font-semibold tracking-widest text-slate-900">{shipment.pickupCode}</span>
                  </p>
                ) : (
                  <p className="text-slate-500">O código de levantamento é gerado ao validar.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No porto de chegada (sem agência em Cabo Verde associada).</p>
            )}
          </Card>
        </div>
      </div>

      <Card
        className="mt-6"
        title={`Volumes (${shipment.totals.volumes})`}
        subtitle={`${shipment.totals.weightKg} kg · ${shipment.totals.volumeM3} m³`}
      >
        {shipment.volumes.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Código</th>
                  <th className="py-2 pr-4 font-medium">Peso</th>
                  <th className="py-2 pr-4 font-medium">Medidas</th>
                  <th className="py-2 pr-4 font-medium">Conteúdo</th>
                  <th className="py-2 pr-4 font-medium">Selo</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                  {isDraft ? <th className="py-2" /> : null}
                </tr>
              </thead>
              <tbody>
                {shipment.volumes.map((volume) => (
                  <tr key={volume.id} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-mono text-xs font-semibold">{volume.code}</td>
                    <td className="py-2 pr-4 tabular-nums">{volume.weightKg} kg</td>
                    <td className="py-2 pr-4 tabular-nums">
                      {volume.lengthCm ? `${volume.lengthCm}×${volume.widthCm}×${volume.heightCm} cm · ` : ""}
                      {volume.volumeM3 ?? "—"} m³
                    </td>
                    <td className="py-2 pr-4">{volume.contents ?? "—"}</td>
                    <td className="py-2 pr-4">{volume.sealed ? "Selado" : "Aberto"}</td>
                    <td className="py-2 pr-4">
                      <VolumeStatusBadge status={volume.status} />
                    </td>
                    {isDraft ? (
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Remover ${volume.code}`}
                          disabled={busy}
                          onClick={() => run(() => removeVolume(shipment.id, volume.id))}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Ainda sem volumes. Pese e meça a carga e acrescente-os abaixo.</p>
        )}

        {isDraft ? <AddVolume busy={busy} onAdd={(row) => run(() => addVolume(shipment.id, toVolumeInput(row)))} /> : null}
      </Card>
    </AppShell>
  );
}

function AddVolume({ busy, onAdd }: { busy: boolean; onAdd: (row: VolumeRow) => Promise<boolean> }) {
  const [row, setRow] = useState<VolumeRow>({ ...emptyVolume });

  return (
    <form
      className="mt-6 rounded-xl border border-dashed border-slate-300 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onAdd(row).then((ok) => ok && setRow({ ...emptyVolume }));
      }}
    >
      <p className="mb-3 text-sm font-semibold text-slate-900">Acrescentar volume</p>
      <VolumeFields idPrefix="new-volume" value={row} onChange={setRow} />
      <Button type="submit" variant="outline" className="mt-4" disabled={busy}>
        <Plus className="h-4 w-4" aria-hidden /> Acrescentar
      </Button>
    </form>
  );
}
