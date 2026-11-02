import { describe, expect, it } from "vitest";
import { agenciesFor, servedCountryCodes, type Agency } from "@/domain/agency";

const base: Omit<Agency, "id" | "countryCode"> = {
  code: "X",
  name: "X",
  city: "X",
  address: "X",
  phone: "+1",
  email: "x@x",
  islands: ["Santiago"],
  categories: ["encomenda_pequena"],
  offersPickup: true,
  status: "active",
};

const agencies: Agency[] = [
  { ...base, id: "pt", countryCode: "PT" },
  { ...base, id: "us", countryCode: "US", categories: ["veiculo"] },
  { ...base, id: "nl", countryCode: "NL", status: "inactive" },
];

describe("agenciesFor", () => {
  it("filters by origin country, cargo type and island", () => {
    expect(agenciesFor(agencies, { countryCode: "US", category: "veiculo", island: "Santiago" }).map((a) => a.id)).toEqual(["us"]);
    expect(agenciesFor(agencies, { countryCode: "US", category: "encomenda_pequena" })).toEqual([]);
  });

  it("only lists countries with an active agency", () => {
    expect(servedCountryCodes(agencies)).toEqual(["PT", "US"]);
  });
});
