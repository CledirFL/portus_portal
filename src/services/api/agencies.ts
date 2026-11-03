import type { Agency } from "@/domain/agency";
import type { CargoCategory } from "@/domain/cargo-types";
import { apiRequest } from "@/lib/api-client";

interface ApiAgency {
  id: string;
  code: string;
  name: string;
  countryCode: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  islands: string[];
  categories: CargoCategory[];
  offersPickup: boolean;
  nextDeparture: string | null;
}

/** Agências ativas (a API só devolve as ativas). */
export async function fetchAgencies(): Promise<Agency[]> {
  const agencies = await apiRequest<ApiAgency[]>("/agencies", { auth: "none" });
  return agencies.map((agency) => ({ ...agency, nextDeparture: agency.nextDeparture ?? undefined, status: "active" }));
}
