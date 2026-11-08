"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ClearanceQueue } from "@/modules/vehicles/clearance-queue";

export default function CustomsVehiclesPage() {
  return (
    <AppShell>
      <PageHeader
        backHref="/alfandega"
        title="Viaturas"
        description="Desalfandegamento feito pelo dono: analise os documentos, peça correções, liquide os direitos e registe o pagamento. A inspeção e a matrícula são da DGTR."
      />
      <ClearanceQueue
        hrefFor={(id) => `/alfandega/viaturas/${id}`}
        tabs={[
          { key: "review", label: "Por analisar", statuses: ["submitted"] },
          { key: "changes", label: "Correções pedidas", statuses: ["changes_requested"] },
          { key: "inspection", label: "Na inspeção", statuses: ["assessed"] },
          { key: "payment", label: "Por pagar", statuses: ["inspected"] },
          { key: "done", label: "Pagas e matriculadas", statuses: ["paid", "registered"] },
        ]}
      />
    </AppShell>
  );
}
