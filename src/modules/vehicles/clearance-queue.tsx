"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCve } from "@/domain/clearance";
import { ClearanceStatusBadge } from "@/modules/vehicles/clearance-parts";
import { listVehicleClearances, type VehicleClearanceStatus, type VehicleClearanceSummary } from "@/services/api/vehicle-clearance";
import { useAuthStore } from "@/store/auth-store";

export interface QueueTab {
  key: string;
  label: string;
  statuses: VehicleClearanceStatus[];
}

/** Fila de desalfandegamentos de viaturas do porto, por separadores de estado. */
export function ClearanceQueue({ tabs, hrefFor }: { tabs: QueueTab[]; hrefFor: (id: string) => string }) {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState(tabs[0]!.key);
  const [items, setItems] = useState<VehicleClearanceSummary[] | null>(null);
  const [error, setError] = useState("");
  const statuses = tabs.find((item) => item.key === tab)!.statuses;
  const statusKey = statuses.join(",");

  useEffect(() => {
    if (!user) return;
    let isCurrent = true;
    listVehicleClearances(statusKey.split(",") as VehicleClearanceStatus[])
      .then((list) => {
        if (!isCurrent) return;
        setItems(list);
        setError("");
      })
      .catch((cause: unknown) => {
        if (isCurrent) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as viaturas.");
      });
    return () => {
      isCurrent = false;
    };
  }, [user, statusKey]);

  return (
    <>
      <div className="mb-4 inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => {
              setTab(item.key);
              setItems(null);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === item.key ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {items === null ? (
        error ? null : <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : items.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm text-slate-700" data-cy="vehicle-queue">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Viatura</th>
                <th className="px-4 py-3 font-medium">Dono</th>
                <th className="px-4 py-3 font-medium">Navio</th>
                <th className="px-4 py-3 font-medium">Direitos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <Link href={hrefFor(item.id)} className="font-medium text-brand-700 hover:text-brand-800">
                      {item.vehicle}
                    </Link>
                    <p className="font-mono text-xs text-slate-400">
                      {item.shipmentCode}
                      {item.vin ? ` · ${item.vin}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {item.owner.name}
                    <p className="text-xs text-slate-400">{item.owner.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {item.vesselName ?? "—"}
                    <p className="text-xs text-slate-400">{item.arrived ? "Conferida no terminal" : "Ainda não conferida"}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">{item.assessedCve !== null ? formatCve(item.assessedCve) : "—"}</td>
                  <td className="px-4 py-3">
                    <ClearanceStatusBadge status={item.status} />
                    {item.plateNumber ? <p className="mt-1 font-mono text-xs">{item.plateNumber}</p> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">Não há viaturas nesta lista.</div>
      )}
    </>
  );
}
