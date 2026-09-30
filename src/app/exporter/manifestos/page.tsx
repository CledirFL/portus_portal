import { SectionPage } from "@/components/ui/section-page";

export default function ManifestosPage() {
  return (
    <SectionPage
      title="Manifestos"
      description="Gestão de manifestos e validação documental."
      items={[
        { label: "Manifestos ativos", value: "57", tone: "success" },
        { label: "Pendentes", value: "9", tone: "warning" },
        { label: "Última validação", value: "Hoje", tone: "neutral" },
      ]}
    />
  );
}
