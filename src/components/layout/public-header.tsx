"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { defaultRouteFor } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

const links = [
  { href: "/enviar", label: "Enviar encomenda" },
  { href: "/acompanhar", label: "Acompanhar" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 text-sm font-medium" aria-label="Navegação principal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hidden rounded-lg px-3 py-2 sm:inline-block ${
                pathname.startsWith(link.href) ? "text-brand-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={user ? defaultRouteFor(user) : "/login"}
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-slate-800 shadow-sm hover:bg-slate-50"
          >
            {user ? "A minha área" : "Entrar"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
