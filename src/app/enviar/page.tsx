import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { RequestWizard } from "@/modules/customer/components/request-wizard";

export const metadata: Metadata = {
  title: "Enviar encomenda · PORTUS",
  description: "Peça a uma agência o envio da sua carga para Cabo Verde, a partir do país onde está.",
};

export default function SendPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Pedido de envio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Enviar para Cabo Verde</h1>
          <p className="mt-2 text-slate-500">
            Diga-nos o que quer enviar e escolha a agência. Não precisa de conta e leva menos de 3 minutos.
          </p>
        </div>
        <RequestWizard />
      </main>
    </div>
  );
}
