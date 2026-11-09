import type { Money, VehicleRegimeRule, VehicleTaxEstimate, VehicleTaxSettings } from "@/domain/vehicle-taxes";
import { apiRequest } from "@/lib/api-client";

export type VehicleRegime = VehicleRegimeRule & { description: string | null; active: boolean };

export interface VehicleEstimateInput {
  regime: string;
  year: number;
  condition: "Novo" | "Usado";
  engineCc: number | null;
  fuel: string | null;
  /** País de onde envia (a taxa CEDEAO só se aplica de fora da CEDEAO). */
  dispatchCountry: string | null;
  value: Money;
  transport: Money;
  insurance: Money;
}

export type VehicleRegimeInput = Omit<VehicleRegime, "code">;

/** Regimes ativos (público); `all` inclui os inativos (administração). */
export const listVehicleRegimes = (all = false) => apiRequest<VehicleRegime[]>(`/vehicles/regimes${all ? "?all=true" : ""}`, { auth: all ? "required" : "none" });

/** Estimativa dos impostos (público): o valor final é o da Alfândega. */
export const estimateVehicleTaxes = (input: VehicleEstimateInput) =>
  apiRequest<VehicleTaxEstimate>("/vehicles/estimate", { method: "POST", body: input, auth: "none" });

export const getVehicleTaxSettings = () => apiRequest<VehicleTaxSettings>("/vehicles/tax-settings");

export const updateVehicleTaxSettings = (input: VehicleTaxSettings) =>
  apiRequest<VehicleTaxSettings>("/vehicles/tax-settings", { method: "PUT", body: input });

export const updateVehicleRegime = (code: string, input: VehicleRegimeInput) =>
  apiRequest<VehicleRegime>(`/vehicles/regimes/${code}`, { method: "PUT", body: input });
