"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { isAllowedRoute, roleLabels, roleNavigation } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";
import { logout } from "@/services/api/auth";
import { Sidebar, findActiveNavItem } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  // O persist do Zustand já repõe a sessão; só esperamos que termine.
  const isHydrated = useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    const publicRoutes = ["/login", "/unauthorized", "/enviar", "/acompanhar"];

    if (!isHydrated) {
      return;
    }

    if (publicRoutes.includes(pathname)) {
      return;
    }

    if (!isAuthenticated && !user) {
      router.push("/login");
      return;
    }

    if (user && !isAllowedRoute(user.role, pathname)) {
      router.push("/unauthorized");
    }
  }, [isHydrated, isAuthenticated, pathname, router, user]);

  if (!isHydrated || !isAuthenticated || !user) {
    return null;
  }

  const section = findActiveNavItem(roleNavigation[user.role], pathname);
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background text-slate-900 md:flex-row">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 print:hidden items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur sm:px-8">
          <p className="truncate text-sm text-slate-500">
            <span className="hidden sm:inline">{roleLabels[user.role]}</span>
            {section ? (
              <>
                <span className="mx-2 hidden text-slate-300 sm:inline">/</span>
                <span className="font-medium text-slate-900">{section.label}</span>
              </>
            ) : null}
          </p>

          <div className="flex items-center gap-3">
            <span
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800 sm:flex"
              title={user.name}
            >
              {initials}
            </span>
            <button
              type="button"
              onClick={async () => {
                await logout().catch(() => undefined);
                router.push("/login");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sair
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-4 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
