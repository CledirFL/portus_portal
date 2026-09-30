"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { shipmentRows } from "@/mocks/portal";

export default function ShipmentsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const filteredRows = useMemo(() => {
    return shipmentRows.filter((row) => {
      const matchesText =
        row.code.toLowerCase().includes(query.toLowerCase()) ||
        row.route.toLowerCase().includes(query.toLowerCase()) ||
        row.exporter.toLowerCase().includes(query.toLowerCase());

      const matchesStatus = status === "all" || row.status === status;
      return matchesText && matchesStatus;
    });
  }, [query, status]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Shipments</h2>
          <p className="text-sm text-slate-500">Monitorização dos embarques ativos e previstos.</p>
        </div>
        <Link href="/exporter/shipments/new">
          <Button>Novo embarque</Button>
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Input
          label="Pesquisar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Código, rota ou exportador"
        />

        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={[
            { value: "all", label: "Todos" },
            { value: "Em trânsito", label: "Em trânsito" },
            { value: "Validado", label: "Validado" },
            { value: "Pendente", label: "Pendente" },
            { value: "Atrasado", label: "Atrasado" },
          ]}
        />

        <div className="flex items-end">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Resultados: <strong>{filteredRows.length}</strong>
          </div>
        </div>
      </div>

      <Card title="Lista de embarques">
        <div className="mt-4">
          <Table
            columns={[
              { key: "code", label: "Código" },
              { key: "exporter", label: "Exportador" },
              { key: "route", label: "Rota" },
              {
                key: "status",
                label: "Status",
                render: (value) => (
                  <Badge
                    tone={
                      value === "Validado"
                        ? "success"
                        : value === "Atrasado"
                          ? "danger"
                          : value === "Pendente"
                            ? "warning"
                            : "neutral"
                    }
                  >
                    {String(value)}
                  </Badge>
                ),
              },
              { key: "eta", label: "ETA" },
            ]}
            rows={filteredRows}
            emptyMessage="Nenhum embarque encontrado com os filtros atuais."
          />
        </div>
      </Card>
    </AppShell>
  );
}
