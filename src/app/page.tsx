import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Visão operacional",
    description: "Dashboard central com indicadores de carga, operações e alertas críticos em tempo real.",
  },
  {
    title: "Rastreio por papelada",
    description: "Gerir BL, manifestos, gate passes e validações de forma colaborativa entre agentes e exportadores.",
  },
  {
    title: "Controlo de acesso",
    description: "Perfis por função com regras de navegação e privilégios para cada equipa da cadeia logística.",
  },
];

const roles = [
  { name: "Exportador", text: "Acompanhar cargas, documentação e entregas." },
  { name: "Transitário", text: "Coordenar navegação, cargas e logística documental." },
  { name: "Agente Marítimo", text: "Monitorizar navios, gate passes e operações portuárias." },
  { name: "Operador CV", text: "Validar controlo, auditoria e marcações." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-sky-300">PORTUS</p>
            <p className="mt-2 text-lg font-semibold">Portal de operações</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/platform">
              <Button variant="ghost" className="border border-slate-700 text-slate-100 hover:bg-slate-800">
                Conhecer a plataforma
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" className="text-slate-900">
                Criar conta
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="primary">Entrar</Button>
            </Link>
          </div>
        </header>

        <div className="grid items-center gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-200">
              Operações portuárias em Cabo Verde
            </p>
            <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white md:text-6xl">
              Centralize a operação, a documentação e o controlo de carga.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              O PORTUS conecta exportadores, transitários, agentes marítimos e operadores num único portal, com visibilidade clara para cada etapa da cadeia logística.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button className="px-6 py-3">Criar conta</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="px-6 py-3 text-slate-100 hover:bg-slate-800">
                  Entrar
                </Button>
              </Link>
              <Link href="/platform">
                <Button variant="ghost" className="px-6 py-3 text-slate-100 hover:bg-slate-800">
                  Ver detalhes
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-3xl font-semibold text-sky-300">24/7</p>
                <p className="mt-2 text-sm text-slate-300">Monitorização</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-3xl font-semibold text-sky-300">91%</p>
                <p className="mt-2 text-sm text-slate-300">Documentação validada</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-3xl font-semibold text-sky-300">5 roles</p>
                <p className="mt-2 text-sm text-slate-300">Perfis de operação</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-sky-950/20">
            <div className="rounded-2xl bg-slate-950 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Resumo</p>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2">
                  <span className="text-sm text-slate-300">Embarques ativos</span>
                  <span className="text-xl font-semibold text-white">24</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2">
                  <span className="text-sm text-slate-300">Volume em TEUs</span>
                  <span className="text-xl font-semibold text-white">7.8k</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2">
                  <span className="text-sm text-slate-300">BLs pendentes</span>
                  <span className="text-xl font-semibold text-amber-300">11</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-3 lg:px-8">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="mb-4 h-11 w-11 rounded-xl bg-sky-500/15 text-lg flex items-center justify-center">✦</div>
              <h2 className="text-xl font-semibold text-white">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-sky-300">Público alvo</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Estrutura pensada para cada actor da operação</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => (
            <div key={role.name} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-sky-300">Perfil</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{role.name}</h3>
              <p className="mt-3 text-sm text-slate-300">{role.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
