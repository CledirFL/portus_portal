"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ShipmentForm } from "@/modules/shipments/components/shipment-form";
import { createShipment } from "@/services/api/shipments";

export default function NewShipmentPage() {
  const router = useRouter();

  return (
    <AppShell>
      <PageHeader
        backHref="/agencia/encomendas"
        title="Nova encomenda"
        description="Registe a carga recebida no balcão. Fica em rascunho até validar; depois imprime as etiquetas."
      />
      <ShipmentForm
        withVolumes
        submitLabel="Guardar rascunho"
        onSubmit={async ({ fields, volumes, agencyId }) => {
          const shipment = await createShipment({ ...fields, volumes, agencyId });
          router.push(`/agencia/encomendas/${shipment.id}`);
        }}
      />
    </AppShell>
  );
}
