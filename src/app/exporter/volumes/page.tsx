"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import { mockConsignees, mockExporters, mockVolumes } from "@/mocks/domain";
import { filterByQuery, getVolumeStatusTone } from "@/lib/domain";

export default function VolumesPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => filterByQuery(mockVolumes, query, ["globalVolumeId", "qrCode", "route", "description"]),
    [query],
  );

  const getExporterName = (exporterId: string) => mockExporters.find((exporter) => exporter.id === exporterId)?.legalName ?? exporterId;
  const getConsigneeName = (consigneeId: string) => mockConsignees.find((consignee) => consignee.id === consigneeId)?.name ?? consigneeId;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Volumes</h2>
          <p className="text-sm text-slate-500">Registo global de volumes, QR e estado operacional.</p>
        </div>

        <Link href="/exporter/volumes/new">
          <Button>Novo volume</Button>
        </Link>
      </div>

      <div className="mb-6 max-w-md">
        <Input
          label="Pesquisar"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ID, QR ou rota"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Volumes activos">
          <p className="text-3xl font-semibold text-slate-900">{mockVolumes.length}</p>
        </Card>
        <Card title="Em armazém">
          <p className="text-3xl font-semibold text-amber-600">
            {mockVolumes.filter((item) => item.status === "Em armazém").length}
          </p>
        </Card>
        <Card title="Entregues">
          <p className="text-3xl font-semibold text-emerald-600">
            {mockVolumes.filter((item) => item.status === "Entregue").length}
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="Registos de volume">
          <div className="mt-4">
            <Table
              columns={[
                { key: "globalVolumeId", label: "Volume ID" },
                { key: "qrCode", label: "QR" },
                { key: "route", label: "Rota" },
                { key: "weightKg", label: "Peso" },
                { key: "volumeM3", label: "Volume" },
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
                  label: "Estado",
                  render: (value) => (
                    <Badge tone={getVolumeStatusTone(value as "Pendente" | "Em armazém" | "Carregado" | "Entregue")}>
                      {String(value)}
                    </Badge>
                  ),
                },
              ]}
              rows={rows}
              emptyMessage="Sem volumes registados."
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
