import { createId, readCollection, writeCollection } from "@/data/browser-store";
import {
  createShipmentRequest,
  generateRequestReference,
  matchesPublicLookup,
  transitionRequest,
  type RequestStatus,
  type ShipmentRequest,
  type ShipmentRequestInput,
} from "@/domain/shipment-request";

const storageKey = "portus-shipment-requests";

function load() {
  return readCollection<ShipmentRequest>(storageKey);
}

function uniqueReference(existing: ShipmentRequest[]) {
  const used = new Set(existing.map((request) => request.reference));
  let reference = generateRequestReference();
  while (used.has(reference)) {
    reference = generateRequestReference();
  }
  return reference;
}

export async function submitShipmentRequest(input: ShipmentRequestInput, customerId?: string) {
  const requests = load();
  const request = createShipmentRequest(input, {
    id: createId(),
    reference: uniqueReference(requests),
    customerId,
  });
  writeCollection(storageKey, [request, ...requests]);
  return request;
}

export async function findRequestPublic(reference: string, phone: string) {
  return load().find((request) => matchesPublicLookup(request, reference, phone)) ?? null;
}

export async function listRequestsByCustomer(customerId: string) {
  return load().filter((request) => request.customerId === customerId);
}

export async function listRequestsByAgency(agencyId?: string) {
  const requests = load();
  return agencyId ? requests.filter((request) => request.agencyId === agencyId) : requests;
}

export async function attachRequestsToCustomer(requestIds: string[], customerId: string) {
  const ids = new Set(requestIds);
  writeCollection(
    storageKey,
    load().map((request) => (ids.has(request.id) && !request.customerId ? { ...request, customerId } : request)),
  );
}

export async function updateRequestStatus(
  requestId: string,
  to: RequestStatus,
  actor: { userId: string; reason?: string },
  changes: Partial<Pick<ShipmentRequest, "scheduledFor" | "agencyNote">> = {},
) {
  const requests = load();
  const current = requests.find((request) => request.id === requestId);
  if (!current) {
    throw new Error("Pedido não encontrado.");
  }

  const updated = { ...transitionRequest(current, to, actor), ...changes };
  writeCollection(
    storageKey,
    requests.map((request) => (request.id === requestId ? updated : request)),
  );
  return updated;
}
