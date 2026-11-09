"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Calculator } from "lucide-react";
import { formatCve } from "@/domain/clearance";
import { type VehicleCurrency, vehicleCurrencies, type VehicleTaxEstimate } from "@/domain/vehicle-taxes";
import { estimateVehicleTaxes, type VehicleEstimateInput } from "@/services/api/vehicles";

const toNumber = (value: string | undefined) => {
  const parsed = Number((value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const currencyOf = (value: string | undefined): VehicleCurrency =>
  (vehicleCurrencies as readonly string[]).includes(value ?? "") ? (value as VehicleCurrency) : "EUR";

/** Aviso da estimativa, igual em todo o lado. */
export const estimateDisclaimer =
  "Estimativa baseada na Pauta Aduaneira 2026 (posição 8703 — ligeiros de passageiros). O ICE ad valorem incide sobre (CIF + DI); a base oficial e o código SH exato podem variar. Os valores oficiais são os liquidados pela Direção Geral das Alfândegas (DGA).";

/** Dados da estimativa a partir dos detalhes da viatura; null enquanto faltar o essencial. */
export function estimateInputFrom(details: Record<string, string | undefined>, dispatchCountry: string | null): VehicleEstimateInput | null {
  const year = toNumber(details.year);
  const value = toNumber(details.value);
  if (!details.regime || !year || !value || (details.condition !== "Novo" && details.condition !== "Usado")) return null;
  return {
    regime: details.regime,
    year,
    condition: details.condition,
    engineCc: toNumber(details.engineCc),
    fuel: details.fuel || null,
    dispatchCountry: dispatchCountry || null,
    value: { amount: value, currency: currencyOf(details.valueCurrency) },
    // A agência regista o transporte e o seguro em euros.
    transport: { amount: toNumber(details.transportCostEur) ?? 0, currency: "EUR" },
    insurance: { amount: toNumber(details.insuranceCostEur) ?? 0, currency: "EUR" },
  };
}

/** Linhas da estimativa ou da liquidação (DI, ICE, CEDEAO, IVA, TEA), com o escalão da Pauta. */
export function TaxLines({ estimate, totalLabel = "Total estimado", totalCve }: { estimate: VehicleTaxEstimate; totalLabel?: string; totalCve?: number }) {
  return (
    <table className="mt-2 w-full text-sm">
      <tbody>
        <tr className="border-b border-slate-200">
          <td className="py-1 text-slate-500">Valor aduaneiro (CIF: compra + transporte + seguro)</td>
          <td className="py-1 text-right tabular-nums text-slate-500">{formatCve(estimate.customsValueCve)}</td>
        </tr>
        {estimate.lines.map((line) => (
          <tr key={line.code} className="border-b border-slate-100">
            <td className="py-1 text-slate-700">
              {line.label}
              {line.ratePct !== null && line.ratePct > 0 ? <span className="text-slate-400"> · {line.ratePct.toLocaleString("pt-PT")} %</span> : null}
              {line.code === "duty" ? <span className="block text-xs text-slate-400">{estimate.tariffLine}</span> : null}
            </td>
            <td className="py-1 text-right tabular-nums">{formatCve(line.amountCve)}</td>
          </tr>
        ))}
        <tr>
          <td className="pt-2 font-semibold">{totalLabel}</td>
          <td className="pt-2 text-right font-semibold tabular-nums" data-cy="vehicle-estimate-total">
            {formatCve(totalCve ?? estimate.totalCve)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Estimativa dos impostos da viatura em Cabo Verde (com os valores configurados no backoffice). */
export function VehicleEstimate({ details, dispatchCountry }: { details: Record<string, string | undefined>; dispatchCountry: string | null }) {
  const input = estimateInputFrom(details, dispatchCountry);
  const key = input ? JSON.stringify(input) : "";
  const [result, setResult] = useState<{ key: string; estimate: VehicleTaxEstimate | null; error: string }>({ key: "", estimate: null, error: "" });

  useEffect(() => {
    if (!key) return;
    let isCurrent = true;
    // Espera que se acabe de escrever antes de pedir a estimativa.
    const timer = setTimeout(() => {
      estimateVehicleTaxes(JSON.parse(key) as VehicleEstimateInput)
        .then((estimate) => {
          if (isCurrent) setResult({ key, estimate, error: "" });
        })
        .catch((cause: unknown) => {
          if (isCurrent) setResult({ key, estimate: null, error: cause instanceof Error ? cause.message : "Não foi possível calcular a estimativa." });
        });
    }, 400);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [key]);

  const current = result.key === key ? result : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm" data-cy="vehicle-estimate">
      <p className="flex items-center gap-2 font-semibold text-slate-900">
        <Calculator className="h-4 w-4" aria-hidden /> Estimativa dos impostos em Cabo Verde
      </p>
      {!input ? (
        <p className="mt-1 text-slate-500">Indique o uso da viatura, o ano, se é nova ou usada e o valor de compra para ver a estimativa.</p>
      ) : !current ? (
        <p className="mt-1 text-slate-500">A calcular…</p>
      ) : current.error ? (
        <p className="mt-1 text-rose-700">{current.error}</p>
      ) : current.estimate ? (
        <>
          {current.estimate.issues.length ? (
            <ul className="mt-2 space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-amber-900" data-cy="vehicle-estimate-issues">
              {current.estimate.issues.map((issue) => (
                <li key={issue} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {issue} Este regime não se aplica: escolha outro uso.
                </li>
              ))}
            </ul>
          ) : null}
          <TaxLines estimate={current.estimate} />
          <p className="mt-2 text-xs text-slate-500">
            {estimateDisclaimer} Viatura com {current.estimate.ageYears} ano(s). Não inclui o transporte, as taxas do porto nem a matrícula.
          </p>
        </>
      ) : null}
    </div>
  );
}
