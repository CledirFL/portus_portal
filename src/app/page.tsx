import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, Search, ShieldCheck, Warehouse } from "lucide-react";
import { CargoTypeIcon } from "@/components/cargo-type-icon";
import { PublicHeader } from "@/components/layout/public-header";
import { RotatingText } from "@/components/ui/rotating-text";
import { cargoTypes } from "@/domain/cargo-types";
import { JourneyScroll } from "@/modules/landing/components/journey-scroll";

// Países de envio em destaque por agora; a preposição muda com o país.
const heroDispatchPlaces = ["em Portugal", "na América", "em França"];

const professionals = [
  { icon: Building2, title: "Agências e transitários", text: "Pedidos de clientes, recolhas, consolidação em BL Master e manifestos." },
  { icon: Warehouse, title: "Terminal", text: "Chegada de contentores, conferência por QR, ocorrências e armazém." },
  { icon: ShieldCheck, title: "Alfândega", text: "Validação de manifestos, canal verde ou vermelho, retenção e libertação." },
  { icon: FileCheck2, title: "Portaria", text: "Validação de documento e QR, pagamentos e emissão de Gate Pass." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60rem 30rem at 85% -10%, rgba(59,110,240,0.55), transparent 60%), radial-gradient(40rem 20rem at 0% 110%, rgba(247,198,0,0.18), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-brand-100">
              <span className="h-1.5 w-1.5 rounded-full bg-star" /> De qualquer país para Cabo Verde
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              <span className="sr-only">
                Do envio em Portugal, na América ou em França ao levantamento em Cabo Verde.
              </span>
              <span aria-hidden>
                Do envio <RotatingText items={heroDispatchPlaces} className="text-star" />
                {/* No telemóvel o resto vai para a linha seguinte, para o espaço reservado não ficar a meio. */}
                <br className="sm:hidden" /> ao levantamento em Cabo Verde.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-brand-100/80">
              Caixas, carros, mudanças ou material de construção. Escolha uma agência no país onde está, peça o envio em poucos minutos e acompanhe cada etapa até ao levantamento.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/enviar"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
              >
                Enviar encomenda <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/acompanhar"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-6 font-semibold text-white hover:bg-white/10"
              >
                <Search className="h-4 w-4" /> Acompanhar pedido
              </Link>
            </div>
            <p className="mt-4 text-sm text-brand-200/70">Sem conta obrigatória. Crie conta só se quiser ver todos os seus envios.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand-200/70">Exemplo de acompanhamento</p>
            <p className="mt-3 font-mono text-lg font-semibold tracking-widest">PED-7KQ2M9</p>
            <ol className="mt-5 space-y-4">
              {[
                ["Recolhido em Amadora", "3 caixas · 42 kg", true],
                ["Consolidado no contentor", "MSCU 482190-5", true],
                ["Em viagem para a Praia", "Chegada prevista 21 nov", true],
                ["Pronto para levantamento", "Armazém Enapor, Praia", false],
              ].map(([title, sub, done]) => (
                <li key={String(title)} className="flex gap-3">
                  <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${done ? "bg-star" : "border-2 border-white/30"}`} />
                  <span>
                    <span className={`block text-sm font-medium ${done ? "text-white" : "text-white/50"}`}>{title}</span>
                    <span className="block text-xs text-brand-200/60">{sub}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">O que pode enviar</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Qualquer carga, o mesmo processo.</h2>
          <p className="mt-3 text-slate-500">Cabo Verde importa quase tudo o que consome. Por isso tratamos de caixas pequenas a veículos com o mesmo acompanhamento.</p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cargoTypes.map((type) => (
            <Link
              key={type.id}
              href="/enviar"
              className="group rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 hover:shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white">
                <CargoTypeIcon icon={type.icon} />
              </span>
              <p className="mt-3 font-semibold text-slate-900">{type.publicLabel}</p>
              <p className="mt-0.5 text-sm text-slate-500">{type.examples}</p>
            </Link>
          ))}
        </div>
      </section>

      <JourneyScroll />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Para profissionais</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Uma plataforma para toda a cadeia.</h2>
          </div>
          <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:text-brand-800">
            Entrar na plataforma <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {professionals.map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-200 p-5">
              <item.icon className="h-5 w-5 text-brand-700" strokeWidth={1.75} />
              <p className="mt-4 font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:justify-between sm:px-6">
          <p>© 2026 PORTUS · Plataforma de encomendas para Cabo Verde</p>
          <Link href="/platform" className="hover:text-slate-800">Sobre a plataforma</Link>
        </div>
      </footer>
    </div>
  );
}
