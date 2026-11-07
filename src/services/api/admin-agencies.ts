import type { CargoCategory } from "@/domain/cargo-types";
import { apiRequest } from "@/lib/api-client";

export type AgencyKind = "origin" | "destination";

export interface AgencyBrief {
  id: string;
  code: string;
  name: string;
  city: string;
  islands: string[];
}

/** Agência vista pelo administrador, com as ligações origem ↔ Cabo Verde. */
export interface AdminAgency extends AgencyBrief {
  kind: AgencyKind;
  status: "active" | "inactive";
  countryCode: string;
  address: string;
  phone: string;
  email: string;
  categories: CargoCategory[];
  offersPickup: boolean;
  /** Origem: agências em Cabo Verde que entregam as suas encomendas pequenas. */
  destinations: AgencyBrief[];
  /** Cabo Verde: agências de origem de quem recebe encomendas. */
  origins: AgencyBrief[];
}

export interface AgencyInput {
  code: string;
  name: string;
  kind: AgencyKind;
  countryCode: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  islands: string[];
  categories: CargoCategory[];
  offersPickup: boolean;
  status: "active" | "inactive";
}

export const agencyKindLabels: Record<AgencyKind, string> = { origin: "Agência de origem", destination: "Agência em Cabo Verde" };

export const listAdminAgencies = () => apiRequest<AdminAgency[]>("/admin/agencies");
export const getAdminAgency = (id: string) => apiRequest<AdminAgency>(`/admin/agencies/${id}`);
export const createAgency = (input: AgencyInput) => apiRequest<AdminAgency>("/admin/agencies", { method: "POST", body: input });
export const updateAgency = (id: string, input: AgencyInput) => apiRequest<AdminAgency>(`/admin/agencies/${id}`, { method: "PUT", body: input });
export const setAgencyPartners = (id: string, destinationAgencyIds: string[]) =>
  apiRequest<AdminAgency>(`/admin/agencies/${id}/partners`, { method: "PUT", body: { destinationAgencyIds } });

/** Agências em Cabo Verde da agência de origem para a ilha do destinatário (registo da encomenda). */
export const listDestinationAgencies = (island: string, agencyId?: string) =>
  apiRequest<Array<{ id: string; code: string; name: string; city: string; address: string; phone: string }>>(
    `/agencies/destinations?island=${encodeURIComponent(island)}${agencyId ? `&agencyId=${agencyId}` : ""}`,
  );
