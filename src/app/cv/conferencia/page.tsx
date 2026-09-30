import { SectionPage } from "@/components/ui/section-page";

export default function ConferenciaPage() {
  return (
    <SectionPage
      title="Conferência de contentores"
      description="Conferência e validação de contentores em operação."
      items={[
        { label: "Conferidos", value: "640", tone: "success" },
        { label: "Pendentes", value: "18", tone: "warning" },
        { label: "Com divergência", value: "4", tone: "neutral" },
      ]}
    />
  );
}
