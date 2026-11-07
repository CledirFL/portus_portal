"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, DoorOpen, PackageCheck, ScanLine, Search, Truck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { OperateOnly, useReadOnly } from "@/components/layout/read-only";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { formatKg } from "@/modules/consolidation/components/consolidation-ui";
import { VolumeStatusBadge } from "@/modules/shipments/components/shipment-status";
import {
  agencyStageLabels,
  collectAtPort,
  listAgencyShipments,
  receiveAtAgency,
  type AgencyShipment,
  type AgencyStage,
} from "@/services/api/cv-agency";
import { useAuthStore } from "@/store/auth-store";

type ListResult = Awaited<ReturnType<typeof listAgencyShipments>>;

const tabs: AgencyStage[] = ["released", "to_agency", "at_agency", "delivered", "port"];

const stageHints: Record<AgencyStage, string> = {
  released: "Liberadas pela Alfândega. Levante-as no porto e marque-as aqui.",
  to_agency: "Levantadas no porto. Leia o QR de cada volume quando chegar à agência.",
  at_agency: "Na agência, prontas a entregar. O remetente já foi avisado por email.",
  delivered: "Entregues ao destinatário ou a quem trouxe o comprovativo.",
  port: "Ainda no navio, na conferência ou no despacho aduaneiro.",
};

/** Estados distintos dos volumes de uma encomenda, para a coluna de estado. */
const statusesOf = (shipment: AgencyShipment) => [...new Set(shipment.volumes.map((volume) => volume.status))];

function ReceiveCard({ onReceived }: { onReceived: () => void }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "info" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Card title="Receber na agência" subtitle="Leia o QR da etiqueta de cada volume à chegada (ou escreva o código do volume).">
      <form
        className="flex max-w-xl gap-2"
        data-cy="agency-receive"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!code.trim()) return;
          setBusy(true);
          try {
            const result = await receiveAtAgency(code.trim());
            setMessage(
              result.result === "already_here"
                ? { tone: "info", text: `O volume ${result.volumeCode} já estava na agência.` }
                : {
                    tone: "success",
                    text: result.ready
                      ? `Volume ${result.volumeCode} recebido. A encomenda ${result.shipmentCode} está completa e pronta a entregar; o remetente foi avisado.`
                      : `Volume ${result.volumeCode} recebido (${result.shipmentCode}). Faltam volumes desta encomenda.`,
                  },
            );
            onReceived();
          } catch (cause) {
            setMessage({ tone: "error", text: cause instanceof Error ? cause.message : "Não foi possível receber o volume." });
          } finally {
            setCode("");
            setBusy(false);
          }
        }}
      >
        <Input aria-label="QR ou código do volume" placeholder="Leia o QR do volume" value={code} onChange={(event) => setCode(event.target.value)} className="font-mono" />
        <Button type="submit" disabled={busy}>
          <ScanLine className="h-4 w-4" aria-hidden /> Receber
        </Button>
      </form>
      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          data-cy="agency-receive-result"
          className={`mt-3 text-sm ${message.tone === "error" ? "text-rose-700" : message.tone === "success" ? "text-emerald-700" : "text-slate-600"}`}
        >
          {message.text}
        </p>
      ) : null}
    </Card>
  );
}

