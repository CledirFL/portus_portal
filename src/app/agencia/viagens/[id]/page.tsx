"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, FilePlus2, Pencil, Plus, Send, Ship, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import {
  ContainerStatusBadge,
  DeadlineBadge,
  ErrorBanner,
  ExportButtons,
  formatDateTime,
  formatKg,
  formatM3,
  ManifestStatusBadge,
  VoyageStatusBadge,
} from "@/modules/consolidation/components/consolidation-ui";
import { VoyageForm } from "@/modules/consolidation/components/voyage-form";
import { listContainers, type ContainerSummary } from "@/services/api/containers";
import {
  assignContainerToVoyage,
  departVoyage,
  exportManifest,
  generateManifest,
  getVoyage,
  removeContainerFromVoyage,
  sendManifest,
  updateVoyage,
  type Voyage,
} from "@/services/api/voyages";
import { useAuthStore } from "@/store/auth-store";

function describeError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return { message: fallback, items: [] as string[] };
  const containers = Array.isArray(error.body.containers) ? (error.body.containers as string[]) : [];
  return { message: error.message, items: containers.length ? containers : error.issues.map((issue) => issue.message) };
}

export default function VoyageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState<{ message: string; items: string[] }>({ message: "", items: [] });
  const [notice, setNotice] = useState<{ message: string; items: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [available, setAvailable] = useState<ContainerSummary[]>([]);
  const [chosen, setChosen] = useState("");
  const [confirmDepart, setConfirmDepart] = useState(false);

  const loadAvailable = useCallback(() => {
    listContainers({ unassigned: true, pageSize: 100 })
      .then((page) => {
        const usable = page.items.filter((container) => container.status === "open" || container.status === "sealed");
        setAvailable(usable);
        setChosen((current) => (usable.some((container) => container.id === current) ? current : (usable[0]?.id ?? "")));
      })
      .catch(() => setAvailable([]));
  }, []);

  const load = useCallback(() => {
    getVoyage(id)
      .then(setVoyage)
      .catch((cause: unknown) => setLoadError(cause instanceof Error ? cause.message : "Não foi possível carregar a viagem."));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    load();
    loadAvailable();
  }, [user, load, loadAvailable]);

  const run = async (action: () => Promise<Voyage>, fallback: string) => {
    setBusy(true);
    setError({ message: "", items: [] });
    setNotice(null);
    try {
      setVoyage(await action());
      return true;
    } catch (cause) {
      setError(describeError(cause, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <AppShell>
        <ErrorBanner message={loadError} />
        <Link href="/agencia/viagens" className="text-sm text-brand-700">
          ← Viagens
        </Link>
      </AppShell>
    );
  }
  if (!voyage) {
    return (
      <AppShell>
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      </AppShell>
    );
  }

  const planned = voyage.status === "planned";
  const latest = voyage.manifests[0];
  const canSendLatest = latest && latest.status === "generated" && latest.complete && !latest.outdated;
  const unsealed = voyage.containers.filter((container) => container.status !== "sealed" && container.status !== "shipped");

  return (
    <AppShell>
      <PageHeader
        title={`${voyage.vesselName}${voyage.voyageNumber ? ` · ${voyage.voyageNumber}` : ""}`}
        description={`${voyage.code} · ${voyage.departurePort} → ${voyage.arrivalPort.code} (${voyage.arrivalPort.name}) · ${voyage.agency.name}`}
        actions={
          planned && !editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden /> Editar
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
        <VoyageStatusBadge status={voyage.status} />
        <span>ETD {voyage.etd ? formatDateTime(voyage.etd) : "—"}</span>
        <span className="font-medium text-slate-800">ETA {formatDateTime(voyage.eta)}</span>
        {voyage.departedAt ? <span>Partiu {formatDateTime(voyage.departedAt)}</span> : null}
        <DeadlineBadge deadline={voyage.manifestDeadline} />
        <Link href="/agencia/viagens" className="ml-auto text-slate-500 hover:text-slate-700">
          ← Viagens
        </Link>
      </div>

      {voyage.manifestDeadline.state === "alert" ? (
        <div role="alert" className="mb-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            Faltam menos de 72 horas para o ETA e não há manifesto atual enviado à Alfândega e à Enapor (BR 13). Gere o
            manifesto com os contentores selados e registe o envio.
          </p>
        </div>
      ) : null}

      <ErrorBanner message={error.message} items={error.items} />
      {notice ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-cy="manifest-notice">
          <p className="font-medium">{notice.message}</p>
          {notice.items.length ? (
            <ul className="mt-1 list-disc pl-5">
              {notice.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {editing ? (
        <Card title="Editar viagem" className="mb-6">
          <VoyageForm
            voyage={voyage}
            submitLabel="Guardar"
            onCancel={() => setEditing(false)}
            onSubmit={async (input) => {
              setVoyage(await updateVoyage(voyage.id, input));
              setEditing(false);
            }}
          />
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card
            title={`Contentores (${voyage.containers.length})`}
            subtitle={`${voyage.totals.volumes} volumes · ${formatKg(voyage.totals.weightKg)} · ${formatM3(voyage.totals.volumeM3)}`}
          >
            {voyage.containers.length ? (
              <ul className="divide-y divide-slate-100 text-sm" data-cy="voyage-containers">
                {voyage.containers.map((container) => (
                  <li key={container.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Link href={`/agencia/contentores/${container.id}`} className="font-mono font-semibold tracking-wider text-brand-700 hover:text-brand-800">
                      {container.number}
                    </Link>
                    <ContainerStatusBadge status={container.status} />
                    <span className="text-slate-600">
                      {container.totals.volumes} vol. · {formatKg(container.totals.weightKg)}
                      {container.sealNumber ? ` · selo ${container.sealNumber}` : ""}
                    </span>
                    <span className="text-xs text-slate-400">{container.blMasterNumbers.join(", ")}</span>
                    {planned ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto"
                        aria-label={`Retirar ${container.number} da viagem`}
                        disabled={busy}
                        onClick={async () => {
                          if (await run(() => removeContainerFromVoyage(voyage.id, container.id), "Não foi possível retirar o contentor.")) loadAvailable();
                        }}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden /> Retirar
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Ainda sem contentores.</p>
            )}

            {planned ? (
              <form
                className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-end"
                data-cy="assign-container"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!chosen) return;
                  if (await run(() => assignContainerToVoyage(voyage.id, chosen), "Não foi possível associar o contentor.")) loadAvailable();
                }}
              >
                <div className="flex-1">
                  <Select
                    label="Associar contentor"
                    value={chosen}
                    onChange={(event) => setChosen(event.target.value)}
                    options={
                      available.length
                        ? available.map((container) => ({
                            value: container.id,
                            label: `${container.number} · ${container.status === "sealed" ? "selado" : "aberto"} · ${container.totals.volumes} vol.`,
                          }))
                        : [{ value: "", label: "Não há contentores livres" }]
                    }
                  />
                </div>
                <Button type="submit" variant="outline" disabled={busy || !chosen}>
                  <Plus className="h-4 w-4" aria-hidden /> Associar
                </Button>
              </form>
            ) : null}
          </Card>

          <Card
            title="Manifesto"
            subtitle="Cada versão guarda a carga no momento em que foi gerada (BL Master, volumes, destinatários e totais)."
            actions={
              voyage.status !== "arrived" ? (
                <Button
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  disabled={busy || voyage.containers.length === 0}
                  data-cy="generate-manifest"
                  onClick={async () => {
                    setBusy(true);
                    setError({ message: "", items: [] });
                    setNotice(null);
                    try {
                      const manifest = await generateManifest(voyage.id);
                      if (!manifest.complete) {
                        setNotice({ message: `Versão ${manifest.version} gerada, mas incompleta: não pode ser enviada.`, items: manifest.content.issues });
                      }
                      setVoyage(await getVoyage(voyage.id));
                    } catch (cause) {
                      setError(describeError(cause, "Não foi possível gerar o manifesto."));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <FilePlus2 className="h-3.5 w-3.5" aria-hidden /> Gerar nova versão
                </Button>
              ) : null
            }
          >
            {voyage.manifests.length ? (
              <ul className="divide-y divide-slate-100" data-cy="manifests">
                {voyage.manifests.map((manifest, index) => (
                  <li key={manifest.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-semibold text-slate-900">Versão {manifest.version}</span>
                      <ManifestStatusBadge status={manifest.status} outdated={manifest.outdated && manifest.status === "sent"} />
                      {!manifest.complete ? <span className="text-xs text-amber-700">incompleto</span> : null}
                      {manifest.outdated && index === 0 && manifest.status !== "sent" ? <span className="text-xs text-amber-700">a carga mudou depois desta versão</span> : null}
                      <span className="text-slate-500">
                        {manifest.totalVolumes} vol. · {formatKg(manifest.totalWeightKg)} · gerado {formatDateTime(manifest.createdAt)}
                        {manifest.sentAt ? ` · enviado ${formatDateTime(manifest.sentAt)}` : ""}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <ExportButtons label="Descarregar" onExport={(format) => exportManifest(voyage, manifest, format)} />
                      {index === 0 && canSendLatest ? (
                        <Button size="sm" disabled={busy} data-cy="send-manifest" onClick={() => void run(() => sendManifest(voyage.id, manifest.id), "Não foi possível registar o envio.")}>
                          <Send className="h-3.5 w-3.5" aria-hidden /> Registar envio à Alfândega e Enapor
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Ainda não foi gerado nenhum manifesto.</p>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Enquanto não existir a ligação eletrónica à Alfândega e à Enapor, envie o ficheiro pelos canais habituais e registe aqui o envio.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Partida do navio" subtitle="Todos os contentores têm de estar selados. Contentores e volumes passam a Embarcado.">
            {planned ? (
              confirmDepart ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">Confirma a partida de {voyage.vesselName}? Depois não é possível alterar a viagem nem reabrir os contentores.</p>
                  <div className="flex gap-2">
                    <Button
                      disabled={busy}
                      data-cy="confirm-depart"
                      onClick={async () => {
                        await run(() => departVoyage(voyage.id), "Não foi possível registar a partida.");
                        setConfirmDepart(false);
                      }}
                    >
                      <Ship className="h-4 w-4" aria-hidden /> Confirmar partida
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmDepart(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {unsealed.length ? <p className="mb-3 text-sm text-amber-700">Por selar: {unsealed.map((container) => container.number).join(", ")}</p> : null}
                  <Button className="w-full" disabled={busy || voyage.containers.length === 0} onClick={() => setConfirmDepart(true)} data-cy="depart">
                    <Ship className="h-4 w-4" aria-hidden /> Registar partida
                  </Button>
                </>
              )
            ) : (
              <p className="text-sm text-slate-600">{voyage.departedAt ? `Partiu em ${formatDateTime(voyage.departedAt)}.` : "—"}</p>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
