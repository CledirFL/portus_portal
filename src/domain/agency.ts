import type { CargoCategory } from "@/domain/cargo-types";

export interface Agency {
  id: string;
  code: string;
  name: string;
  /** País onde a agência recebe a carga para enviar (ISO 3166-1 alfa-2). */
  countryCode: string;
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

export function agenciesFor(
  agencies: Agency[],
  filters: { countryCode?: string; category?: CargoCategory; island?: string },
) {
  return agencies.filter(
    (agency) =>
      agency.status === "active" &&
      (!filters.countryCode || agency.countryCode === filters.countryCode) &&
      (!filters.category || agency.categories.includes(filters.category)) &&
      (!filters.island || agency.islands.includes(filters.island)),
  );
}

/** Países com pelo menos uma agência ativa, para não oferecer origens sem serviço. */
export function servedCountryCodes(agencies: Agency[]) {
  return [...new Set(agencies.filter((agency) => agency.status === "active").map((agency) => agency.countryCode))];
}
