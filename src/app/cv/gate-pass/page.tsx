import { SectionPage } from "@/components/ui/section-page";

export default function GatePassPage() {
  return (
    <SectionPage
      title="Gate Pass"
      description="Controle de entrada e saída dos contentores."
      items={[
        { label: "Emitidos", value: "94", tone: "success" },
        { label: "Válidos", value: "86", tone: "neutral" },
        { label: "Pendentes", value: "7", tone: "warning" },
      ]}
    />
  );
}
