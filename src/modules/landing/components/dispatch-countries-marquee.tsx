import { dispatchCountries } from "@/domain/countries";

/**
 * Faixa contínua com os países de onde se pode enviar. A lista aparece duas
 * vezes seguidas para o ciclo da animação (metade da largura) não ter costura.
 */
export function DispatchCountriesMarquee() {
  return (
    <div className="relative border-b border-brand-100/80 py-5">
      <p className="sr-only">Pode enviar de: {dispatchCountries.map((country) => country.name).join(", ")}.</p>
      <div
        className="group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        aria-hidden
      >
        <div className="flex w-max shrink-0 gap-3 pr-3 motion-safe:animate-marquee group-hover:[animation-play-state:paused]">
          {[...dispatchCountries, ...dispatchCountries].map((country, index) => (
            <span
              key={`${country.code}-${index}`}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
            >
              <span className="rounded bg-brand-700 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-white">
                {country.code}
              </span>
              {country.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
