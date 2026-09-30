import { SectionPage } from "@/components/ui/section-page";

export default function VolumesPage() {
  return (
    <SectionPage
      title="Volumes"
      description="Painel de volumes e capacidade por embarque."
      items={[
        { label: "TEUs total", value: "12.4k", tone: "success" },
        { label: "Capacidade livre", value: "3.1k", tone: "neutral" },
        { label: "Ajustes pendentes", value: "5", tone: "warning" },
      ]}
    />
  );
}
