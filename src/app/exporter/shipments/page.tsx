import { SectionPage } from "@/components/ui/section-page";

export default function ShipmentsPage() {
  return (
    <SectionPage
      title="Shipments"
      description="Lista consolidada dos embarques ativos e previstos."
      items={[
        { label: "Em andamento", value: "16", tone: "success" },
        { label: "Próximos", value: "8", tone: "neutral" },
        { label: "Atenção", value: "3", tone: "warning" },
      ]}
    />
  );
}
