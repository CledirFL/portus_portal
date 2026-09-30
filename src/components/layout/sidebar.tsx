"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { roleNavigation } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (!user) {
    return null;
  }

  const renderNav = () => (
    <nav className="space-y-2">
      {roleNavigation[user.role].map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
              active ? "bg-sky-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-3">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="hidden w-72 border-r border-slate-200 bg-slate-950 p-5 text-slate-100 md:flex md:flex-col">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Portus</p>
          <h2 className="mt-2 text-xl font-semibold">Portal</h2>
        </div>

        {renderNav()}

        <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Alertas</p>
          <p className="mt-2 text-sm text-slate-200">3 pendências de revisão</p>
        </div>
      </aside>

      <div className="border-b border-slate-200 bg-slate-950 px-4 py-3 text-slate-100 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">Portus</p>
            <p className="text-sm font-medium">Portal</p>
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setIsOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-lg text-white"
          >
            {isOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden"
          onClick={() => setIsOpen(false)}
        >
          <aside
            className="flex h-full w-72 flex-col border-r border-slate-700 bg-slate-950 p-5 text-slate-100"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Portus</p>
                <h2 className="mt-2 text-xl font-semibold">Portal</h2>
              </div>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-700 px-2 py-1 text-sm text-slate-200"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {renderNav()}
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Alertas</p>
              <p className="mt-2 text-sm text-slate-200">3 pendências de revisão</p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
