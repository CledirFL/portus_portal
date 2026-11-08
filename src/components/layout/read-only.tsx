"use client";

import { Eye } from "lucide-react";
import { isReadOnly } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth-store";

/** O admin da plataforma só consulta as operações: as ações ficam escondidas (a API também as recusa). */
export function useReadOnly() {
  return isReadOnly(useAuthStore((state) => state.user));
}

/** Mostra o conteúdo só a quem pode operar (esconde botões e formulários que alteram dados ao admin da plataforma). */
export function OperateOnly({ children }: { children: React.ReactNode }) {
  return useReadOnly() ? null : <>{children}</>;
}

const operationRoutes = ["/agencia/", "/cv/", "/alfandega", "/portaria", "/agencia-cv", "/dgtr"];

/** Aviso no topo dos ecrãs de operações para o admin da plataforma. */
export function ReadOnlyBanner({ pathname }: { pathname: string }) {
  const user = useAuthStore((state) => state.user);
  if (!isReadOnly(user) || !operationRoutes.some((route) => pathname.startsWith(route))) return null;
  return (
    <div role="note" data-cy="read-only-banner" className="mb-5 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 print:hidden">
      <Eye className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        <strong>Modo de consulta.</strong> O seu perfil de administração{user?.adminProfile ? ` (${user.adminProfile.name})` : ""} só permite consultar
        as operações: as ações estão escondidas.
      </span>
    </div>
  );
}
