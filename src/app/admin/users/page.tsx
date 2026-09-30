"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { mockUserRegistry } from "@/mocks/users";
import { filterUsersByQuery, getUserStatusLabel, getUserStatusTone } from "@/lib/user-registry";

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => filterUsersByQuery(mockUserRegistry, query), [query]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Administração</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Registos de utilizadores</h2>
        </div>

        <div className="w-full max-w-md">
          <label htmlFor="user-search" className="mb-1 block text-sm font-medium text-slate-700">
            Procurar utilizador
          </label>
          <input
            id="user-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, email, empresa..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Utilizadores ativos</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {mockUserRegistry.filter((user) => user.status === "active").length}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">Em revisão</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {mockUserRegistry.filter((user) => user.status === "review").length}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-slate-500">Bloqueados</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {mockUserRegistry.filter((user) => user.status === "blocked").length}
          </p>
        </Card>
      </div>

      <Card title="Lista de acessos">
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <Table
            columns={[
              {
                key: "name",
                label: "Utilizador",
                render: (value, row) => (
                  <Link href={`/admin/users/${row.id}`} className="font-medium text-sky-700 hover:text-sky-800">
                    {String(value)}
                  </Link>
                ),
              },
              { key: "email", label: "Email" },
              { key: "role", label: "Perfil" },
              { key: "company", label: "Empresa" },
              {
                key: "status",
                label: "Estado",
                render: (value) => (
                  <Badge tone={getUserStatusTone(value as Parameters<typeof getUserStatusTone>[0])}>
                    {getUserStatusLabel(value as Parameters<typeof getUserStatusLabel>[0])}
                  </Badge>
                ),
              },
              { key: "lastActive", label: "Último acesso" },
            ]}
            rows={filteredUsers}
            emptyMessage="Nenhum utilizador encontrado."
          />
        </div>
      </Card>
    </AppShell>
  );
}
