export type ShipmentStatus = "Em trânsito" | "Validado" | "Pendente" | "Atrasado";

export interface Shipment {
  id: string;
  code: string;
  exporter: string;
  route: string;
  status: ShipmentStatus;
  eta: string;
  progress: number;
  volume: string;
}

export interface Voyage {
  id: string;
  ship: string;
  route: string;
  port: string;
  status: "Em rota" | "Atracado" | "Em operação";
  eta: string;
}

export const shipmentRows: Shipment[] = [
  {
    id: "SHP-2041",
    code: "BL-2024-001",
    exporter: "Atlantic Exports",
    route: "Mindelo → Rotterdam",
    status: "Em trânsito",
    eta: "12 Sep",
    progress: 72,
    volume: "2.8k TEU",
  },
  {
    id: "SHP-2042",
    code: "BL-2024-014",
    exporter: "Norte Mar Ltd.",
    route: "Praia → Antwerp",
    status: "Validado",
    eta: "15 Sep",
    progress: 90,
    volume: "1.9k TEU",
  },
  {
    id: "SHP-2043",
    code: "BL-2024-029",
    exporter: "Sao Vicente Cargo",
    route: "Tarrafal → Lisbon",
    status: "Pendente",
    eta: "18 Sep",
    progress: 42,
    volume: "3.1k TEU",
  },
  {
    id: "SHP-2044",
    code: "BL-2024-033",
    exporter: "Cabo Verde Trade",
    route: "Mindelo → Hamburg",
    status: "Atrasado",
    eta: "20 Sep",
    progress: 36,
    volume: "1.4k TEU",
  },
];

export const voyageRows: Voyage[] = [
  {
    id: "V-010",
    ship: "MV Atlantic Star",
    route: "Mindelo → Rotterdam",
    port: "Mindelo",
    status: "Em rota",
    eta: "18:30",
  },
  {
    id: "V-011",
    ship: "MV Cabo Verde",
    route: "Praia → Antwerp",
    port: "Praia",
    status: "Atracado",
    eta: "21:15",
  },
  {
    id: "V-012",
    ship: "MV Ocean Wave",
    route: "Tarrafal → Lisbon",
    port: "Tarrafal",
    status: "Em operação",
    eta: "08:00",
  },
  {
    id: "V-013",
    ship: "MV Horizon Blue",
    route: "Mindelo → Le Havre",
    port: "Mindelo",
    status: "Em rota",
    eta: "09:40",
  },
];

export const dashboardMetrics = [
  { label: "Embarques", value: "124", change: "+12%" },
  { label: "Volume total", value: "18.4k", change: "+8%" },
  { label: "BLs pendentes", value: "31", change: "-4%" },
  { label: "Gate Pass", value: "89", change: "+9%" },
];
