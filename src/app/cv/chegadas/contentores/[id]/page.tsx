"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, ClipboardCheck, MapPin, ScanLine } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { occurrenceTypeLabels, type OccurrenceType } from "@/domain/clearance";
import { ApiError } from "@/lib/api-client";
import { OccurrenceBadge, OccurrencePhoto } from "@/modules/arrivals/components/arrivals-ui";
import { CapacityBar, ContainerStatusBadge, ErrorBanner, formatDateTime, formatKg } from "@/modules/consolidation/components/consolidation-ui";
import { VolumeStatusBadge } from "@/modules/shipments/components/shipment-status";
import {
  addOccurrencePhoto,
  checkVolume,
  closeContainer,
  createOccurrence,
  getTerminalContainer,
  updateLocation,
  type TerminalContainer,
} from "@/services/api/arrivals";
import { useAuthStore } from "@/store/auth-store";

interface ScanEntry {
  id: number;
  code: string;
  tone: "success" | "info" | "error";
  message: string;
  /** Volume que não pertence ao contentor: pode ser registado como excesso. */
  excess?: boolean;
}

interface OccurrenceDraft {
  type: OccurrenceType;
  volumeId?: string;
  volumeCode?: string;
  description: string;
}

const count = (value: number) => String(value);

export default function TerminalContainerPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [container, setContainer] = useState<TerminalContainer | null>(null);
  const [error, setError] = useState<{ message: string; items: string[] }>({ message: "", items: [] });
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [draft, setDraft] = useState<OccurrenceDraft | null>(null);
  const [locations, setLocations] = useState<Record<string, string>>({});
  const scanInput = useRef<HTMLInputElement>(null);
  const counter = useRef(0);

  const load = useCallback(() => {
    getTerminalContainer(id)
      .then(setContainer)
      .catch((cause: unknown) => setError({ message: cause instanceof Error ? cause.message : "Não foi possível carregar o contentor.", items: [] }));
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const pushScan = (entry: Omit<ScanEntry, "id">) => {
    counter.current += 1;
    setScans((current) => [{ ...entry, id: counter.current }, ...current].slice(0, 8));
  };

  const run = async (action: () => Promise<TerminalContainer>, fallback: string) => {
    setBusy(true);
    setError({ message: "", items: [] });
    try {
      setContainer(await action());
      return true;
    } catch (cause) {
      const volumes = cause instanceof ApiError && Array.isArray(cause.body.volumes) ? (cause.body.volumes as string[]) : [];
      const issues = cause instanceof ApiError ? cause.issues.map((issue) => issue.message) : [];
      setError({ message: cause instanceof Error ? cause.message : fallback, items: volumes.length ? volumes : issues });
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!container) {
    return (
      <AppShell>
        {error.message ? <ErrorBanner message={error.message} /> : <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>}
      </AppShell>
    );
  }

  const open = container.status === "arrived";

  return (
    <AppShell>
      <PageHeader
        title={container.number}
        description={`${container.agency.name}${container.sealNumber ? ` · selo ${container.sealNumber}` : ""}${container.voyage ? ` · ${container.voyage.vesselName} (${container.voyage.code})` : ""}`}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <ContainerStatusBadge status={container.status} />
        {container.deconsolidatedAt ? <span className="text-slate-600">Desconsolidado {formatDateTime(container.deconsolidatedAt)}</span> : null}
        {container.voyage ? (
          <Link href={`/cv/chegadas/${container.voyage.id}`} className="ml-auto text-slate-500 hover:text-slate-700">
            ← Viagem
          </Link>
        ) : null}
      </div>

      <ErrorBanner message={error.message} items={error.items} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {open ? (
            <Card title="Conferir volumes" subtitle="Leia o QR de cada volume. A localização fica guardada para os volumes seguintes até a mudar.">
              <form
                className="grid gap-3 md:grid-cols-[1fr_10rem_auto]"
                data-cy="check-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const scanned = code.trim();
                  if (!scanned) return;
                  setCode("");
                  try {
                    const response = await checkVolume(container.id, scanned, location.trim() || null);
                    setContainer(response.container);
                    pushScan(
                      response.result === "checked"
                        ? { code: response.volumeCode, tone: "success", message: location ? `Conferido · ${location.toUpperCase()}` : "Conferido" }
                        : { code: response.volumeCode, tone: "info", message: "Já estava conferido" },
                    );
                  } catch (cause) {
                    const display = scanned.startsWith("PORTUS|") ? (scanned.split("|")[2] ?? "QR") : scanned.toUpperCase();
                    const excess = cause instanceof ApiError && cause.body.code === "not_in_container";
                    pushScan({
                      code: excess ? String(cause.body.volumeCode) : display,
                      tone: "error",
                      message: cause instanceof Error ? cause.message : "Não foi possível conferir.",
                      excess,
                    });
                  } finally {
                    scanInput.current?.focus();
                  }
                }}
              >
                <Input ref={scanInput} aria-label="QR ou código do volume" placeholder="ENC-7KQ2M9-01" value={code} onChange={(event) => setCode(event.target.value)} autoFocus autoComplete="off" className="font-mono" />
                <Input aria-label="Localização no armazém" placeholder="A-01-1" value={location} onChange={(event) => setLocation(event.target.value.toUpperCase())} />
                <Button type="submit" disabled={!code.trim()}>
                  <ScanLine className="h-4 w-4" aria-hidden /> Conferir
                </Button>
              </form>
              {scans.length ? (
                <ul className="mt-4 divide-y divide-slate-100 text-sm" aria-live="polite" data-cy="check-log">
                  {scans.map((scan) => (
                    <li key={scan.id} className="flex flex-wrap items-center gap-2 py-2">
                      {scan.tone === "error" ? (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                      ) : (
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${scan.tone === "success" ? "text-emerald-600" : "text-slate-400"}`} aria-hidden />
                      )}
                      <span className="font-mono font-medium text-slate-800">{scan.code}</span>
                      <span className={scan.tone === "error" ? "text-rose-700" : "text-slate-600"}>{scan.message}</span>
                      {scan.excess ? (
                        <Button size="sm" variant="outline" className="ml-auto" onClick={() => setDraft({ type: "excess", volumeCode: scan.code, description: "" })}>
                          Registar excesso
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ) : null}

          {draft ? (
            <Card title="Nova ocorrência" subtitle={draft.volumeCode ? `Volume ${draft.volumeCode}` : undefined}>
              <form
                className="grid gap-3 md:grid-cols-[12rem_1fr_auto] md:items-end"
                data-cy="occurrence-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const ok = await run(async () => (await createOccurrence(container.id, draft)).container, "Não foi possível registar a ocorrência.");
                  if (ok) setDraft(null);
                }}
              >
                {draft.type === "excess" ? (
                  <Input label="Tipo" value={occurrenceTypeLabels.excess} readOnly />
                ) : (
                  <Select
                    label="Tipo"
                    value={draft.type}
                    onChange={(event) => setDraft({ ...draft, type: event.target.value as OccurrenceType })}
                    options={(["damaged", "broken_seal", "missing"] as const).map((type) => ({ value: type, label: occurrenceTypeLabels[type] }))}
                  />
                )}
                <Input label="Descrição" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="O que foi encontrado" autoFocus />
                <div className="flex gap-2">
                  <Button type="submit" disabled={busy || draft.description.trim().length < 3}>
                    Registar
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                    Cancelar
                  </Button>
                </div>
              </form>
              <p className="mt-2 text-xs text-slate-500">As fotografias juntam-se na lista de ocorrências depois de registar.</p>
            </Card>
          ) : null}

          <Card title={`Volumes (${container.volumes.length})`}>
            <div className="-mx-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700" data-cy="terminal-volumes">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2 font-medium">Volume</th>
                    <th className="px-3 py-2 font-medium">Destinatário</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                    <th className="px-3 py-2 font-medium">Localização</th>
                    {open ? <th className="px-5 py-2" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {container.volumes.map((volume) => {
                    const editable = ["deconsolidated", "held", "released"].includes(volume.status);
                    const pendingLocation = locations[volume.id];
                    return (
                      <tr key={volume.id} className="border-t border-slate-100 align-top">
                        <td className="px-5 py-2 whitespace-nowrap">
                          <span className="font-mono font-medium">{volume.code}</span>
                          <span className="block text-xs text-slate-400">{formatKg(volume.weightKg)}</span>
                        </td>
                        <td className="px-3 py-2">
                          {volume.shipment.recipientName}
                          <span className="block text-xs text-slate-400">{volume.shipment.recipientIsland}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            <VolumeStatusBadge status={volume.status} />
                            {volume.occurrenceTypes.map((type, index) => (
                              <OccurrenceBadge key={`${type}-${index}`} type={type} />
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {editable ? (
                            <form
                              className="flex items-center gap-1"
                              onSubmit={async (event) => {
                                event.preventDefault();
                                if (!pendingLocation) return;
                                if (await run(() => updateLocation(volume.id, pendingLocation), "Não foi possível guardar a localização.")) {
                                  setLocations((current) => ({ ...current, [volume.id]: "" }));
                                }
                              }}
                            >
                              <input
                                aria-label={`Localização de ${volume.code}`}
                                className="w-24 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs"
                                placeholder="—"
                                value={pendingLocation || volume.warehouseLocation || ""}
                                onChange={(event) => setLocations((current) => ({ ...current, [volume.id]: event.target.value.toUpperCase() }))}
                              />
                              {pendingLocation && pendingLocation !== volume.warehouseLocation ? (
                                <Button size="sm" variant="ghost" type="submit" aria-label="Guardar localização">
                                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                                </Button>
                              ) : null}
                            </form>
                          ) : (
                            <span className="text-slate-400">{volume.warehouseLocation ?? "—"}</span>
                          )}
                        </td>
                        {open ? (
                          <td className="px-5 py-2 text-right">
                            <Button size="sm" variant="ghost" onClick={() => setDraft({ type: volume.status === "arrived" ? "missing" : "damaged", volumeId: volume.id, volumeCode: volume.code, description: "" })}>
                              Ocorrência
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Conferência" subtitle="O contentor só fecha com todos os volumes conferidos ou com ocorrência (BR 23).">
            <div className="space-y-3">
              <CapacityBar label="Conferidos ou com ocorrência" used={container.progress.accountedFor} limit={container.progress.volumes || 1} format={count} progress />
              {open ? (
                <Button className="w-full" disabled={busy} data-cy="close-container" onClick={() => void run(() => closeContainer(container.id), "Não foi possível fechar.")}>
                  <ClipboardCheck className="h-4 w-4" aria-hidden /> Fechar desconsolidação
                </Button>
              ) : null}
            </div>
          </Card>

          <Card title={`Ocorrências (${container.occurrences.length})`}>
            {container.occurrences.length ? (
              <ul className="space-y-4" data-cy="occurrences">
                {container.occurrences.map((occurrence) => (
                  <li key={occurrence.id} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <OccurrenceBadge type={occurrence.type} />
                      {occurrence.volumeCode ? <span className="font-mono text-slate-700">{occurrence.volumeCode}</span> : null}
                    </div>
                    <p className="mt-1 text-slate-600">{occurrence.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {occurrence.photos.map((photo) => (
                        <OccurrencePhoto key={photo.id} occurrenceId={occurrence.id} photoId={photo.id} />
                      ))}
                      {open && occurrence.photos.length < 5 ? (
                        <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:bg-slate-50">
                          <Camera className="h-4 w-4" aria-hidden />
                          Foto
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            capture="environment"
                            className="sr-only"
                            aria-label={`Fotografia da ocorrência ${occurrenceTypeLabels[occurrence.type]}`}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              if (file) void run(() => addOccurrencePhoto(occurrence.id, file), "Não foi possível enviar a fotografia.");
                            }}
                          />
                        </label>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Sem ocorrências.</p>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
