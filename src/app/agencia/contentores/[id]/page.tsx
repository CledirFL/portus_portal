"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Lock, LockOpen, Plus, ScanLine, Trash2, Undo2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useReadOnly } from "@/components/layout/read-only";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { loadTypes, type LoadType } from "@/domain/containers";
import { containerStatusLabels } from "@/domain/status-labels";
import { ApiError } from "@/lib/api-client";
import {
  CapacityBar,
  ContainerStatusBadge,
  ErrorBanner,
  ExportButtons,
  formatDateTime,
  formatKg,
  formatM3,
} from "@/modules/consolidation/components/consolidation-ui";
import {
  addBlMaster,
  assignBlMaster,
  exportContainer,
  getContainer,
  reopenContainer,
  removeBlMaster,
  removeContainerVolume,
  scanVolume,
  sealContainer,
  type Container,
} from "@/services/api/containers";
import { useAuthStore } from "@/store/auth-store";

interface ScanEntry {
  id: number;
  code: string;
  tone: "success" | "info" | "error";
  message: string;
}

const noBl = "";

/** Mensagem de erro da API com os detalhes úteis (volumes sem BL, campos inválidos). */
function describeError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return { message: fallback, items: [] as string[] };
  const volumes = Array.isArray(error.body.volumes) ? (error.body.volumes as string[]) : [];
  const issues = error.issues.map((issue) => issue.message).filter(Boolean);
  return { message: error.message, items: volumes.length ? volumes : issues };
}

