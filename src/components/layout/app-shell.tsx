"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAllowedRoute } from "@/lib/permissions";
import { mockUsers } from "@/mocks/users";
import { useAuthStore } from "@/store/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const demoRole = params.get("demo");

    if (demoRole && !user) {
      const demoUser = mockUsers.find((entry) => entry.role === demoRole);
      if (demoUser) {
        setUser(demoUser);
      }
    }
  }, [user, setUser]);

  useEffect(() => {
    const publicRoutes = ["/login", "/unauthorized"];

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
  }, [isAuthenticated, pathname, router, user]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar />

      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">PORTUS</p>
            <h1 className="text-lg font-semibold text-slate-900">Portal de operações</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
              {user.role}
            </div>
            <button
              type="button"
              onClick={() => {
                clearUser();
                router.push("/login");
              }}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
