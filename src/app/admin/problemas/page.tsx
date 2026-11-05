"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, ImageIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { roleLabels } from "@/lib/permissions";
import {
  type FeedbackReport,
  type FeedbackStatus,
  type FeedbackType,
  feedbackPriorityLabels,
  feedbackScreenshot,
  feedbackStatusLabels,
  feedbackTypeLabels,
  listFeedback,
  updateFeedback,
} from "@/services/api/feedback";
import { useAuthStore } from "@/store/auth-store";
import type { Role } from "@/types/user";

const statusTones: Record<FeedbackStatus, "warning" | "info" | "success" | "neutral"> = {
  new: "warning",
  in_review: "info",
  resolved: "success",
  not_a_bug: "neutral",
};
const tabs: Array<{ key: FeedbackStatus | "all"; label: string }> = [
  { key: "new", label: "Novos" },
  { key: "in_review", label: "Em análise" },
  { key: "resolved", label: "Resolvidos" },
  { key: "not_a_bug", label: "Não é erro" },
  { key: "all", label: "Todos" },
];

/** Descrição, página, navegador, captura e o tratamento pelo administrador. */
function ReportDetails({ report, onChange }: { report: FeedbackReport; onChange: (report: FeedbackReport) => void }) {
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState(report.adminNote ?? "");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (screenshot) URL.revokeObjectURL(screenshot);
  }, [screenshot]);

  return (
    <div className="grid gap-4 text-sm lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-2">
        <p className="whitespace-pre-wrap text-slate-800">{report.description}</p>
        <p className="text-xs text-slate-500">
          Página <span className="font-mono">{report.page}</span>
        </p>
        {report.userAgent ? <p className="text-xs text-slate-400">{report.userAgent}</p> : null}
        {report.hasScreenshot ? (
          screenshot ? (
            <a href={screenshot} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem local (blob) carregada com sessão */}
              <img src={screenshot} alt={`Captura do problema #${report.number}`} className="mt-2 max-h-72 rounded-lg border border-slate-200" />
            </a>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => setScreenshot(URL.createObjectURL(await feedbackScreenshot(report.id)))}
            >
              <ImageIcon className="h-4 w-4" aria-hidden /> Ver captura de ecrã
            </Button>
          )
        ) : null}
      </div>

      <form
        className="space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            onChange(await updateFeedback(report.id, { status, adminNote: note.trim() || null }));
            setMessage("Guardado.");
          } catch (cause) {
            setMessage(cause instanceof Error ? cause.message : "Não foi possível guardar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Select
          label="Estado"
          value={status}
          onChange={(event) => setStatus(event.target.value as FeedbackStatus)}
          options={(Object.keys(feedbackStatusLabels) as FeedbackStatus[]).map((option) => ({ value: option, label: feedbackStatusLabels[option] }))}
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Nota (o que foi feito ou porquê)</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2000} className={fieldClasses} />
        </label>
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={busy}>
            Guardar
          </Button>
          {message ? <span className="text-slate-600">{message}</span> : null}
        </div>
      </form>
    </div>
  );
}

export default function ProblemsPage() {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<FeedbackStatus | "all">("new");
  const [type, setType] = useState<FeedbackType | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [result, setResult] = useState<Awaited<ReturnType<typeof listFeedback>> | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let isCurrent = true;
    listFeedback({ status: tab === "all" ? undefined : tab, type: type || undefined, page, pageSize })
      .then((reports) => {
        if (!isCurrent) return;
        setResult(reports);
        setError("");
      })
      .catch((cause: unknown) => {
        if (isCurrent) setError(cause instanceof Error ? cause.message : "Não foi possível carregar os problemas.");
      });
    return () => {
      isCurrent = false;
    };
  }, [user, tab, type, page, pageSize]);

  return (
    <AppShell>
      <PageHeader
        title="Problemas reportados"
        description={`O que a equipa reportou com o botão "Reportar problema".${result ? ` ${result.open} por tratar.` : ""}`}
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
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
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === item.key ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="md:w-48">
          <Select
            aria-label="Tipo"
            value={type}
            onChange={(event) => {
              setType(event.target.value as FeedbackType | "");
              setPage(1);
            }}
            options={[{ value: "", label: "Todos os tipos" }, ...(Object.keys(feedbackTypeLabels) as FeedbackType[]).map((option) => ({ value: option, label: feedbackTypeLabels[option] }))]}
          />
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
          <table className="min-w-full text-left text-sm text-slate-700" data-cy="problems-table">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-8 px-2 py-3" aria-label="Detalhe" />
                <th className="px-4 py-3 font-medium">Nº</th>
                <th className="px-4 py-3 font-medium">Problema</th>
                <th className="px-4 py-3 font-medium">Quem</th>
                <th className="px-4 py-3 font-medium">Prioridade</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((report) => (
                <Fragment key={report.id}>
                  <tr className="cursor-pointer border-t border-slate-100 hover:bg-slate-50/70" onClick={() => setOpen(open === report.id ? null : report.id)}>
                    <td className="px-2 py-3 text-slate-400">{open === report.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">#{report.number}</td>
                    <td className="max-w-md px-4 py-3">
                      <span className="mr-2 text-xs font-semibold uppercase text-slate-500">{feedbackTypeLabels[report.type]}</span>
                      <span className="line-clamp-1">{report.description}</span>
                      <p className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}</p>
                    </td>
                    <td className="px-4 py-3">
                      {report.reporter.name}
                      <p className="text-xs text-slate-400">{roleLabels[report.reporter.role as Role] ?? report.reporter.role}</p>
                    </td>
                    <td className="px-4 py-3">{feedbackPriorityLabels[report.priority]}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTones[report.status]}>{feedbackStatusLabels[report.status]}</Badge>
                    </td>
                  </tr>
                  {open === report.id ? (
                    <tr className="bg-slate-50/60">
                      <td />
                      <td colSpan={5} className="px-4 py-4">
                        <ReportDetails
                          report={report}
                          onChange={(updated) =>
                            setResult((current) => {
                              if (!current) return current;
                              // Atualiza o número por tratar sem recarregar (a linha continua aberta).
                              const isOpen = (status: FeedbackStatus) => status === "new" || status === "in_review";
                              const delta = Number(isOpen(updated.status)) - Number(isOpen(report.status));
                              return { ...current, open: current.open + delta, items: current.items.map((item) => (item.id === updated.id ? updated : item)) };
                            })
                          }
                        />
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
            itemLabel="problemas"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
          Nenhum problema nesta lista.
        </div>
      )}
    </AppShell>
  );
}
