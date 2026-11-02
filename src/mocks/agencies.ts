import type { Agency } from "@/domain/agency";

const allIslands = ["Santiago", "São Vicente", "Sal", "Boa Vista", "Fogo", "Santo Antão", "São Nicolau", "Maio", "Brava"];

export const mockAgencies: Agency[] = [
  {
    id: "AG-LIS",
    code: "LIS01",
    name: "Morabeza Envios",
    country: "Portugal",
    city: "Lisboa (Amadora)",
    address: "Rua Elias Garcia 112, Amadora",
    phone: "+351 214 900 120",
    email: "lisboa@morabeza-envios.pt",
    islands: allIslands,
    categories: ["encomenda_pequena", "mudanca", "pecas_veiculo", "comercial", "especial"],
    offersPickup: true,
    nextDeparture: "2026-11-14",
    status: "active",
  },
  {
    id: "AG-SET",
    code: "SET01",
    name: "Djarfogo Cargas",
    country: "Portugal",
    city: "Setúbal",
    address: "Av. Luísa Todi 45, Setúbal",
    phone: "+351 265 300 410",
    email: "geral@djarfogo.pt",
    islands: ["Santiago", "Fogo", "Brava", "Maio"],
    categories: ["encomenda_pequena", "veiculo", "pecas_veiculo", "material_construcao", "maquinas"],
    offersPickup: true,
    nextDeparture: "2026-11-09",
    status: "active",
  },
  {
    id: "AG-OPO",
    code: "OPO01",
    name: "Atlântico Norte Transitários",
    country: "Portugal",
    city: "Porto (Matosinhos)",
    address: "Rua Roberto Ivens 800, Matosinhos",
    phone: "+351 229 380 220",
    email: "cv@atlanticonorte.pt",
    islands: ["São Vicente", "Santo Antão", "São Nicolau", "Sal", "Boa Vista"],
    categories: ["veiculo", "material_construcao", "maquinas", "comercial", "mudanca"],
    offersPickup: false,
    nextDeparture: "2026-11-20",
    status: "active",
  },
];

export function getAgency(id: string) {
  return mockAgencies.find((agency) => agency.id === id);
}