export default function CvAgencyPage() {
  const user = useAuthStore((state) => state.user);
  const readOnly = useReadOnly();
  const [tab, setTab] = useState<AgencyStage>("released");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<ListResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Respostas de filtros antigos chegam por vezes depois das novas: ignoram-se.
    let isCurrent = true;
    listAgencyShipments({ stage: tab, q: search, page, pageSize })
      .then((list) => {
        if (!isCurrent) return;
        setResult(list);
        setError("");
      })
      .catch((cause: unknown) => {
        if (isCurrent) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as encomendas.");
      });
    return () => {
      isCurrent = false;
    };
  }, [user, tab, search, page, pageSize, refresh]);

  const shipments = result?.items ?? null;
  const selectable = tab === "released" && !readOnly;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const collect = async () => {
    setBusy(true);
    setNotice("");
    try {
      const done = await collectAtPort([...selected]);
      setNotice(`${done.shipments} encomenda(s), ${done.volumes} volume(s) levantados no porto. Estão agora a caminho da agência.`);
      setSelected(new Set());
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registar o levantamento.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Encomendas a entregar"
        description="Encomendas pequenas que a sua agência levanta no porto, recebe e entrega ao destinatário."
        actions={
          <Link href="/agencia-cv/entregar">
            <Button>
              <DoorOpen className="h-4 w-4" aria-hidden /> Entregar ao destinatário
            </Button>
          </Link>
        }
      />

      <OperateOnly>
        <div className="mb-6">
          <ReceiveCard
            onReceived={() => {
              setNotice("");
              setRefresh((value) => value + 1);
            }}
          />
        </div>
      </OperateOnly>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1" role="tablist">
          {tabs.map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setTab(key);
                setPage(1);
                setSelected(new Set());
                setNotice("");
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === key ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              {agencyStageLabels[key]}
              {result ? <span className={`ml-1.5 tabular-nums ${tab === key ? "text-white/80" : "text-slate-400"}`}>{result.counts[key]}</span> : null}
            </button>
          ))}
        </div>
        <form
          className="flex w-full gap-2 lg:max-w-sm"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(query);
            setPage(1);
          }}
        >
          <Input aria-label="Procurar encomendas" placeholder="Código, nome ou telefone" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4" aria-hidden />
            <span className="sr-only">Procurar</span>
          </Button>
        </form>
      </div>

      <p className="mb-3 text-sm text-slate-500">{stageHints[tab]}</p>

      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {notice ? (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" data-cy="agency-notice">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> {notice}
        </p>
      ) : null}

      {selectable && shipments?.length ? (
        <div className="mb-3 flex items-center gap-3">
          <Button onClick={() => void collect()} disabled={busy || selected.size === 0} data-cy="agency-collect">
            <Truck className="h-4 w-4" aria-hidden /> Levantar no porto ({selected.size})
          </Button>
          <span className="text-xs text-slate-500">Marque as encomendas que a agência levantou no porto.</span>
        </div>
      ) : null}

      {shipments === null ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : result && shipments.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm text-slate-700" data-cy="agency-shipments">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {selectable ? (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Marcar todas"
                      checked={shipments.every((shipment) => selected.has(shipment.id))}
                      onChange={(event) => setSelected(event.target.checked ? new Set(shipments.map((shipment) => shipment.id)) : new Set())}
                    />
                  </th>
                ) : null}
                <th className="px-4 py-3 font-medium">Encomenda</th>
                <th className="px-4 py-3 font-medium">Destinatário</th>
                <th className="px-4 py-3 font-medium">Remetente</th>
                <th className="px-4 py-3 font-medium">Volumes</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                {tab === "at_agency" ? <th className="px-4 py-3" /> : null}
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  {selectable ? (
                    <td className="px-4 py-3">
                      <input type="checkbox" aria-label={`Marcar ${shipment.code}`} checked={selected.has(shipment.id)} onChange={() => toggle(shipment.id)} />
                    </td>
                  ) : null}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono font-semibold tracking-wider text-slate-900">{shipment.code}</span>
                    {shipment.vesselName ? <p className="text-xs text-slate-400">{shipment.vesselName}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    {shipment.recipient.name}
                    <p className="text-xs text-slate-400">
                      {shipment.recipient.island} · {shipment.recipient.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3">{shipment.sender.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {shipment.volumes.length} · {formatKg(shipment.volumes.reduce((sum, volume) => sum + volume.weightKg, 0))}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      {statusesOf(shipment).map((status) => (
                        <VolumeStatusBadge key={status} status={status} />
                      ))}
                    </span>
                  </td>
                  {tab === "at_agency" ? (
                    <td className="px-4 py-3 text-right">
                      <Link href={`/agencia-cv/entregar?q=${encodeURIComponent(shipment.code)}`}>
                        <Button size="sm" variant="outline">
                          <PackageCheck className="h-3.5 w-3.5" aria-hidden /> Entregar
                        </Button>
                      </Link>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            itemLabel="encomendas"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
          {search ? "Nenhuma encomenda corresponde à pesquisa." : "Não há encomendas nesta lista."}
        </div>
      )}
    </AppShell>
  );
}
