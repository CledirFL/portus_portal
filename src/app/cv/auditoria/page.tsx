import { SectionPage } from "@/components/ui/section-page";

export default function AuditoriaPage() {
  return (
    <SectionPage
      title="Auditoria"
      description="Registos e verificações de conformidade."
      items={[
        { label: "Auditorias", value: "23", tone: "success" },
        { label: "Não conformes", value: "2", tone: "warning" },
        { label: "Concluídas", value: "19", tone: "neutral" },
      ]}
    />
  );
}
