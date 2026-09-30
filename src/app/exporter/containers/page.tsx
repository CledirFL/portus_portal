import { SectionPage } from "@/components/ui/section-page";

export default function ContainersPage() {
  return (
    <SectionPage
      title="Containers"
      description="Detalhes operacionais dos contentores por viagem."
      items={[
        { label: "Ativos", value: "412", tone: "success" },
        { label: "Em inspeção", value: "22", tone: "warning" },
        { label: "Aguardando descarga", value: "31", tone: "neutral" },
      ]}
    />
  );
}
