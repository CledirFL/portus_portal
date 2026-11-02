import Link from "next/link";

interface LogoProps {
  tone?: "light" | "dark";
  href?: string;
}

/** Marca PORTUS: onda + estrela (referência às estrelas da bandeira de Cabo Verde). */
export function Logo({ tone = "dark", href = "/" }: LogoProps) {
  const text = tone === "light" ? "text-white" : "text-slate-900";
  const sub = tone === "light" ? "text-brand-200" : "text-slate-500";

  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" aria-hidden>
          <path
            d="M3 15c2 0 2-1.5 4.5-1.5S9.5 15 12 15s2-1.5 4.5-1.5S18.5 15 21 15M3 19c2 0 2-1.5 4.5-1.5S9.5 19 12 19s2-1.5 4.5-1.5S18.5 19 21 19"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="m12 3 1.2 2.6 2.8.3-2.1 1.9.6 2.8L12 9.2l-2.5 1.4.6-2.8L8 5.9l2.8-.3L12 3Z" fill="var(--color-star)" />
        </svg>
      </span>
      <span className="leading-none">
        <span className={`block text-[15px] font-semibold tracking-tight ${text}`}>PORTUS</span>
        <span className={`mt-0.5 block text-[11px] ${sub}`}>Portugal · Cabo Verde</span>
      </span>
    </Link>
  );
}
