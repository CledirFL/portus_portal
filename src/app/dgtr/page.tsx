"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { ClearanceQueue } from "@/modules/vehicles/clearance-queue";

export default function DgtrPage() {
  return (
    <AppShell>
      <PageHeader
        title="Inspeção e matrícula"
        description="Viaturas com os direitos liquidados pela Alfândega: faça a inspeção técnica e, depois de pagos os direitos, emita a matrícula."
      />
      <ClearanceQueue
        hrefFor={(id) => `/dgtr/viaturas/${id}`}
        tabs={[
          { key: "inspection", label: "Por inspecionar", statuses: ["assessed"] },
          { key: "waiting", label: "À espera do pagamento", statuses: ["inspected"] },
          { key: "registration", label: "Por matricular", statuses: ["paid"] },
          { key: "done", label: "Matriculadas", statuses: ["registered"] },
        ]}
      />
    </AppShell>
  );
}
