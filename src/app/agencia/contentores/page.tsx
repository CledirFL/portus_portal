"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { OperateOnly } from "@/components/layout/read-only";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { containerTypes, getContainerType } from "@/domain/containers";
import type { ContainerStatus } from "@/domain/state-machine";
import { validateContainerNumber } from "@/domain/validators";
import { ApiError } from "@/lib/api-client";
import { containerNumberHint } from "@/modules/consolidation/container-number";
import {
  ContainerStatusBadge,
  ErrorBanner,
  formatKg,
  formatM3,
} from "@/modules/consolidation/components/consolidation-ui";
import { createContainer, listContainers, type ContainerSummary, type Page } from "@/services/api/containers";
import type { Agency } from "@/domain/agency";
import { fetchAgencies } from "@/services/api/agencies";
import { useAuthStore } from "@/store/auth-store";
import { isAdminRole } from "@/lib/permissions";

const tabs: Array<{ key: ContainerStatus | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "open", label: "Abertos" },
  { key: "sealed", label: "Selados" },
  { key: "shipped", label: "Embarcados" },
];

function NewContainerForm({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [sizeType, setSizeType] = useState("22G1");
  const [carrier, setCarrier] = useState("");
  const [maxWeightKg, setMaxWeightKg] = useState(String(getContainerType("22G1")!.maxWeightKg));
  const [maxVolumeM3, setMaxVolumeM3] = useState(String(getContainerType("22G1")!.maxVolumeM3 ?? ""));
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agencyId, setAgencyId] = useState("");
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAgencies()
      .then((items) => {
        setAgencies(items);
        setAgencyId((current) => current || items[0]?.id || "");
      })
      .catch(() => setError("Não foi possível carregar as agências."));
  }, [isAdmin]);

  const numberHint = containerNumberHint(number);

  const chooseType = (code: string) => {
    const type = getContainerType(code)!;
    setSizeType(code);
    setMaxWeightKg(String(type.maxWeightKg));
    setMaxVolumeM3(type.maxVolumeM3 === null ? "" : String(type.maxVolumeM3));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setIssues([]);
    try {
      const container = await createContainer({
        agencyId: isAdmin ? agencyId : undefined,
        number,
        sizeType,
        carrier: carrier || undefined,
        maxWeightKg: Number(maxWeightKg.replace(",", ".")),
        maxVolumeM3: maxVolumeM3 ? Number(maxVolumeM3.replace(",", ".")) : null,
      });
      router.push(`/agencia/contentores/${container.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registar o contentor.");
      if (cause instanceof ApiError) setIssues(cause.issues.map((issue) => issue.message));
      setBusy(false);
    }
  };

  return (
    <Card title="Novo contentor" subtitle="O nº é validado pela norma ISO 6346, incluindo o dígito de controlo." className="mb-6">
      <ErrorBanner message={error} items={issues} />
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-6" data-cy="new-container">
        {isAdmin ? (
          <div className="md:col-span-6">
            <Select
              label="Agência"
              value={agencyId}
              onChange={(event) => setAgencyId(event.target.value)}
              options={agencies.map((agency) => ({ value: agency.id, label: `${agency.name} (${agency.city})` }))}
            />
          </div>
        ) : null}
        <div className="md:col-span-2">
          <Input
            label="Nº do contentor"
            placeholder="CSQU3054383"
            value={number}
            onChange={(event) => setNumber(event.target.value.toUpperCase())}
            error={numberHint || undefined}
            hint={!numberHint && validateContainerNumber(number).valid ? "Nº válido." : undefined}
            required
            autoComplete="off"
            className="font-mono tracking-wider"
          />
        </div>
        <div className="md:col-span-2">
          <Select
            label="Tipo"
            value={sizeType}
            onChange={(event) => chooseType(event.target.value)}
            options={containerTypes.map((type) => ({ value: type.code, label: `${type.label} (${type.code})` }))}
          />
        </div>
        <div className="md:col-span-2">
          <Input label="Armador" placeholder="MSC, Maersk, CMA CGM…" value={carrier} onChange={(event) => setCarrier(event.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Carga máxima (kg)"
            inputMode="decimal"
            value={maxWeightKg}
            onChange={(event) => setMaxWeightKg(event.target.value)}
            hint="Valor de referência do tipo; ajuste ao do armador."
            required
          />
        </div>
        <div className="md:col-span-2">
          <Input
            label="Volume máximo (m³)"
            inputMode="decimal"
            value={maxVolumeM3}
            onChange={(event) => setMaxVolumeM3(event.target.value)}
            hint="Vazio = sem limite (flat rack)."
          />
        </div>
        <div className="flex items-end md:col-span-2">
          <Button type="submit" disabled={busy || Boolean(numberHint)} className="w-full">
            <Plus className="h-4 w-4" aria-hidden /> {busy ? "A registar…" : "Registar contentor"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function ContainersPage() {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<ContainerStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [result, setResult] = useState<Page<ContainerSummary> | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    listContainers({ status: tab === "all" ? undefined : tab, q: search, page, pageSize })
      .then((containerPage) => {
        setResult(containerPage);
        setError("");
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível carregar os contentores."));
  }, [user, tab, search, page, pageSize]);

  return (
    <AppShell>
      <PageHeader
        title="Contentores"
        description="Consolide os volumes em contentores e BL Master, sele e associe a uma viagem."
        actions={
          <OperateOnly>
            <Button onClick={() => setShowForm((value) => !value)} variant={showForm ? "outline" : "primary"}>
              <Plus className="h-4 w-4" aria-hidden /> {showForm ? "Fechar" : "Novo contentor"}
            </Button>
          </OperateOnly>
        }
      />

      {showForm ? <NewContainerForm isAdmin={isAdminRole(user?.role)} /> : null}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.key}
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => {
                setTab(item.key);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === item.key ? "bg-brand-700 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form
          className="flex w-full gap-2 md:max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(query);
            setPage(1);
          }}
        >
          <Input aria-label="Procurar contentores" placeholder="Nº do contentor, BL Master ou selo" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4" aria-hidden />
            <span className="sr-only">Procurar</span>
          </Button>
        </form>
      </div>

      <ErrorBanner message={error} />

      {result === null ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : result.items.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Contentor</th>
                <th className="px-4 py-3 font-medium">BL Master</th>
                <th className="px-4 py-3 font-medium">Carga</th>
                <th className="px-4 py-3 font-medium">Viagem</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((container) => (
                <tr key={container.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/agencia/contentores/${container.id}`} className="font-mono font-semibold tracking-wider text-brand-700 hover:text-brand-800">
                      {container.number}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {container.sizeTypeLabel}
                      {container.carrier ? ` · ${container.carrier}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {container.blMasterNumbers.length ? container.blMasterNumbers.join(", ") : <span className="text-slate-400">—</span>}
                    {container.volumesWithoutBl ? <p className="text-xs text-amber-700">{container.volumesWithoutBl} volume(s) sem BL</p> : null}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {container.totals.volumes} vol. · {formatKg(container.totals.weightKg)}
                    <p className="text-xs text-slate-400">{formatM3(container.totals.volumeM3)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {container.voyage ? (
                      <Link href={`/agencia/viagens/${container.voyage.id}`} className="text-brand-700 hover:text-brand-800">
                        {container.voyage.vesselName}
                        <span className="block text-xs text-slate-400">{container.voyage.code}</span>
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ContainerStatusBadge status={container.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            itemLabel="contentores"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Ainda não há contentores{tab !== "all" ? " neste estado" : ""}. Registe o primeiro com “Novo contentor”.
        </div>
      )}
    </AppShell>
  );
}
