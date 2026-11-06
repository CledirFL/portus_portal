import type { RequestStatus, ShipmentRequest, ShipmentRequestInput } from "@/domain/shipment-request";
import { ApiError, apiRequest } from "@/lib/api-client";

/** Pedido público; se houver sessão de cliente, a API associa-o à conta. Devolve o token do link pessoal. */
export function submitShipmentRequest(input: ShipmentRequestInput) {
  return apiRequest<ShipmentRequest & { accessToken: string }>("/shipment-requests", { method: "POST", body: input, auth: "optional" });
}

/** Pedido aberto pelo link pessoal enviado por email. Devolve null se o link não for válido. */
export async function openShipmentRequestByLink(token: string) {
  try {
    return await apiRequest<ShipmentRequest>("/shipment-requests/access", { method: "POST", body: { token }, auth: "none" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export function cancelShipmentRequestByLink(token: string, reason?: string) {
  return apiRequest<ShipmentRequest>("/shipment-requests/access/cancel", { method: "POST", body: { token, reason }, auth: "none" });
}

export function cancelShipmentRequestByLookup(reference: string, phone: string, reason?: string) {
  return apiRequest<ShipmentRequest>("/shipment-requests/lookup/cancel", {
    method: "POST",
    body: { reference, phone, reason },
    auth: "none",
  });
}

export function cancelMyShipmentRequest(id: string, reason?: string) {
  return apiRequest<ShipmentRequest>(`/me/shipment-requests/${id}/cancel`, { method: "POST", body: { reason } });
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

/** Pedidos feitos sem conta com o email desta conta, que podem ser juntados. */
export function countClaimableRequests() {
  return apiRequest<{ count: number; email: string }>("/me/shipment-requests/claimable");
}

/** Envia para o email da conta um código de 6 algarismos (15 minutos). */
export function requestClaimCode() {
  return apiRequest<{ count: number; email: string; expiresAt: string }>("/me/shipment-requests/claim", { method: "POST" });
}

export function confirmClaimCode(code: string) {
  return apiRequest<{ linked: number }>("/me/shipment-requests/claim/confirm", { method: "POST", body: { code } });
}
