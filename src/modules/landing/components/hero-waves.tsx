/**
 * Ondas no fundo do hero, com um navio pequeno a navegar. Só CSS: as ondas
 * têm dois períodos lado a lado e deslizam metade da largura em ciclo.
 * A onda da frente tem a cor da secção seguinte, para fazer a transição.
 */

const backWave = "M0 50 C240 18 480 18 720 50 S1200 82 1440 50 S1920 18 2160 50 S2640 82 2880 50 V90 H0 Z";
const frontWave = "M0 58 C240 82 480 82 720 58 S1200 34 1440 58 S1920 82 2160 58 S2640 34 2880 58 V90 H0 Z";

export function HeroWaves() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden" aria-hidden>
      <div className="absolute bottom-5 left-[8%] z-10 w-28 motion-safe:animate-float sm:left-[12%] sm:w-36">
        <svg viewBox="0 0 140 70" className="w-full motion-safe:animate-bob">
          <rect x="22" y="14" width="8" height="12" fill="#c2410c" />
          <rect x="16" y="24" width="22" height="20" rx="2" fill="#f8fafc" />
          <rect x="19" y="29" width="16" height="4" rx="1" fill="#1d3280" />
          <rect x="42" y="32" width="26" height="12" fill="#2a9d8f" />
          <rect x="42" y="20" width="26" height="12" fill="#e76f51" />
          <rect x="70" y="26" width="28" height="18" fill="#2552e3" />
          <rect x="100" y="32" width="24" height="12" fill="#f7c600" />
          <path d="M6 44 H134 L122 62 H18 Z" fill="#3b6ef0" />
          <rect x="6" y="44" width="128" height="3" fill="#f8fafc" />
          <path d="M12 54 H128 L122 62 H18 Z" fill="#c2410c" />
        </svg>
      </div>

      <svg viewBox="0 0 2880 90" preserveAspectRatio="none" className="absolute bottom-0 h-20 w-[200%] motion-safe:animate-swell">
        <path d={backWave} fill="#3b6ef0" opacity="0.35" />
      </svg>
      <svg
        viewBox="0 0 2880 90"
        preserveAspectRatio="none"
        className="absolute bottom-0 z-20 h-14 w-[200%] motion-safe:animate-swell [animation-duration:26s]"
      >
        <path d={frontWave} fill="var(--color-brand-50)" />
      </svg>
    </div>
  );
}
