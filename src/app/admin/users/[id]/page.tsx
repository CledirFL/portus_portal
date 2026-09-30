import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mockUserRegistry } from "@/mocks/users";
import { getUserStatusLabel, getUserStatusTone } from "@/lib/user-registry";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = mockUserRegistry.find((entry) => entry.id === id);

  if (!user) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-700">Administração</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Detalhes do utilizador</h2>
        </div>

        <Link href="/admin/users">
          <Button variant="secondary">Voltar ao registo</Button>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title={user.name} subtitle={user.email}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={getUserStatusTone(user.status)}>{getUserStatusLabel(user.status)}</Badge>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {user.role}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Empresa</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{user.company}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Departamento</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{user.department}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Último acesso</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{user.lastActive}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Registado em</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{user.createdAt}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Permissões e acesso">
          <div className="space-y-3">
            {user.permissions?.map((permission) => (
              <div key={permission} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {permission}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
