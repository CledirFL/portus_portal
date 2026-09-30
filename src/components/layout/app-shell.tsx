"use client";

import { useEffect, useState } from "react";
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
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const persisted = window.localStorage.getItem("portus-auth");

    if (!persisted) {
      setIsHydrated(true);
      return;
    }

    try {
      const authState = JSON.parse(persisted) as { state?: { user?: typeof user } };
      if (authState.state?.user && !user && !isAuthenticated) {
        setUser(authState.state.user);
      }
    } catch {
      // ignore invalid persisted auth
    } finally {
      setIsHydrated(true);
    }
  }, [isAuthenticated, setUser, user]);

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

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 md:flex-row">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">PORTUS</p>
            <h1 className="text-lg font-semibold text-slate-900">Portal de operações</h1>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
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

        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
