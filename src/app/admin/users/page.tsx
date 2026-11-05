"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { roleLabels } from "@/lib/permissions";
import { userScopeLabel, userStatusTones } from "@/modules/admin/user-labels";
import { listUsers, staffRoles, type UserStatus, userStatusLabels } from "@/services/api/users";
import { useAuthStore } from "@/store/auth-store";
import type { Role } from "@/types/user";

const tabs: Array<{ key: UserStatus | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "review", label: "Pedidos de acesso" },
  { key: "active", label: "Ativos" },
  { key: "blocked", label: "Bloqueados" },
];

export default function AdminUsersPage() {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<UserStatus | "all">("all");
  const [role, setRole] = useState<Role | "">("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [result, setResult] = useState<Awaited<ReturnType<typeof listUsers>> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    // Respostas de filtros antigos chegam por vezes depois das novas: ignoram-se.
    let isCurrent = true;
    listUsers({ status: tab === "all" ? undefined : tab, role: role || undefined, q: search, page, pageSize })
      .then((users) => {
        if (!isCurrent) return;
        setResult(users);
        setError("");
      })
      .catch((cause: unknown) => {
        if (isCurrent) setError(cause instanceof Error ? cause.message : "Não foi possível carregar os utilizadores.");
      });
    return () => {
      isCurrent = false;
    };
  }, [user, tab, role, search, page, pageSize]);

  return (
    <AppShell>
      <PageHeader
        title="Utilizadores"
        description="Aprove pedidos de acesso, crie contas da equipa e bloqueie quem já não deve entrar."
        actions={
          <Link href="/admin/users/nova">
            <Button>
              <Plus className="h-4 w-4" aria-hidden /> Nova conta
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => {
                setTab(item.key);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === item.key ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.label}
              {item.key === "review" && result?.pendingReview ? (
                <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 text-xs font-semibold text-amber-950">{result.pendingReview}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
          <div className="sm:w-48">
            <Select
              aria-label="Perfil"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as Role | "");
                setPage(1);
              }}
              options={[{ value: "", label: "Todos os perfis" }, ...[...staffRoles, "cliente" as Role].map((item) => ({ value: item, label: roleLabels[item] }))]}
            />
          </div>
          <form
            className="flex flex-1 gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(query);
              setPage(1);
            }}
          >
            <Input aria-label="Procurar utilizadores" placeholder="Nome, email ou empresa" value={query} onChange={(event) => setQuery(event.target.value)} />
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4" aria-hidden />
              <span className="sr-only">Procurar</span>
            </Button>
          </form>
        </div>
      </div>

      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {result === null ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : result.items.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm text-slate-700" data-cy="users-table">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Utilizador</th>
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3 font-medium">Agência ou porto</th>
                <th className="px-4 py-3 font-medium">Último acesso</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${item.id}`} className="font-medium text-brand-700 hover:text-brand-800">
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {item.email}
                      {item.organization ? ` · ${item.organization}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{roleLabels[item.role]}</td>
                  <td className="px-4 py-3">{userScopeLabel(item)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }) : "Nunca"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={userStatusTones[item.status]}>{userStatusLabels[item.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            itemLabel="utilizadores"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
          {tab === "review" ? "Não há pedidos de acesso por tratar." : "Nenhum utilizador corresponde aos filtros."}
        </div>
      )}
    </AppShell>
  );
}
