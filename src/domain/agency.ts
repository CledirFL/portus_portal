import type { CargoCategory } from "@/domain/cargo-types";

export interface Agency {
  id: string;
  code: string;
  name: string;
  country: "Portugal" | "Cabo Verde";
  city: string;
  address: string;
  phone: string;
  email: string;
  /** Ilhas de destino para onde a agência envia. */
  islands: string[];
  categories: CargoCategory[];
  offersPickup: boolean;
  nextDeparture?: string;
  status: "active" | "inactive";
}

export function agenciesFor(agencies: Agency[], filters: { category?: CargoCategory; island?: string }) {
  return agencies.filter(
    (agency) =>
      agency.status === "active" &&
      (!filters.category || agency.categories.includes(filters.category)) &&
      (!filters.island || agency.islands.includes(filters.island)),
  );
}
