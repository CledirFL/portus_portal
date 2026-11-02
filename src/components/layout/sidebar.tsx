"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NavIcon } from "@/components/ui/nav-icon";
import { roleLabels, roleNavigation } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";
import type { NavItem } from "@/types/user";

/** Item ativo = o mais específico cujo href é prefixo do caminho atual. */
export function findActiveNavItem(items: NavItem[], pathname: string) {
  return items
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [openFor, setOpenFor] = useState<string | null>(null);
  // Fecha automaticamente ao navegar, sem efeito extra.
  const isOpen = openFor === pathname;

  if (!user) {
    return null;
  }

  const items = roleNavigation[user.role];
  const active = findActiveNavItem(items, pathname);

  const nav = (
    <nav className="space-y-0.5" aria-label="Navegação da aplicação">
      {items.map((item) => {
        const isActive = active?.href === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-white/10 text-white shadow-[inset_2px_0_0_var(--color-star)]"
                : "text-brand-100/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="truncate text-sm font-medium text-white">{user.name}</p>
      <p className="truncate text-xs text-brand-200/70">
        {roleLabels[user.role]} · {user.company}
      </p>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand-950 px-4 py-5 md:flex">
        <div className="mb-8 px-2">
          <Logo tone="light" />
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        {footer}
      </aside>

      <div className="sticky top-0 z-30 flex items-center justify-between bg-brand-950 px-4 py-3 md:hidden">
        <Logo tone="light" />
        <button
          type="button"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpenFor(isOpen ? null : pathname)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden" onClick={() => setOpenFor(null)}>
          <aside
            className="flex h-full w-72 flex-col bg-brand-950 px-4 py-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between px-2">
              <Logo tone="light" />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpenFor(null)}
                className="rounded-lg p-1.5 text-brand-100 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            {footer}
          </aside>
        </div>
      ) : null}
    </>
  );
}
