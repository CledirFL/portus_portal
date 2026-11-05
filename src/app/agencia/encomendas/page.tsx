"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CargoTypeIcon } from "@/components/cargo-type-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { getCargoType } from "@/domain/cargo-types";
import type { ShipmentStatus } from "@/domain/status-labels";
import { ShipmentStatusBadge } from "@/modules/shipments/components/shipment-status";
import { listShipments, type ShipmentPage } from "@/services/api/shipments";
import { useAuthStore } from "@/store/auth-store";

const tabs: Array<{ key: ShipmentStatus | "all"; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "draft", label: "Rascunho" },
  { key: "validated", label: "Validadas" },
  { key: "cancelled", label: "Canceladas" },
];

export default function ShipmentsPage() {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<ShipmentStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [result, setResult] = useState<ShipmentPage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    // Respostas de filtros antigos chegam por vezes depois das novas: ignoram-se.
    let isCurrent = true;
    listShipments({ status: tab === "all" ? undefined : tab, q: search, page, pageSize })
      .then((shipmentPage) => {
        if (!isCurrent) return;
        setResult(shipmentPage);
        setError("");
      })
      .catch((cause: unknown) => {
        if (isCurrent) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as encomendas.");
      });
    return () => {
      isCurrent = false;
    };
  }, [user, tab, search, page, pageSize]);

  const shipments = result?.items ?? null;

  return (
    <AppShell>
      <PageHeader
        title="Encomendas"
        description="Encomendas registadas no balcão ou criadas a partir de pedidos de clientes."
        actions={
          <Link href="/agencia/encomendas/nova">
            <Button>
              <Plus className="h-4 w-4" aria-hidden /> Nova encomenda
            </Button>
          </Link>
        }
      />

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
          <Input
            aria-label="Procurar encomendas"
            placeholder="Código, nº de guia, VIN, nome ou telefone"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4" aria-hidden />
            <span className="sr-only">Procurar</span>
          </Button>
        </form>
      </div>

      {error ? (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {shipments === null ? (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      ) : result && shipments.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Encomenda</th>
                <th className="px-4 py-3 font-medium">Carga</th>
                <th className="px-4 py-3 font-medium">Remetente → destinatário</th>
                <th className="px-4 py-3 font-medium">Volumes</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment) => {
                const type = getCargoType(shipment.category);
                return (
                  <tr key={shipment.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        href={`/agencia/encomendas/${shipment.id}`}
                        className="font-mono font-semibold tracking-wider text-brand-700 hover:text-brand-800"
                      >
                        {shipment.code}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {new Date(shipment.createdAt).toLocaleDateString("pt-PT")}
                        {shipment.externalReference ? ` · guia ${shipment.externalReference}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <CargoTypeIcon icon={type.icon} className="h-4 w-4 text-slate-500" />
                        {type.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {shipment.sender.name} → {shipment.recipient.name}
                      <p className="text-xs text-slate-400">{shipment.recipient.island}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {shipment.totals.volumes} · {shipment.totals.weightKg} kg
                    </td>
                    <td className="px-4 py-3">
                      <ShipmentStatusBadge status={shipment.status} />
                    </td>
                  </tr>
                );
              })}
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
          {search ? "Nenhuma encomenda corresponde à pesquisa." : "Ainda não há encomendas nesta lista."}
        </div>
      )}
    </AppShell>
  );
}
