"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { getDispatchCountry } from "@/domain/countries";
import { type AdminAgency, type AgencyKind, listAdminAgencies } from "@/services/api/admin-agencies";
import { useAuthStore } from "@/store/auth-store";

function AgencyTable({ agencies, kind }: { agencies: AdminAgency[]; kind: AgencyKind }) {
  if (!agencies.length) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">Ainda não há agências.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-sm text-slate-700" data-cy={`agencies-${kind}`}>
        <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Agência</th>
            <th className="px-4 py-3 font-medium">{kind === "origin" ? "País" : "Ilhas que atende"}</th>
            <th className="px-4 py-3 font-medium">{kind === "origin" ? "Agências em Cabo Verde" : "Agências de origem"}</th>
            <th className="px-4 py-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {agencies.map((agency) => {
            const links = kind === "origin" ? agency.destinations : agency.origins;
            return (
              <tr key={agency.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <Link href={`/admin/agencias/${agency.id}`} className="font-medium text-brand-700 hover:text-brand-800">
                    {agency.name}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {agency.code} · {agency.city}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {kind === "origin" ? (getDispatchCountry(agency.countryCode)?.name ?? agency.countryCode) : agency.islands.join(", ")}
                </td>
                <td className="px-4 py-3">
                  {links.length ? links.map((link) => link.name).join(", ") : <span className="text-slate-400">{kind === "origin" ? "Levanta no porto" : "—"}</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={agency.status === "active" ? "success" : "neutral"}>{agency.status === "active" ? "Ativa" : "Inativa"}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AgenciesPage() {
  const user = useAuthStore((state) => state.user);
  const [agencies, setAgencies] = useState<AdminAgency[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    listAdminAgencies()
      .then(setAgencies)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar as agências."));
  }, [user]);

  return (
    <AppShell>
      <PageHeader
        title="Agências"
        description="As agências de origem recebem a carga; as agências em Cabo Verde entregam as encomendas pequenas aos destinatários."
        actions={
          <div className="flex gap-2">
            <Link href="/admin/agencias/nova?tipo=origin">
              <Button variant="outline">
                <Plus className="h-4 w-4" aria-hidden /> Agência de origem
              </Button>
            </Link>
            <Link href="/admin/agencias/nova?tipo=destination">
              <Button>
                <Plus className="h-4 w-4" aria-hidden /> Agência em Cabo Verde
              </Button>
            </Link>
          </div>
        }
      />
      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {agencies === null ? (
        error ? null : <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Em Cabo Verde</h2>
            <AgencyTable agencies={agencies.filter((agency) => agency.kind === "destination")} kind="destination" />
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">De origem</h2>
            <AgencyTable agencies={agencies.filter((agency) => agency.kind === "origin")} kind="origin" />
          </section>
        </div>
      )}
    </AppShell>
  );
}
