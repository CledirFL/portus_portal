import Link from "next/link";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    title: "Operações em tempo real",
    text: "Acompanhe embarques, roteiros, documentos e alertas num painel único e atualizado para todos os stakeholders.",
  },
  {
    title: "Fluxo documentário",
    text: "Centralize BL, manifestos, gate passes e validações com regras de aprovação por perfil e departamento.",
  },
  {
    title: "Controlo de acessos",
    text: "Cada(role) tem um conjunto de permissões alinhado com as responsabilidades da empresa, minando erros de operação.",
  },
];

export default function PlatformDetailsPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-700">PORTUS</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">
            A plataforma que reúne a operação portuária e a documentação de carga.
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-600">
            O PORTUS foi pensado para dar visibilidade total a cada ator da cadeia logística, reduzindo atrasos, aumentando a segurança documental e melhorando a decisão operacional.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login">
              <Button>Entrar no portal</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Voltar à homepage</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-xl text-sky-700">
                ✦
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
