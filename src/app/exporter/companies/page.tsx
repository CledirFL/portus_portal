"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import { mockCargo, mockExporters } from "@/mocks/domain";
import { filterByQuery, getExporterStatusLabel } from "@/lib/domain";

export default function ExportersPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => filterByQuery(mockExporters, query, ["legalName", "country", "contacts", "commercialLicense"]), [query]);

  const cargoByExporter = (exporterId: string) => mockCargo.filter((cargo) => cargo.exporterId === exporterId);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Exportadores</h2>
          <p className="text-sm text-slate-500">Registos e contactos das entidades exportadoras.</p>
        </div>

        <Link href="/exporter/companies/new">
          <Button>Novo exportador</Button>
        </Link>
      </div>

      <div className="mb-6 max-w-md">
        <Input
          label="Pesquisar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nome, país ou licença"
        />
      </div>

      <Card title="Registos de exportadores">
        <div className="mt-4">
          <Table
            columns={[
              { key: "legalName", label: "Nome legal" },
              { key: "country", label: "País" },
              { key: "contacts", label: "Contactos" },
              { key: "commercialLicense", label: "Licença" },
              {
                key: "id",
                label: "Cargas ligadas",
                render: (_, row) => (
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-800">{cargoByExporter(row.id).length} registos</span>
                    <span className="text-xs text-slate-500">
                      {cargoByExporter(row.id)
                        .map((cargo) => cargo.cargoType)
                        .slice(0, 2)
                        .join(", ") || "Sem carga"}
                    </span>
                  </div>
                ),
              },
              {
                key: "status",
                label: "Estado",
                render: (value) => (
                  <Badge tone={value === "active" ? "success" : value === "review" ? "warning" : "danger"}>
                    {getExporterStatusLabel(value as "active" | "review" | "blocked")}
                  </Badge>
                ),
              },
            ]}
            rows={rows}
            emptyMessage="Nenhum exportador encontrado."
          />
        </div>
      </Card>
    </AppShell>
  );
}
