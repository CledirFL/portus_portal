import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { RequestLookup } from "@/modules/customer/components/request-lookup";

export const metadata: Metadata = {
  title: "Acompanhar pedido · PORTUS",
};

export default async function TrackPage({ searchParams }: PageProps<"/acompanhar">) {
  const { codigo } = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto mb-8 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Acompanhar pedido</h1>
          <p className="mt-2 text-slate-500">Introduza o código que recebeu ao fazer o pedido.</p>
        </div>
        <RequestLookup initialReference={typeof codigo === "string" ? codigo : ""} />
      </main>
    </div>
  );
}
