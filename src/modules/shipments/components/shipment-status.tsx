import { Badge } from "@/components/ui/badge";
import type { VolumeStatus } from "@/domain/state-machine";
import { shipmentStatusLabels, volumeStatusLabels, type ShipmentStatus } from "@/domain/status-labels";

const shipmentTones: Record<ShipmentStatus, "neutral" | "success" | "warning"> = {
  draft: "warning",
  validated: "success",
  cancelled: "neutral",
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return <Badge tone={shipmentTones[status]}>{shipmentStatusLabels[status]}</Badge>;
}

export function VolumeStatusBadge({ status }: { status: VolumeStatus }) {
  return <Badge tone={status === "draft" ? "warning" : "info"}>{volumeStatusLabels[status]}</Badge>;
}
