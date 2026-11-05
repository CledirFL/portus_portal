import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/public-header";
import { RequestByLink } from "@/modules/customer/components/request-by-link";

export const metadata: Metadata = {
  title: "O meu pedido · PORTUS",
  // Link pessoal: não deve aparecer em motores de busca.
  robots: { index: false, follow: false },
};

export default async function RequestLinkPage({ params }: PageProps<"/pedido/[token]">) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-semibold tracking-tight text-slate-900">O meu pedido</h1>
          <RequestByLink token={decodeURIComponent(token)} />
        </div>
      </main>
    </div>
  );
}
