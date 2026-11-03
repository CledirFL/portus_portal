import type { RequestStatus, ShipmentRequest, ShipmentRequestInput } from "@/domain/shipment-request";
import { ApiError, apiRequest } from "@/lib/api-client";

/** Pedido público; se houver sessão de cliente, a API associa-o à conta. */
export function submitShipmentRequest(input: ShipmentRequestInput) {
  return apiRequest<ShipmentRequest>("/shipment-requests", { method: "POST", body: input, auth: "optional" });
}

/** Consulta sem conta (código + telefone). Devolve null se não corresponder a nenhum pedido. */
export async function lookupShipmentRequest(reference: string, phone: string) {
  try {
    return await apiRequest<ShipmentRequest>("/shipment-requests/lookup", {
      method: "POST",
      body: { reference, phone },
      auth: "none",
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function listMyShipmentRequests() {
  return apiRequest<ShipmentRequest[]>("/me/shipment-requests");
}

export function listAgencyShipmentRequests(statuses?: RequestStatus[]) {
  const query = statuses?.length ? `?status=${statuses.join(",")}` : "";
  return apiRequest<ShipmentRequest[]>(`/agency/shipment-requests${query}`);
}

/** Endpoint da API para cada estado de destino. */
const agencyActionPaths: Record<Exclude<RequestStatus, "submitted">, string> = {
  accepted: "accept",
  pickup_scheduled: "schedule",
  converted: "receive",
  rejected: "reject",
  cancelled: "cancel",
};

export function agencyShipmentRequestAction(
  id: string,
  to: Exclude<RequestStatus, "submitted">,
  input: { note?: string; reason?: string; scheduledFor?: string },
) {
  return apiRequest<ShipmentRequest>(`/agency/shipment-requests/${id}/${agencyActionPaths[to]}`, {
    method: "POST",
    body: input,
  });
}
