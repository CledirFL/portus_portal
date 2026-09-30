"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import { mockCargo, mockConsignees } from "@/mocks/domain";
import { filterByQuery } from "@/lib/domain";

export default function ConsigneesPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => filterByQuery(mockConsignees, query, ["name", "nif", "documentNumber", "phone", "address"]), [query]);

  const cargoByConsignee = (consigneeId: string) => mockCargo.filter((cargo) => cargo.consigneeId === consigneeId);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Destinatários</h2>
          <p className="text-sm text-slate-500">Entidades receptoras da mercadoria em Cabo Verde.</p>
        </div>

        <Link href="/exporter/consignees/new">
          <Button>Novo destinatário</Button>
        </Link>
      </div>

      <div className="mb-6 max-w-md">
        <Input
          label="Pesquisar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome, NIF, endereço"
        />
      </div>

      <Card title="Destinatários registados">
        <div className="mt-4">
          <Table
            columns={[
              { key: "name", label: "Nome" },
              { key: "nif", label: "NIF" },
              { key: "documentType", label: "Doc." },
              { key: "documentNumber", label: "Número" },
              { key: "phone", label: "Telefone" },
              {
                key: "id",
                label: "Carga associada",
                render: (_, row) => (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-800">{cargoByConsignee(row.id).length} carga(s)</span>
                    <span className="text-xs text-slate-500">
                      {cargoByConsignee(row.id)
                        .map((cargo) => cargo.cargoType)
                        .slice(0, 2)
                        .join(", ") || "Nenhuma carga"}
                    </span>
                  </div>
                ),
              },
              { key: "address", label: "Endereço" },
            ]}
            rows={rows}
            emptyMessage="Nenhum destinatário encontrado."
          />
        </div>
      </Card>
    </AppShell>
  );
}