export default function ContainerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const readOnly = useReadOnly();
  const [container, setContainer] = useState<Container | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState<{ message: string; items: string[] }>({ message: "", items: [] });
  const [busy, setBusy] = useState(false);

  const [scanCode, setScanCode] = useState("");
  const [scanBl, setScanBl] = useState(noBl);
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const scanInput = useRef<HTMLInputElement>(null);
  const scanCounter = useRef(0);

  const [blNumber, setBlNumber] = useState("");
  const [blLoadType, setBlLoadType] = useState<LoadType>("LCL");
  const [blMaxWeight, setBlMaxWeight] = useState("");
  const [sealNumber, setSealNumber] = useState("");
  const [reopenReason, setReopenReason] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ volumeId: string; reason: string } | null>(null);

  const load = useCallback(() => {
    getContainer(id)
      .then((loaded) => {
        setContainer(loaded);
        setScanBl((current) => current || loaded.blMasters.at(-1)?.id || noBl);
      })
      .catch((cause: unknown) => setLoadError(cause instanceof Error ? cause.message : "Não foi possível carregar o contentor."));
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const run = async (action: () => Promise<Container>, fallback: string) => {
    setBusy(true);
    setError({ message: "", items: [] });
    try {
      setContainer(await action());
      return true;
    } catch (cause) {
      setError(describeError(cause, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const pushScan = (entry: Omit<ScanEntry, "id">) => {
    scanCounter.current += 1;
    setScans((current) => [{ ...entry, id: scanCounter.current }, ...current].slice(0, 8));
  };

  const submitScan = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = scanCode.trim();
    if (!code || !container) return;
    setScanCode("");
    try {
      const response = await scanVolume(container.id, code, scanBl || null);
      setContainer(response.container);
      const bl = response.container.blMasters.find((item) => item.id === scanBl);
      pushScan(
        response.result === "added"
          ? { code: response.volumeCode, tone: "success", message: bl ? `Consolidado no BL ${bl.number}` : "Consolidado (sem BL Master)" }
          : { code: response.volumeCode, tone: "info", message: "Já estava neste contentor" },
      );
    } catch (cause) {
      const display = code.startsWith("PORTUS|") ? code.split("|")[2] ?? "QR" : code.toUpperCase();
      pushScan({ code: display, tone: "error", message: cause instanceof Error ? cause.message : "Não foi possível consolidar." });
    } finally {
      scanInput.current?.focus();
    }
  };

  if (loadError) {
    return (
      <AppShell>
        <ErrorBanner message={loadError} />
        <Link href="/agencia/contentores" className="text-sm text-brand-700">
          ← Contentores
        </Link>
      </AppShell>
    );
  }

  if (!container) {
    return (
      <AppShell>
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      </AppShell>
    );
  }

  // Aberto e esta conta pode alterá-lo (o admin da plataforma só consulta).
  const isOpen = container.status === "open" && !readOnly;
  const blById = new Map(container.blMasters.map((bl) => [bl.id, bl]));
  const blOptions = [{ value: noBl, label: "Sem BL Master (associar depois)" }, ...container.blMasters.map((bl) => ({ value: bl.id, label: `${bl.number} (${bl.loadType})` }))];

  return (
    <AppShell>
      <PageHeader
        title={container.number}
        description={`${container.sizeTypeLabel} (${container.sizeType})${container.carrier ? ` · ${container.carrier}` : ""} · ${container.agency.name}`}
        actions={<ExportButtons label="Lista de carga" onExport={(format) => exportContainer(container.id, container.number, format)} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <ContainerStatusBadge status={container.status} />
        {container.sealNumber ? (
          <span className="inline-flex items-center gap-1 text-slate-600">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Selo <strong className="font-mono">{container.sealNumber}</strong>
          </span>
        ) : null}
        {container.voyage ? (
          <Link href={`/agencia/viagens/${container.voyage.id}`} className="text-brand-700 hover:text-brand-800">
            {container.voyage.vesselName} · {container.voyage.code} · ETA {formatDateTime(container.voyage.eta)}
          </Link>
        ) : (
          <span className="text-slate-500">Sem viagem</span>
        )}
        <Link href="/agencia/contentores" className="ml-auto text-slate-500 hover:text-slate-700">
          ← Contentores
        </Link>
      </div>

      <ErrorBanner message={error.message} items={error.items} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {isOpen ? (
            <Card title="Ler volumes" subtitle="Leia o QR da etiqueta (leitor ou câmara) ou escreva o código do volume e carregue Enter.">
              <form onSubmit={submitScan} className="grid gap-3 md:grid-cols-[1fr_16rem_auto]" data-cy="scan-form">
                <Input
                  ref={scanInput}
                  aria-label="QR ou código do volume"
                  placeholder="ENC-7KQ2M9-01"
                  value={scanCode}
                  onChange={(event) => setScanCode(event.target.value)}
                  autoFocus
                  autoComplete="off"
                  className="font-mono"
                />
                <Select aria-label="BL Master dos volumes lidos" value={scanBl} onChange={(event) => setScanBl(event.target.value)} options={blOptions} />
                <Button type="submit" disabled={!scanCode.trim()}>
                  <ScanLine className="h-4 w-4" aria-hidden /> Consolidar
                </Button>
              </form>
              {scans.length ? (
                <ul className="mt-4 divide-y divide-slate-100 text-sm" aria-live="polite" data-cy="scan-log">
                  {scans.map((scan) => (
                    <li key={scan.id} className="flex items-start gap-2 py-2">
                      {scan.tone === "error" ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                      ) : (
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${scan.tone === "success" ? "text-emerald-600" : "text-slate-400"}`} aria-hidden />
                      )}
                      <span className="font-mono font-medium text-slate-800">{scan.code}</span>
                      <span className={scan.tone === "error" ? "text-rose-700" : "text-slate-600"}>{scan.message}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ) : null}

          <Card title={`Volumes (${container.volumes.length})`} subtitle={container.volumesWithoutBl ? `${container.volumesWithoutBl} volume(s) sem BL Master: associe antes de selar (BR 10).` : undefined}>
            {container.volumes.length ? (
              <div className="-mx-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-700" data-cy="container-volumes">
                  <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2 font-medium">Volume</th>
                      <th className="px-3 py-2 font-medium">Destinatário</th>
                      <th className="px-3 py-2 font-medium">Peso</th>
                      <th className="px-3 py-2 font-medium">BL Master</th>
                      {isOpen ? <th className="px-5 py-2" /> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {container.volumes.map((volume) => (
                      <tr key={volume.id} className="border-t border-slate-100 align-top">
                        <td className="px-5 py-2 whitespace-nowrap">
                          <span className="font-mono font-medium">{volume.code}</span>
                          <Link href={`/agencia/encomendas/${volume.shipment.id}`} className="block text-xs text-brand-700 hover:text-brand-800">
                            {volume.shipment.code}
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          {volume.shipment.recipientName}
                          <span className="block text-xs text-slate-400">{volume.shipment.recipientIsland}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                          {formatKg(volume.weightKg)}
                          {volume.volumeM3 !== null ? <span className="block text-xs text-slate-400">{formatM3(volume.volumeM3)}</span> : null}
                        </td>
                        <td className="px-3 py-2">
                          {isOpen ? (
                            <select
                              aria-label={`BL Master do volume ${volume.code}`}
                              className={`rounded-md border px-2 py-1 text-sm ${volume.blMasterId ? "border-slate-300" : "border-amber-400 bg-amber-50"}`}
                              value={volume.blMasterId ?? noBl}
                              disabled={busy}
                              onChange={(event) =>
                                void run(() => assignBlMaster(container.id, volume.id, event.target.value || null), "Não foi possível mudar o BL Master.")
                              }
                            >
                              {blOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.value === noBl ? "— sem BL —" : option.label}
                                </option>
                              ))}
                            </select>
                          ) : volume.blMasterId ? (
                            blById.get(volume.blMasterId)?.number
                          ) : (
                            <span className="text-amber-700">sem BL</span>
                          )}
                        </td>
                        {isOpen ? (
                          <td className="px-5 py-2 text-right">
                            {removing?.volumeId === volume.id ? (
                              <form
                                className="flex items-center justify-end gap-2"
                                onSubmit={async (event) => {
                                  event.preventDefault();
                                  if (await run(() => removeContainerVolume(container.id, volume.id, removing.reason), "Não foi possível retirar o volume.")) setRemoving(null);
                                }}
                              >
                                <input
                                  aria-label="Motivo"
                                  placeholder="Motivo (ex.: recontagem)"
                                  className="w-44 rounded-md border border-slate-300 px-2 py-1 text-sm"
                                  value={removing.reason}
                                  onChange={(event) => setRemoving({ volumeId: volume.id, reason: event.target.value })}
                                  autoFocus
                                />
                                <Button size="sm" variant="danger" type="submit" disabled={busy || removing.reason.trim().length < 3}>
                                  Retirar
                                </Button>
                                <Button size="sm" variant="ghost" type="button" onClick={() => setRemoving(null)}>
                                  Cancelar
                                </Button>
                              </form>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setRemoving({ volumeId: volume.id, reason: "" })} aria-label={`Retirar ${volume.code}`}>
                                <Undo2 className="h-3.5 w-3.5" aria-hidden /> Retirar
                              </Button>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Ainda não há volumes. {isOpen ? "Leia as etiquetas acima." : ""}</p>
            )}
          </Card>

          <Card title="Histórico">
            <ol className="space-y-2 text-sm">
              {container.history.map((event, index) => (
                <li key={`${event.at}-${index}`} className="flex flex-wrap gap-x-2">
                  <span className="tabular-nums text-slate-400">{formatDateTime(event.at)}</span>
                  <span className="font-medium text-slate-800">
                    {event.fromStatus ? `${containerStatusLabels[event.fromStatus]} → ` : ""}
                    {containerStatusLabels[event.toStatus]}
                  </span>
                  {event.reason ? <span className="text-slate-500">{event.reason}</span> : null}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Capacidade" subtitle="A consolidação é bloqueada se exceder o contentor ou o BL Master (BR 11).">
            <div className="space-y-4">
              <CapacityBar label="Peso" used={container.totals.weightKg} limit={container.capacity.maxWeightKg} format={formatKg} />
              <CapacityBar label="Volume" used={container.totals.volumeM3} limit={container.capacity.maxVolumeM3} format={formatM3} />
              <p className="text-sm text-slate-600">{container.totals.volumes} volume(s)</p>
            </div>
          </Card>

          <Card title="BL Master" subtitle="As encomendas dos clientes consolidam-se sob um BL Master (BR 10).">
            {container.blMasters.length ? (
              <ul className="mb-4 divide-y divide-slate-100 text-sm" data-cy="bl-masters">
                {container.blMasters.map((bl) => (
                  <li key={bl.id} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-mono font-medium text-slate-900">{bl.number}</p>
                      <p className="text-xs text-slate-500">
                        {bl.loadType} · {bl.totals.volumes} vol. · {formatKg(bl.totals.weightKg)}
                        {bl.maxWeightKg !== null ? ` / ${formatKg(bl.maxWeightKg)}` : ""}
                      </p>
                    </div>
                    {isOpen && bl.totals.volumes === 0 ? (
                      <Button size="sm" variant="ghost" aria-label={`Remover ${bl.number}`} disabled={busy} onClick={() => void run(() => removeBlMaster(container.id, bl.id), "Não foi possível remover o BL Master.")}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-slate-500">Ainda sem BL Master.</p>
            )}
            {isOpen ? (
              <form
                className="space-y-3"
                data-cy="new-bl"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const ok = await run(async () => {
                    const updated = await addBlMaster(container.id, {
                      number: blNumber,
                      loadType: blLoadType,
                      maxWeightKg: blMaxWeight ? Number(blMaxWeight.replace(",", ".")) : null,
                    });
                    // Os volumes lidos a seguir vão para o BL novo (já, para uma leitura imediata não ficar sem BL).
                    setScanBl(updated.blMasters.at(-1)?.id ?? noBl);
                    return updated;
                  }, "Não foi possível acrescentar o BL Master.");
                  if (ok) {
                    setBlNumber("");
                    setBlMaxWeight("");
                  }
                }}
              >
                <Input label="Nº do BL Master" placeholder="MSCULIS123456" value={blNumber} onChange={(event) => setBlNumber(event.target.value.toUpperCase())} required />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Tipo" value={blLoadType} onChange={(event) => setBlLoadType(event.target.value as LoadType)} options={loadTypes.map((type) => ({ value: type, label: type === "LCL" ? "LCL (grupagem)" : "FCL (completo)" }))} />
                  <Input label="Limite (kg)" inputMode="decimal" placeholder="opcional" value={blMaxWeight} onChange={(event) => setBlMaxWeight(event.target.value)} />
                </div>
                <Button type="submit" variant="outline" disabled={busy || blNumber.trim().length < 4} className="w-full">
                  <Plus className="h-4 w-4" aria-hidden /> Acrescentar BL Master
                </Button>
              </form>
            ) : null}
          </Card>

          {isOpen ? (
            <Card title="Selar contentor" subtitle="Registe o nº do selo. Todos os volumes têm de ter BL Master.">
              <form
                className="space-y-3"
                data-cy="seal-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (await run(() => sealContainer(container.id, sealNumber), "Não foi possível selar o contentor.")) setSealNumber("");
                }}
              >
                <Input label="Nº do selo" placeholder="ML-1234567" value={sealNumber} onChange={(event) => setSealNumber(event.target.value.toUpperCase())} required />
                <Button type="submit" disabled={busy || sealNumber.trim().length < 4 || container.volumes.length === 0} className="w-full">
                  <Lock className="h-4 w-4" aria-hidden /> Selar e fechar
                </Button>
              </form>
            </Card>
          ) : null}

          {container.status === "sealed" && !readOnly ? (
            <Card title="Reabrir" subtitle="Quebra o selo. Só antes de o navio partir; o motivo fica no histórico.">
              {reopenReason === null ? (
                <Button variant="outline" className="w-full" onClick={() => setReopenReason("")}>
                  <LockOpen className="h-4 w-4" aria-hidden /> Reabrir contentor
                </Button>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (await run(() => reopenContainer(container.id, reopenReason), "Não foi possível reabrir.")) setReopenReason(null);
                  }}
                >
                  <Input label="Motivo" value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} autoFocus />
                  <div className="flex gap-2">
                    <Button type="submit" variant="danger" disabled={busy || reopenReason.trim().length < 3}>
                      Reabrir
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setReopenReason(null)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
