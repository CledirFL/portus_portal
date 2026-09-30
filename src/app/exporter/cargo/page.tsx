"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import { mockCargo, mockConsignees, mockExporters } from "@/mocks/domain";
import { filterByQuery, getCargoStatusTone } from "@/lib/domain";

export default function CargoPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => filterByQuery(mockCargo, query, ["cargoType", "description", "hsCode", "countryOfOrigin"]), [query]);

  const getExporterName = (exporterId: string) => mockExporters.find((exporter) => exporter.id === exporterId)?.legalName ?? exporterId;
  const getConsigneeName = (consigneeId: string) => mockConsignees.find((consignee) => consignee.id === consigneeId)?.name ?? consigneeId;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Carga</h2>
          <p className="text-sm text-slate-500">Catalogação da mercadoria e classificação por HS Code.</p>
        </div>

        <Link href="/exporter/cargo/new">
          <Button>Nova carga</Button>
        </Link>
      </div>

      <div className="mb-6 max-w-md">
        <Input
          label="Pesquisar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tipo, HS Code ou origem"
        />
      </div>

      <Card title="Registos de carga">
        <div className="mt-4">
          <Table
            columns={[
              { key: "cargoType", label: "Tipo" },
              { key: "description", label: "Descrição" },
              { key: "hsCode", label: "HS Code" },
              { key: "commercialValue", label: "Valor" },
              { key: "countryOfOrigin", label: "Origem" },
              {
                key: "exporterId",
                label: "Exportador",
                render: (value) => <span className="font-medium text-slate-800">{getExporterName(String(value))}</span>,
              },
              {
                key: "consigneeId",
                label: "Destinatário",
                render: (value) => <span className="font-medium text-slate-800">{getConsigneeName(String(value))}</span>,
              },
              {
                key: "status",
                label: "Status",
                render: (value) => (
                  <Badge tone={getCargoStatusTone(value as "Agendado" | "Em carga" | "Concluído")}>
                    {String(value)}
                  </Badge>
                ),
              },
            ]}
            rows={rows}
            emptyMessage="Sem registos de carga."
          />
        </div>
      </Card>
    </AppShell>
  );
}
