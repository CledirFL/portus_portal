"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, Inbox, PackageCheck, Phone, Truck, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useReadOnly } from "@/components/layout/read-only";
import { CargoTypeIcon } from "@/components/cargo-type-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, fieldClasses } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { getCargoType } from "@/domain/cargo-types";
import { nextRequestStatuses, type RequestStatus, type ShipmentRequest } from "@/domain/shipment-request";
import { RequestStatusBadge } from "@/modules/customer/components/request-status";
import { agencyShipmentRequestAction, listAgencyShipmentRequests } from "@/services/api/shipment-requests";
import { useAuthStore } from "@/store/auth-store";
import { isAdminRole } from "@/lib/permissions";

type AgencyTarget = Exclude<RequestStatus, "submitted">;

const filters: Array<{ key: string; label: string; statuses: RequestStatus[] }> = [
  { key: "open", label: "Por tratar", statuses: ["submitted"] },
  { key: "progress", label: "Em curso", statuses: ["accepted", "pickup_scheduled"] },
  { key: "closed", label: "Fechados", statuses: ["converted", "rejected", "cancelled"] },
];

const actionLabels: Record<AgencyTarget, string> = {
  accepted: "Aceitar",
  pickup_scheduled: "Agendar",
  converted: "Carga recebida (criar encomenda)",
  rejected: "Recusar",
  cancelled: "Cancelar",
};

const needsReason = (to: RequestStatus) => to === "rejected" || to === "cancelled";

