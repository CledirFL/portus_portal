import { MapPin, Phone } from "lucide-react";
import { CargoTypeIcon } from "@/components/cargo-type-icon";
import { Card } from "@/components/ui/card";
import { getCargoType } from "@/domain/cargo-types";
import type { ShipmentRequest } from "@/domain/shipment-request";
import { RequestStatusBadge, RequestTimeline } from "@/modules/customer/components/request-status";

export function RequestCard({ request }: { request: ShipmentRequest }) {
  const cargoType = getCargoType(request.category);
  const { agency } = request;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <CargoTypeIcon icon={cargoType.icon} />
          </span>
          <div>
            <p className="font-mono text-sm font-semibold tracking-wider text-slate-900">{request.reference}</p>
            <p className="text-sm text-slate-500">
              {cargoType.publicLabel} · para {request.recipient.name}, {request.recipient.island}
            </p>
          </div>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <RequestTimeline request={request} />
        <div className="space-y-3 text-sm">
          <p className="text-slate-700">{request.description}</p>
          {request.scheduledFor ? (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-brand-800">
              {request.handover === "recolha" ? "Recolha marcada" : "Entrega na agência marcada"} para{" "}
              <strong>{new Date(request.scheduledFor).toLocaleString("pt-PT", { dateStyle: "full", timeStyle: "short" })}</strong>
            </p>
          ) : null}
          {request.agencyNote ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
              <span className="font-medium">Nota da agência:</span> {request.agencyNote}
            </p>
          ) : null}
          {agency ? (
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="font-medium text-slate-900">{agency.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> {agency.address}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-slate-500">
                <Phone className="h-3.5 w-3.5" /> {agency.phone}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
