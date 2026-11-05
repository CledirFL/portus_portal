import { apiRequest } from "@/lib/api-client";

/** Resumo do painel do administrador (RF-A36). */
export interface DashboardSummary {
  generatedAt: string;
  requests: { submitted: number; inProgress: number };
  volumesByStatus: Record<string, number>;
  clearances: Record<string, number>;
  arriving: Array<{ id: string; code: string; vesselName: string; arrivalPort: string; eta: string; volumes: number }>;
  manifestAlerts: { total: number; voyages: Array<{ id: string; code: string; vesselName: string; eta: string }> };
  pickup: { volumes: number; shipments: number; freeDays: number; abandonAfterDays: number; storage: { free: number; paying: number; nearAbandon: number } };
  payments: { monthCve: number; monthCount: number };
  last30Days: { shipments: number; byAgency: Array<{ name: string; count: number }>; byCountry: Array<{ code: string; count: number }> };
}

export function getDashboard() {
  return apiRequest<DashboardSummary>("/dashboard");
}
