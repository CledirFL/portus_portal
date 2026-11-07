"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Download, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { roleLabels } from "@/lib/permissions";
import {
  type AuditCategory,
  auditActionLabels,
  auditCategoryLabels,
  type AuditEntry,
  auditEntityLabels,
  type AuditFilters,
  type AuditOutcome,
  auditOutcomeLabels,
  changedFields,
  exportAudit,
  listAudit,
} from "@/services/api/audit";
import { useAuthStore } from "@/store/auth-store";
import type { Role } from "@/types/user";

const show = (value: unknown) => (value === undefined ? "—" : typeof value === "string" ? value : JSON.stringify(value));
const roleName = (role: string | null | undefined) => (role ? (roleLabels[role as Role] ?? role) : "");

const categoryTones: Record<AuditCategory, "info" | "neutral" | "success" | "danger"> = {
  change: "info",
  session: "neutral",
  access: "success",
  refusal: "danger",
};
const outcomeTones: Record<AuditOutcome, "success" | "danger" | "warning"> = { success: "success", denied: "danger", failed: "warning" };

/** O que mudou, com o pedido, o IP e o navegador. */
function AuditDetails({ entry }: { entry: AuditEntry }) {
  const changes = changedFields(entry.before, entry.after);
  return (
    <div className="space-y-2 text-xs">
      <dl className="grid gap-x-6 gap-y-1 text-slate-600 sm:grid-cols-2">
        <div>
          <dt className="inline text-slate-400">Registo </dt>
          <dd className="inline font-mono">{entry.entityId}</dd>
        </div>
        {entry.path ? (
          <div>
            <dt className="inline text-slate-400">Pedido </dt>
            <dd className="inline font-mono">{entry.path}</dd>
          </div>
        ) : null}
        {entry.ip ? (
          <div>
            <dt className="inline text-slate-400">IP </dt>
            <dd className="inline font-mono">{entry.ip}</dd>
          </div>
        ) : null}
        {entry.userAgent ? (
          <div className="sm:col-span-2">
            <dt className="inline text-slate-400">Navegador </dt>
            <dd className="inline break-all">{entry.userAgent}</dd>
          </div>
        ) : null}
      </dl>
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
  const [exporting, setExporting] = useState(false);

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
        if (isCurrent) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o registo de atividade.");
      });
    return () => {
      isCurrent = false;
    };
  }, [user, filters, page, pageSize]);

  const set = (patch: AuditFilters) => setForm((current) => ({ ...current, ...patch }));

  return (
    <AppShell>
      <PageHeader
        title="Registo de atividade"
        description="Quem fez o quê e quando: alterações, entradas e saídas, consultas de dados pessoais e descargas, e recusas. Ninguém o pode alterar (BR 27)."
        actions={
          <Button
            variant="outline"
            disabled={exporting}
            data-cy="audit-export"
            onClick={async () => {
              setExporting(true);
              setError("");
              try {
                await exportAudit(filters);
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Não foi possível exportar.");
              } finally {
                setExporting(false);
              }
            }}
          >
            <Download className="h-4 w-4" aria-hidden /> Exportar CSV
          </Button>
        }
      />

      <form
        className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        data-cy="audit-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters(form);
          setPage(1);
        }}
      >
        <Select
          label="Tipo"
          value={form.category ?? ""}
          onChange={(event) => set({ category: event.target.value as AuditCategory | "" })}
          options={[{ value: "", label: "Todos" }, ...(Object.keys(auditCategoryLabels) as AuditCategory[]).map((key) => ({ value: key, label: auditCategoryLabels[key] }))]}
        />
        <Select
          label="Resultado"
          value={form.outcome ?? ""}
          onChange={(event) => set({ outcome: event.target.value as AuditOutcome | "" })}
          options={[{ value: "", label: "Todos" }, ...(Object.keys(auditOutcomeLabels) as AuditOutcome[]).map((key) => ({ value: key, label: auditOutcomeLabels[key] }))]}
        />
        <Select
          label="Registo"
          value={form.entity ?? ""}
          onChange={(event) => set({ entity: event.target.value })}
          options={[
            { value: "", label: "Todos" },
            ...(result?.entities ?? []).map((entity) => ({ value: entity, label: auditEntityLabels[entity] ?? entity })),
          ]}
        />
        <Select
          label="Perfil"
          value={form.role ?? ""}
          onChange={(event) => set({ role: event.target.value })}
          options={[{ value: "", label: "Todos" }, ...(Object.keys(roleLabels) as Role[]).map((role) => ({ value: role, label: roleLabels[role] }))]}
        />
        <Input label="Quem" placeholder="Nome ou email" value={form.actor ?? ""} onChange={(event) => set({ actor: event.target.value })} />
        <Input label="Ação" placeholder="ex.: shipment.validate" value={form.action ?? ""} onChange={(event) => set({ action: event.target.value })} />
        <Input label="IP" placeholder="ex.: 192.168." value={form.ip ?? ""} onChange={(event) => set({ ip: event.target.value })} />
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
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Registo</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
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
                          <p className="text-xs text-slate-400">{roleName(entry.actorRole ?? entry.actor.role)}</p>
                        </>
                      ) : (
                        <span className="text-slate-400">Anónimo ou sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={categoryTones[entry.category]}>{auditCategoryLabels[entry.category]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {auditActionLabels[entry.action] ? <p>{auditActionLabels[entry.action]}</p> : null}
                      <p className="font-mono text-xs text-slate-500">{entry.action}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{auditEntityLabels[entry.entity] ?? entry.entity}</td>
                    <td className="px-4 py-3">
                      <Badge tone={outcomeTones[entry.outcome]}>{auditOutcomeLabels[entry.outcome]}</Badge>
                    </td>
                  </tr>
                  {open === entry.id ? (
                    <tr className="bg-slate-50/60">
                      <td />
                      <td colSpan={6} className="px-4 py-3">
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