export default function AgencyRequestsPage() {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // A API já filtra pela agência do agente (BR 28); o admin recebe todas.
  const reload = useCallback(() => {
    listAgencyShipmentRequests()
      .then((items) => {
        setRequests(items);
        setLoadError("");
      })
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error.message : "Não foi possível carregar os pedidos."),
      );
  }, []);

  useEffect(() => {
    if (user) {
      reload();
    }
  }, [reload, user]);

  const counts = useMemo(
    () => Object.fromEntries(filters.map((item) => [item.key, requests.filter((request) => item.statuses.includes(request.status)).length])),
    [requests],
  );
  const visible = requests.filter((request) => filters.find((item) => item.key === filter)?.statuses.includes(request.status));
  const selected = requests.find((request) => request.id === selectedId) ?? visible[0];
  const agencyName = isAdminRole(user?.role) ? "Todas as agências" : requests[0]?.agency.name;

  return (
    <AppShell>
      <PageHeader
        eyebrow={agencyName}
        title="Pedidos de clientes"
        description="Pedidos feitos no portal público. Confirme os dados com o cliente antes de registar a encomenda."
      />

      {loadError ? (
        <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Por tratar" value={counts.open ?? 0} tone="warning" icon={<Inbox className="h-4 w-4" />} />
        <StatCard label="Em curso" value={counts.progress ?? 0} tone="info" icon={<Clock3 className="h-4 w-4" />} />
        <StatCard label="Fechados" value={counts.closed ?? 0} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist">
        {filters.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={filter === item.key}
            onClick={() => {
              setFilter(item.key);
              setSelectedId(null);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === item.key ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {item.label} <span className="ml-1 opacity-70">{counts[item.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <ul className="space-y-2">
            {visible.map((request) => {
              const type = getCargoType(request.category);
              const isSelected = selected?.id === request.id;
              return (
                <li key={request.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(request.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border bg-white p-3 text-left transition ${
                      isSelected ? "border-brand-500 ring-4 ring-brand-100" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <CargoTypeIcon icon={type.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold tracking-wider text-slate-900">{request.reference}</span>
                        <span className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleDateString("pt-PT")}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate-700">
                        {request.sender.name} → {request.recipient.island}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {type.publicLabel}
                        {isAdminRole(user?.role) ? ` · ${request.agency.name}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {selected ? <RequestPanel key={selected.id} request={selected} onChange={reload} /> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
          Sem pedidos nesta lista. Os pedidos feitos em <span className="font-medium text-slate-700">/enviar</span> aparecem aqui.
        </div>
      )}
    </AppShell>
  );
}

function RequestPanel({ request, onChange }: { request: ShipmentRequest; onChange: () => void }) {
  const type = getCargoType(request.category);
  const readOnly = useReadOnly();
  const [scheduledFor, setScheduledFor] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const act = async (to: AgencyTarget) => {
    setError("");
    const text = note.trim() || undefined;
    if (needsReason(to) && !text) {
      setError("Indique o motivo para o cliente.");
      return;
    }
    if (to === "pickup_scheduled" && !scheduledFor) {
      setError("Escolha a data e hora.");
      return;
    }

    setBusy(true);
    try {
      await agencyShipmentRequestAction(request.id, to, {
        ...(needsReason(to) ? { reason: text } : { note: text }),
        ...(to === "pickup_scheduled" ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}),
      });
      setNote("");
      onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o pedido.");
    } finally {
      setBusy(false);
    }
  };

  const actions = nextRequestStatuses(request.status) as AgencyTarget[];

  return (
    <Card className="h-fit lg:sticky lg:top-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold tracking-wider text-slate-900">{request.reference}</p>
          <p className="text-sm text-slate-500">{type.label}</p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      <p className="mt-4 text-sm text-slate-700">{request.description}</p>
      {Object.keys(request.details).length ? (
        <dl className="mt-3 flex flex-wrap gap-2 text-xs">
          {type.publicFields
            .filter((field) => request.details[field.key])
            .map((field) => (
              <div key={field.key} className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                <dt className="inline text-slate-500">{field.shortLabel ?? field.label}: </dt>
                <dd className="inline font-medium">
                  {request.details[field.key]}
                  {field.unit ? ` ${field.unit}` : ""}
                </dd>
              </div>
            ))}
        </dl>
      ) : null}

      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
        <Contact
          title="Remetente"
          name={request.sender.name}
          phone={request.sender.phone}
          extra={request.sender.email ?? undefined}
        />
        <Contact
          title="Destinatário"
          name={request.recipient.name}
          phone={request.recipient.phone}
          extra={`${request.recipient.island}${request.recipient.nif ? ` · NIF ${request.recipient.nif}` : ""}`}
        />
      </div>

      <p className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {request.handover === "recolha" ? (
          <>
            <Truck className="h-4 w-4 text-brand-700" /> Recolha em {request.pickupAddress}
          </>
        ) : (
          <>
            <PackageCheck className="h-4 w-4 text-brand-700" /> O cliente entrega na agência
          </>
        )}
      </p>
      {request.scheduledFor ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <CalendarClock className="h-4 w-4" /> Marcado para{" "}
          {new Date(request.scheduledFor).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      ) : null}
      {request.agencyNote ? (
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium">Última nota ao cliente:</span> {request.agencyNote}
        </p>
      ) : null}

      {request.shipment ? (
        <Link
          href={`/agencia/encomendas/${request.shipment.id}`}
          className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-100"
        >
          <span>
            Encomenda <span className="font-mono font-semibold">{request.shipment.code}</span>
          </span>
          <span className="font-medium">Abrir para pesar e etiquetar →</span>
        </Link>
      ) : null}

      {type.requiredDocuments.length ? (
        <p className="mt-3 text-xs text-slate-500">
          Documentos a pedir: {type.requiredDocuments.join(", ")}.
        </p>
      ) : null}

      {actions.length > 0 && !readOnly ? (
        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
          {actions.includes("pickup_scheduled") ? (
            <Input
              label={request.handover === "recolha" ? "Data e hora da recolha" : "Data e hora para entregar na agência"}
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) => setScheduledFor(event.target.value)}
            />
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Nota para o cliente</span>
            <textarea rows={2} value={note} onChange={(event) => setNote(event.target.value)} className={fieldClasses} />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            {actions.map((to) => (
              <Button
                key={to}
                size="sm"
                variant={needsReason(to) ? "outline" : "primary"}
                disabled={busy}
                onClick={() => act(to)}
              >
                {needsReason(to) ? <XCircle className="h-3.5 w-3.5" /> : null}
                {actionLabels[to]}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function Contact({ title, name, phone, extra }: { title: string; name: string; phone: string; extra?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-1 font-medium text-slate-900">{name}</p>
      <a href={`tel:${phone}`} className="mt-0.5 flex items-center gap-1.5 text-brand-700 hover:text-brand-800">
        <Phone className="h-3.5 w-3.5" /> {phone}
      </a>
      {extra ? <p className="mt-0.5 text-slate-500">{extra}</p> : null}
    </div>
  );
}
