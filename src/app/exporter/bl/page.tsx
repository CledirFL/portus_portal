import { SectionPage } from "@/components/ui/section-page";

export default function BlPage() {
  return (
    <SectionPage
      title="BL / BL Master"
      description="Documentação de bordo e master BL em revisão."
      items={[
        { label: "BLs emitidos", value: "180", tone: "success" },
        { label: "Pendentes", value: "12", tone: "warning" },
        { label: "Aprovados hoje", value: "34", tone: "neutral" },
      ]}
    />
  );
}
