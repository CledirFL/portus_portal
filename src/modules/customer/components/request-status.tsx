import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  requestStatusDescriptions,
  requestStatusLabels,
  type RequestStatus,
  type ShipmentRequest,
} from "@/domain/shipment-request";

const tones: Record<RequestStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  submitted: "warning",
  accepted: "info",
  pickup_scheduled: "info",
  converted: "success",
  rejected: "danger",
  cancelled: "neutral",
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={tones[status]}>{requestStatusLabels[status]}</Badge>;
}

const happyPath: RequestStatus[] = ["submitted", "accepted", "pickup_scheduled", "converted"];

export function RequestTimeline({ request }: { request: ShipmentRequest }) {
  const closed = request.status === "rejected" || request.status === "cancelled";
  const reached = new Set<RequestStatus>(["submitted", ...request.history.map((change) => change.to)]);
  const dateFor = (status: RequestStatus) =>
    request.history.find((change) => change.to === status)?.at ?? (status === "submitted" ? request.createdAt : undefined);

  const steps = closed
    ? [...happyPath.filter((status) => reached.has(status)), request.status]
    : happyPath;

  return (
    <ol className="space-y-0">
      {steps.map((status, index) => {
        const done = reached.has(status);
        const current = status === request.status;
        const date = dateFor(status);
        const isClosedStep = closed && current;

        return (
          <li key={status} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 ? (
              <span className={`absolute left-[11px] top-6 h-full w-px ${done ? "bg-brand-300" : "bg-slate-200"}`} aria-hidden />
            ) : null}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                isClosedStep
                  ? "bg-rose-100 text-rose-600"
                  : done
                    ? "bg-brand-700 text-white"
                    : "border-2 border-slate-200 bg-white"
              }`}
            >
              {isClosedStep ? <X className="h-3.5 w-3.5" /> : done ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
            <div className="-mt-0.5">
              <p className={`text-sm font-medium ${done ? "text-slate-900" : "text-slate-400"}`}>{requestStatusLabels[status]}</p>
              {current ? <p className="text-xs text-slate-500">{requestStatusDescriptions[status]}</p> : null}
              {done && date ? (
                <p className="text-xs text-slate-400">
                  {new Date(date).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
