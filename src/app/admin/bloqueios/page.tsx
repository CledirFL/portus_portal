"use client";

import { useEffect, useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api-client";
import { type BlocksOverview, getBlocks, type PlatformProcess, setProcessBlock, suspendAgency, suspendPort } from "@/services/api/blocks";
import { useAuthStore } from "@/store/auth-store";

const formatDate = (iso: string) => new Date(iso).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });

const messageOf = (cause: unknown, fallback: string) =>
  [cause instanceof Error ? cause.message : fallback, ...(cause instanceof ApiError ? cause.issues.map((issue) => issue.message) : [])].join(" ");

/** Linha com o estado, o botão e, ao parar, o campo do aviso ou do motivo. */
function BlockRow({
  title,
  detail,
  blocked,
  since,
  note,
  noteLabel,
  blockLabel,
  required,
  onChange,
  testId,
}: {
  title: string;
  detail: string;
  blocked: boolean;
  since: string | null;
  note: string | null;
  noteLabel: string;
  blockLabel: string;
  required: boolean;
  onChange: (blocked: boolean, note: string | null) => Promise<void>;
  testId: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (next: boolean, text: string | null) => {
    setBusy(true);
    try {
      await onChange(next, text);
      setEditing(null);
    } catch {
      // O erro aparece no topo da página; o campo fica aberto para corrigir.
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="py-3" data-cy={testId}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
            {title}
            {blocked ? <Badge tone="danger">Parado</Badge> : <Badge tone="success">A funcionar</Badge>}
          </p>
          <p className="text-sm text-slate-500">{detail}</p>
          {blocked && note ? <p className="text-sm text-rose-700">“{note}”</p> : null}
          {blocked && since ? <p className="text-xs text-slate-400">Desde {formatDate(since)}</p> : null}
        </div>
        {editing === null ? (
          blocked ? (
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing(note ?? "")}>
                Mudar aviso
              </Button>
              <Button size="sm" disabled={busy} onClick={() => void run(false, null)}>
                <LockOpen className="h-3.5 w-3.5" aria-hidden /> Retomar
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="danger" disabled={busy} className="shrink-0" onClick={() => setEditing("")}>
              <Lock className="h-3.5 w-3.5" aria-hidden /> {blockLabel}
            </Button>
          )
        ) : null}
      </div>
      {editing !== null ? (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void run(true, editing.trim() || null);
          }}
        >
          <div className="flex-1">
            <Input label={noteLabel} value={editing} onChange={(event) => setEditing(event.target.value)} autoFocus />
          </div>
          <Button type="submit" variant="danger" disabled={busy || (required && editing.trim().length < 3)}>
            Confirmar
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
            Cancelar
          </Button>
        </form>
      ) : null}
    </li>
  );
}

export default function BlocksPage() {
  const user = useAuthStore((state) => state.user);
  const [overview, setOverview] = useState<BlocksOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    getBlocks()
      .then(setOverview)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar os bloqueios."));
  }, [user]);

  const apply = async (action: () => Promise<BlocksOverview>) => {
    setError("");
    try {
      setOverview(await action());
    } catch (cause) {
      setError(messageOf(cause, "Não foi possível guardar."));
      throw cause;
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Bloqueios"
        description="Pare processos em toda a plataforma, ponha-a em manutenção ou suspenda uma agência ou um porto. O super admin nunca fica bloqueado; tudo fica no registo de atividade."
      />

      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!overview ? (
        error ? null : <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : (
        <div className="space-y-6">
          <Card title="Processos" subtitle="Quem tentar vê o aviso que escrever. Os clientes veem-no ao enviar um pedido; a equipa vê-o no topo do portal.">
            <ul className="divide-y divide-slate-100">
              {overview.processes.map((item) => (
                <BlockRow
                  key={item.process}
                  testId={`process-${item.process}`}
                  title={item.label}
                  detail={item.description}
                  blocked={item.blocked}
                  since={item.blockedAt}
                  note={item.message}
                  noteLabel="Aviso a mostrar (opcional)"
                  blockLabel={item.process === "maintenance" ? "Pôr em manutenção" : "Parar"}
                  required={false}
                  onChange={(blocked, message) => apply(() => setProcessBlock(item.process as PlatformProcess, { blocked, message }))}
                />
              ))}
            </ul>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Agências" subtitle="As contas da agência deixam de trabalhar e ela sai da lista de Enviar encomenda.">
              <ul className="divide-y divide-slate-100">
                {overview.agencies.map((agency) => (
                  <BlockRow
                    key={agency.id}
                    testId={`agency-${agency.code}`}
                    title={`${agency.name} (${agency.code})`}
                    detail={`${agency.city} · ${agency.kind === "destination" ? "agência em Cabo Verde" : "agência de envio"}`}
                    blocked={Boolean(agency.suspendedAt)}
                    since={agency.suspendedAt}
                    note={agency.suspendedReason}
                    noteLabel="Motivo da suspensão"
                    blockLabel="Suspender"
                    required
                    onChange={(suspended, reason) => apply(() => suspendAgency(agency.id, { suspended, reason }))}
                  />
                ))}
              </ul>
            </Card>

            <Card title="Portos" subtitle="As contas do porto (terminal, Alfândega, portaria) deixam de trabalhar.">
              <ul className="divide-y divide-slate-100">
                {overview.ports.map((port) => (
                  <BlockRow
                    key={port.id}
                    testId={`port-${port.code}`}
                    title={`${port.name} (${port.code})`}
                    detail={port.island}
                    blocked={Boolean(port.suspendedAt)}
                    since={port.suspendedAt}
                    note={port.suspendedReason}
                    noteLabel="Motivo da suspensão"
                    blockLabel="Suspender"
                    required
                    onChange={(suspended, reason) => apply(() => suspendPort(port.id, { suspended, reason }))}
                  />
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
