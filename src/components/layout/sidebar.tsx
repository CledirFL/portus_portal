"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { roleNavigation } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <aside className="hidden w-72 border-r border-slate-200 bg-slate-950 p-5 text-slate-100 md:flex md:flex-col">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Portus</p>
        <h2 className="mt-2 text-xl font-semibold">Portal</h2>
      </div>

      <nav className="space-y-2">
        {roleNavigation[user.role].map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
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
    </aside>
  );
}
