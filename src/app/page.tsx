import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, Search, ShieldCheck, Ship, Warehouse } from "lucide-react";
import { CargoTypeIcon } from "@/components/cargo-type-icon";
import { PublicHeader } from "@/components/layout/public-header";
import { Reveal } from "@/components/ui/reveal";
import { RotatingText } from "@/components/ui/rotating-text";
import { cargoTypes } from "@/domain/cargo-types";
import { DispatchCountriesMarquee } from "@/modules/landing/components/dispatch-countries-marquee";
import { HeroWaves } from "@/modules/landing/components/hero-waves";
import { JourneyScroll } from "@/modules/landing/components/journey-scroll";

// Países de envio em destaque por agora; a preposição muda com o país.
const heroDispatchPlaces = ["em Portugal", "na América", "em França"];

const trackingExample = [
  { title: "Recolhido em Amadora", detail: "3 caixas · 42 kg", status: "done" },
  { title: "Consolidado no contentor", detail: "MSCU 482190-5", status: "done" },
  { title: "Em viagem para a Praia", detail: "Chegada prevista 21 nov", status: "current" },
  { title: "Pronto para levantamento", detail: "Armazém Enapor, Praia", status: "todo" },
] as const;

const professionals = [
  { icon: Building2, tone: "bg-brand-50 text-brand-700", title: "Agências e transitários", text: "Pedidos de clientes, recolhas, consolidação em BL Master e manifestos." },
  { icon: Warehouse, tone: "bg-teal-50 text-teal-700", title: "Terminal", text: "Chegada de contentores, conferência por QR, ocorrências e armazém." },
  { icon: ShieldCheck, tone: "bg-amber-50 text-amber-700", title: "Alfândega", text: "Validação de manifestos, canal verde ou vermelho, retenção e libertação." },
  { icon: FileCheck2, tone: "bg-rose-50 text-rose-700", title: "Portaria", text: "Validação de documento e QR, pagamentos e emissão de Gate Pass." },
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
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-32 pt-16 sm:px-6 sm:pb-36 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
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

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur motion-safe:animate-float">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand-200/70">Exemplo de acompanhamento</p>
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-star/15 px-2.5 py-1 text-xs font-medium text-star">
                <Ship className="h-3.5 w-3.5" /> Em viagem
              </span>
            </div>
            <p className="mt-3 font-mono text-lg font-semibold tracking-widest">PED-7KQ2M9</p>
            <ol className="relative mt-5 space-y-4">
              <span className="absolute bottom-2 left-1.5 top-2 w-px -translate-x-1/2 bg-white/15" aria-hidden />
              {trackingExample.map((item) => (
                <li key={item.title} className="relative flex gap-3">
                  <span className="relative mt-1 flex h-3 w-3 shrink-0">
                    {item.status === "current" && (
                      <span className="absolute inset-0 rounded-full bg-star opacity-75 motion-safe:animate-ping" />
                    )}
                    <span
                      className={`relative h-3 w-3 rounded-full ${
                        item.status === "todo" ? "border-2 border-white/30 bg-brand-950" : "bg-star"
                      }`}
                    />
                  </span>
                  <span>
                    <span className={`block text-sm font-medium ${item.status === "todo" ? "text-white/50" : "text-white"}`}>
                      {item.title}
                    </span>
                    <span className="block text-xs text-brand-200/60">{item.detail}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <HeroWaves />
      </section>

      <section className="relative overflow-hidden bg-brand-50">
        <div
          className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl"
          aria-hidden
        />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-star/20 blur-3xl" aria-hidden />

        <DispatchCountriesMarquee />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">O que pode enviar</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Qualquer carga, o mesmo processo.</h2>
            <p className="mt-3 text-slate-600">Cabo Verde importa quase tudo o que consome. Por isso tratamos de caixas pequenas a veículos com o mesmo acompanhamento.</p>
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cargoTypes.map((type, index) => (
              <Reveal key={type.id} delay={(index % 4) * 0.06}>
                <Link
                  href="/enviar"
                  className="group relative block h-full rounded-2xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-900/5 transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/10"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:scale-110 group-hover:bg-brand-700 group-hover:text-white">
                    <CargoTypeIcon icon={type.icon} />
                  </span>
                  <ArrowRight
                    className="absolute right-5 top-6 h-4 w-4 -translate-x-1 text-brand-700 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                    aria-hidden
                  />
                  <p className="mt-4 font-semibold text-slate-900">{type.publicLabel}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{type.examples}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <JourneyScroll />

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6">
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
          {professionals.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <div className="group h-full rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-110 ${item.tone}`}>
                  <item.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <p className="mt-4 font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Reveal className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-14 text-white shadow-2xl shadow-brand-900/30 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-star/25 blur-3xl" aria-hidden />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pronto para enviar para casa?</h2>
              <p className="mt-3 text-brand-100/85">
                Peça o envio em poucos minutos. A agência confirma, recolhe e mantém-no a par de cada etapa até ao levantamento.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/enviar"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-star px-6 font-semibold text-brand-950 shadow-sm transition hover:brightness-105"
              >
                Enviar encomenda <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/acompanhar"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/25 px-6 font-semibold text-white hover:bg-white/10"
              >
                <Search className="h-4 w-4" /> Acompanhar
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="bg-brand-950 text-brand-200/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:justify-between sm:px-6">
          <p>© 2026 PORTUS · Plataforma de encomendas para Cabo Verde</p>
          <Link href="/platform" className="hover:text-white">Sobre a plataforma</Link>
        </div>
      </footer>
    </div>
  );
}
