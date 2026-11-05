import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

/** A área do exportador ainda não existe; os ecrãs de demonstração foram retirados. */
export default function ExporterHomePage() {
  return (
    <AppShell>
      <PageHeader title="Área do exportador" description="Esta área está em preparação." />
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="font-medium text-slate-900">Ainda não há funcionalidades para exportadores</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          Para enviar mercadoria para Cabo Verde, faça um pedido a uma agência ou contacte o seu transitário.
        </p>
        <Link href="/enviar" className="mt-5 inline-block">
          <Button>Enviar encomenda</Button>
        </Link>
      </div>
    </AppShell>
  );
}
