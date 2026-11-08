"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Car } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ClearanceStatusBadge } from "@/modules/vehicles/clearance-parts";
import { listMyVehicles, type MyVehicle } from "@/services/api/vehicle-clearance";
import { useAuthStore } from "@/store/auth-store";

export default function MyVehiclesPage() {
  const user = useAuthStore((state) => state.user);
  const [vehicles, setVehicles] = useState<MyVehicle[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    listMyVehicles()
      .then(setVehicles)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar as viaturas."));
  }, [user]);

  return (
    <AppShell>
      <PageHeader
        title="As minhas viaturas"
        description="Faça aqui o desalfandegamento das viaturas que enviou para Cabo Verde: declaração, documentos, direitos, inspeção e matrícula."
      />
      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {vehicles === null ? (
        error ? null : <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : vehicles.length ? (
        <ul className="space-y-3" data-cy="my-vehicles">
          {vehicles.map((vehicle) => (
            <li key={vehicle.shipmentId} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-slate-500" aria-hidden />
                <div>
                  <p className="font-medium text-slate-900">{vehicle.vehicle}</p>
                  <p className="text-xs text-slate-500">
                    Encomenda <span className="font-mono">{vehicle.shipmentCode}</span>
                    {vehicle.plateNumber ? (
                      <>
                        {" "}
                        · matrícula <span className="font-mono">{vehicle.plateNumber}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ClearanceStatusBadge status={vehicle.status} />
                <Link href={`/cliente/viaturas/${vehicle.shipmentId}`}>
                  <Button size="sm" variant={vehicle.status ? "outline" : "primary"}>
                    {vehicle.status ? "Ver" : "Desalfandegar"}
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
          Ainda não há viaturas na sua conta. Aparecem aqui quando a agência fechar a encomenda da viatura.
        </div>
      )}
    </AppShell>
  );
}
