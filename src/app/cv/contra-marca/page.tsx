import { SectionPage } from "@/components/ui/section-page";

export default function ContraMarcaPage() {
  return (
    <SectionPage
      title="Contra-Marca"
      description="Registro e acompanhamento de contra-marca por operação."
      items={[
        { label: "Total", value: "41", tone: "success" },
        { label: "Aprovadas", value: "28", tone: "neutral" },
        { label: "Pendentes", value: "6", tone: "warning" },
      ]}
    />
  );
}
