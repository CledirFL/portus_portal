"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, Inbox, PackageCheck, Phone, Truck, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CargoTypeIcon } from "@/components/cargo-type-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, fieldClasses } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { listRequestsByAgency, updateRequestStatus } from "@/data/requests-repository";
import { getCargoType } from "@/domain/cargo-types";
import { nextRequestStatuses, type RequestStatus, type ShipmentRequest } from "@/domain/shipment-request";
import { getAgency } from "@/mocks/agencies";
import { RequestStatusBadge } from "@/modules/customer/components/request-status";
import { useAuthStore } from "@/store/auth-store";

const filters: Array<{ key: string; label: string; statuses: RequestStatus[] }> = [
  { key: "open", label: "Por tratar", statuses: ["Submetido"] },
  { key: "progress", label: "Em curso", statuses: ["Aceite", "Recolha agendada"] },
  { key: "closed", label: "Fechados", statuses: ["Convertido", "Recusado", "Cancelado"] },
];

const actionLabels: Partial<Record<RequestStatus, string>> = {
  Aceite: "Aceitar",
  "Recolha agendada": "Agendar",
  Convertido: "Carga recebida",
  Recusado: "Recusar",
  Cancelado: "Cancelar",
};

export default function AgencyRequestsPage() {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [filter, setFilter] = useState("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Admin vê todas as agências; o agente só a sua (BR 28).
  const agencyId = user?.role === "admin" ? undefined : user?.agencyId;
  const agency = agencyId ? getAgency(agencyId) : undefined;

  const reload = useCallback(() => {
    void listRequestsByAgency(agencyId).then(setRequests);
  }, [agencyId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const counts = useMemo(
    () => Object.fromEntries(filters.map((item) => [item.key, requests.filter((request) => item.statuses.includes(request.status)).length])),
    [requests],
  );
  const visible = requests.filter((request) => filters.find((item) => item.key === filter)?.statuses.includes(request.status));
  const selected = requests.find((request) => request.id === selectedId) ?? visible[0];

  return (
    <AppShell>
      <PageHeader
        eyebrow={agency?.name ?? "Todas as agências"}
        title="Pedidos de clientes"
        description="Pedidos feitos no portal público. Confirme os dados com o cliente antes de registar a encomenda."
      />

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
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{type.publicLabel}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {selected ? <RequestPanel key={selected.id} request={selected} userId={user?.id ?? ""} onChange={reload} /> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
          Sem pedidos nesta lista. Os pedidos feitos em <span className="font-medium text-slate-700">/enviar</span> aparecem aqui.
        </div>
      )}
    </AppShell>
  );
}

function RequestPanel({ request, userId, onChange }: { request: ShipmentRequest; userId: string; onChange: () => void }) {
  const type = getCargoType(request.category);
  const [scheduledFor, setScheduledFor] = useState(request.scheduledFor?.slice(0, 16) ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const act = async (to: RequestStatus) => {
    setError("");
    if ((to === "Recusado" || to === "Cancelado") && !note.trim()) {
      setError("Indique o motivo para o cliente.");
      return;
    }
    if (to === "Recolha agendada" && !scheduledFor) {
      setError("Escolha a data e hora.");
      return;
    }
    try {
      await updateRequestStatus(
        request.id,
        to,
        { userId, reason: note.trim() || undefined },
        {
          ...(to === "Recolha agendada" ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}),
          ...(note.trim() ? { agencyNote: note.trim() } : {}),
        },
      );
      setNote("");
      onChange();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o pedido.");
    }
  };

  const actions = nextRequestStatuses(request.status);

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
        <Contact title="Remetente" name={request.sender.name} phone={request.sender.phone} extra={request.sender.email} />
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

      {type.requiredDocuments.length ? (
        <p className="mt-3 text-xs text-slate-500">
          Documentos a pedir: {type.requiredDocuments.join(", ")}.
        </p>
      ) : null}

      {actions.length ? (
        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
          {actions.includes("Recolha agendada") ? (
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
                variant={to === "Recusado" || to === "Cancelado" ? "outline" : "primary"}
                onClick={() => act(to)}
              >
                {to === "Recusado" || to === "Cancelado" ? <XCircle className="h-3.5 w-3.5" /> : null}
                {actionLabels[to] ?? to}
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
