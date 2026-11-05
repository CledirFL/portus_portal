"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { roleLabels } from "@/lib/permissions";
import { type AuditEntry, type AuditFilters, auditEntityLabels, changedFields, listAudit } from "@/services/api/audit";
import { useAuthStore } from "@/store/auth-store";
import type { Role } from "@/types/user";

const show = (value: unknown) => (value === undefined ? "—" : typeof value === "string" ? value : JSON.stringify(value));

/** O que mudou: campos alterados, ou o registo completo quando só há antes ou depois. */
function AuditDetails({ entry }: { entry: AuditEntry }) {
  const changes = changedFields(entry.before, entry.after);
  return (
    <div className="space-y-2 text-xs">
      <p className="text-slate-500">
        Registo <span className="font-mono">{entry.entityId}</span>
        {entry.ip ? ` · IP ${entry.ip}` : ""}
      </p>
      {changes.length ? (
        <table className="w-full table-fixed">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="w-1/5 py-1 pr-3 font-medium">Campo</th>
              <th className="py-1 pr-3 font-medium">Antes</th>
              <th className="py-1 font-medium">Depois</th>
            </tr>
          </thead>
          <tbody className="font-mono text-slate-700">
            {changes.map((change) => (
              <tr key={change.key} className="border-t border-slate-200 align-top">
                <td className="py-1 pr-3 font-sans font-medium">{change.key}</td>
                <td className="break-all py-1 pr-3 text-rose-700">{show(change.before)}</td>
                <td className="break-all py-1 text-emerald-700">{show(change.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-slate-500">Sem valores registados para comparar.</p>
      )}
    </div>
  );
}

export default function AuditPage() {
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState<AuditFilters>({});
  const [filters, setFilters] = useState<AuditFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [result, setResult] = useState<Awaited<ReturnType<typeof listAudit>> | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    // Respostas de filtros antigos chegam por vezes depois das novas: ignoram-se.
    let isCurrent = true;
    listAudit({ ...filters, page, pageSize })
      .then((entries) => {
        if (!isCurrent) return;
        setResult(entries);
        setError("");
      })
      .catch((cause: unknown) => {
        if (isCurrent) setError(cause instanceof Error ? cause.message : "Não foi possível carregar a auditoria.");
      });
    return () => {
      isCurrent = false;
    };
  }, [user, filters, page, pageSize]);

  const set = (patch: AuditFilters) => setForm((current) => ({ ...current, ...patch }));

  return (
    <AppShell>
      <PageHeader title="Auditoria" description="Todas as alterações: quem fez, quando e o que mudou. O registo não pode ser alterado (BR 27)." />

      <form
        className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters(form);
          setPage(1);
        }}
      >
        <Select
          label="Registo"
          value={form.entity ?? ""}
          onChange={(event) => set({ entity: event.target.value })}
          options={[
            { value: "", label: "Todos" },
            ...(result?.entities ?? []).map((entity) => ({ value: entity, label: auditEntityLabels[entity] ?? entity })),
          ]}
        />
        <Input label="Ação" placeholder="ex.: shipment.validate" value={form.action ?? ""} onChange={(event) => set({ action: event.target.value })} />
        <Input label="Quem" placeholder="Nome ou email" value={form.actor ?? ""} onChange={(event) => set({ actor: event.target.value })} />
        <Input label="Desde" type="date" value={form.from ?? ""} onChange={(event) => set({ from: event.target.value })} />
        <Input label="Até" type="date" value={form.to ?? ""} onChange={(event) => set({ to: event.target.value })} />
        <Button type="submit">
          <Search className="h-4 w-4" aria-hidden /> Filtrar
        </Button>
      </form>

      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {result === null ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : result.items.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm text-slate-700" data-cy="audit-table">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-8 px-2 py-3" aria-label="Detalhe" />
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Quem</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Registo</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((entry) => (
                <Fragment key={entry.id}>
                  <tr className="cursor-pointer border-t border-slate-100 hover:bg-slate-50/70" onClick={() => setOpen(open === entry.id ? null : entry.id)}>
                    <td className="px-2 py-3 text-slate-400">
                      {open === entry.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(entry.at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "medium" })}</td>
                    <td className="px-4 py-3">
                      {entry.actor ? (
                        <>
                          {entry.actor.name}
                          <p className="text-xs text-slate-400">{roleLabels[entry.actor.role as Role] ?? entry.actor.role}</p>
                        </>
                      ) : (
                        <span className="text-slate-400">Cliente sem conta ou sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{entry.action}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{auditEntityLabels[entry.entity] ?? entry.entity}</td>
                  </tr>
                  {open === entry.id ? (
                    <tr className="bg-slate-50/60">
                      <td />
                      <td colSpan={4} className="px-4 py-3">
                        <AuditDetails entry={entry} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            itemLabel="registos"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
          Nenhum registo corresponde aos filtros.
        </div>
      )}
    </AppShell>
  );
}
