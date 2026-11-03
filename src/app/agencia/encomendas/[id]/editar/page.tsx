"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ShipmentForm, shipmentToForm } from "@/modules/shipments/components/shipment-form";
import { getShipment, updateShipment, type Shipment } from "@/services/api/shipments";
import { useAuthStore } from "@/store/auth-store";

export default function EditShipmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getShipment(id)
      .then(setShipment)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar a encomenda."));
  }, [id, user]);

  return (
    <AppShell>
      <PageHeader
        backHref={`/agencia/encomendas/${id}`}
        title={shipment ? `Editar ${shipment.code}` : "Editar encomenda"}
        description="Os volumes acrescentam-se e removem-se no detalhe da encomenda."
      />
      {error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : shipment && shipment.status !== "draft" ? (
        <p className="text-sm text-slate-600">Esta encomenda já não está em rascunho e não pode ser editada.</p>
      ) : shipment ? (
        <ShipmentForm
          initialValues={shipmentToForm(shipment)}
          withVolumes={false}
          submitLabel="Guardar alterações"
          onSubmit={async ({ fields }) => {
            await updateShipment(shipment.id, fields);
            router.push(`/agencia/encomendas/${shipment.id}`);
          }}
        />
      ) : (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      )}
    </AppShell>
  );
}
