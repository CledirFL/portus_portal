"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import type { Agency } from "@/domain/agency";
import { cargoTypes, type CargoCategory } from "@/domain/cargo-types";
import { ApiError } from "@/lib/api-client";
import { fetchAgencies } from "@/services/api/agencies";
import {
  commitImport,
  getImportFields,
  listImports,
  previewImport,
  uploadImport,
  type ImportField,
  type ImportMapping,
  type ImportReport,
  type ShipmentImport,
} from "@/services/api/imports";
import { useAuthStore } from "@/store/auth-store";

/** Modelo CSV com os títulos que o importador reconhece sozinho. */
const templateHeader = [
  "Nº Guia",
  "Tipo",
  "Remetente",
  "Telefone remetente",
  "Destinatário",
  "Telefone destinatário",
  "Ilha",
  "NIF",
  "Conteúdo",
  "Peso (kg)",
  "Volume (m3)",
];
const templateRow = ["G-001", "Caixa", "Rosa Tavares", "+351 912 345 678", "Maria Lopes", "+238 991 22 33", "São Vicente", "", "Roupa", "12,5", "0,1"];

function downloadTemplate() {
  // ";" e BOM para o Excel em português abrir com as colunas certas.
  const content = `﻿${templateHeader.join(";")}\r\n${templateRow.join(";")}\r\n`;
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo-importacao-portus.csv";
  link.click();
  URL.revokeObjectURL(url);
}

const statusLabels = { valid: "Válida", invalid: "Com erros", duplicate: "Possível duplicado" } as const;
const statusTones = { valid: "success", invalid: "danger", duplicate: "warning" } as const;

export default function ImportPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const [fields, setFields] = useState<ImportField[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agencyId, setAgencyId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [current, setCurrent] = useState<ShipmentImport | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [defaultCategory, setDefaultCategory] = useState<CargoCategory | "">("encomenda_pequena");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [result, setResult] = useState<ImportReport | null>(null);
  const [confirmDuplicates, setConfirmDuplicates] = useState(false);
  const [history, setHistory] = useState<ShipmentImport[]>([]);
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    getImportFields().then(setFields).catch(() => setFields([]));
    listImports().then((page) => setHistory(page.items)).catch(() => setHistory([]));
    if (isAdmin) fetchAgencies().then(setAgencies).catch(() => setAgencies([]));
  }, [user, isAdmin]);

  const run = async <T,>(action: () => Promise<T>) => {
    setBusy(true);
    setError("");
    setIssues({});
    try {
      return await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocorreu um erro inesperado.");
      if (cause instanceof ApiError) {
        setIssues(Object.fromEntries(cause.issues.map((issue) => [issue.path.replace(/^mapping\./, ""), issue.message])));
      }
      return null;
    } finally {
      setBusy(false);
    }
  };

  const columnOptions = useMemo(() => {
    if (!current) return [];
    return [
      { value: "", label: "— não usar —" },
      ...current.headers.map((header, index) => {
        const example = current.sample.map((row) => row[index]).find((value) => value);
        return { value: String(index), label: example ? `${header} (ex.: ${example})` : header };
      }),
    ];
  }, [current]);

  const reset = () => {
    setFile(null);
    setCurrent(null);
    setReport(null);
    setResult(null);
    setConfirmDuplicates(false);
    setMapping({});
  };

  const step = result ? 4 : report ? 3 : current ? 2 : 1;
  const toImport = report ? report.summary.valid + (confirmDuplicates ? report.summary.duplicates : 0) : 0;

  return (
    <AppShell>
      <PageHeader
        title="Importar lista"
        description="Carregue a lista da agência em Excel (.xlsx) ou CSV. Cada linha é um volume; linhas com o mesmo nº de guia formam uma encomenda."
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" aria-hidden /> Modelo CSV
          </Button>
        }
      />

      <ol className="mb-6 grid grid-cols-4 gap-2 text-xs font-medium" aria-label="Passos">
        {["Ficheiro", "Colunas", "Pré-visualização", "Importado"].map((label, index) => (
          <li key={label} aria-current={step === index + 1 ? "step" : undefined}>
            <div className={`h-1.5 rounded-full ${index < step ? "bg-brand-600" : "bg-slate-200"}`} />
            <p className={`mt-2 ${step === index + 1 ? "text-slate-900" : "text-slate-400"}`}>
              {index + 1}. {label}
            </p>
          </li>
        ))}
      </ol>

      {error ? (
        <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <Card title="Escolher ficheiro">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!file) return;
              void run(() => uploadImport(file, isAdmin ? agencyId || undefined : undefined)).then((uploaded) => {
                if (!uploaded) return;
                setCurrent(uploaded);
                setMapping(uploaded.suggestedMapping);
              });
            }}
          >
            {isAdmin ? (
              <Select
                label="Agência"
                value={agencyId}
                onChange={(event) => setAgencyId(event.target.value)}
                options={[{ value: "", label: "Escolha a agência" }, ...agencies.map((agency) => ({ value: agency.id, label: agency.name }))]}
              />
            ) : null}
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center hover:border-brand-400">
              <FileSpreadsheet className="h-8 w-8 text-brand-700" aria-hidden />
              <span className="text-sm font-medium text-slate-900">{file ? file.name : "Escolher ficheiro .xlsx ou .csv"}</span>
              <span className="text-xs text-slate-500">Até 5 MB e 5000 linhas. A primeira linha é o cabeçalho.</span>
              <input
                data-cy="import-file"
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <div className="flex justify-end">
              <Button type="submit" disabled={!file || busy}>
                <Upload className="h-4 w-4" aria-hidden /> {busy ? "A ler…" : "Carregar"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {step === 2 && current ? (
        <Card title={`Colunas de ${current.fileName}`} subtitle={`${current.rowCount} linhas. Confirme a coluna de cada campo.`}>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Tipo de carga para as linhas sem tipo"
              value={defaultCategory}
              onChange={(event) => setDefaultCategory(event.target.value as CargoCategory | "")}
              options={[{ value: "", label: "— sem omissão —" }, ...cargoTypes.map((type) => ({ value: type.id, label: type.label }))]}
              error={issues.category}
            />
            <div className="hidden md:block" />
            {fields.map((field) => (
              <Select
                key={field.key}
                label={`${field.label}${field.required ? " *" : ""}`}
                value={mapping[field.key] == null ? "" : String(mapping[field.key])}
                onChange={(event) =>
                  setMapping({ ...mapping, [field.key]: event.target.value === "" ? null : Number(event.target.value) })
                }
                options={columnOptions}
                error={issues[field.key]}
              />
            ))}
          </div>
          <div className="mt-6 flex justify-between gap-2 border-t border-slate-100 pt-4">
            <Button variant="ghost" onClick={reset}>
              Outro ficheiro
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                void run(() => previewImport(current.id, mapping, defaultCategory || undefined)).then(
                  (preview) => preview && setReport(preview),
                )
              }
            >
              {busy ? "A verificar…" : "Pré-visualizar"}
            </Button>
          </div>
        </Card>
      ) : null}

      {(step === 3 || step === 4) && current ? (
        <ReportView
          report={result ?? report!}
          footer={
            result ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> {result.summary.imported} encomendas importadas em rascunho.
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={reset}>
                    Importar outro ficheiro
                  </Button>
                  <Link href="/agencia/encomendas">
                    <Button>Ver encomendas</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => setReport(null)}>
                    Mudar colunas
                  </Button>
                  {report!.summary.duplicates ? (
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-700"
                        checked={confirmDuplicates}
                        onChange={(event) => setConfirmDuplicates(event.target.checked)}
                      />
                      Importar também os possíveis duplicados
                    </label>
                  ) : null}
                </div>
                <Button
                  disabled={busy || !toImport}
                  onClick={() =>
                    void run(() => commitImport(current.id, mapping, defaultCategory || undefined, confirmDuplicates)).then((done) => {
                      if (!done) return;
                      setResult(done);
                      listImports().then((page) => setHistory(page.items)).catch(() => undefined);
                    })
                  }
                >
                  {busy ? "A importar…" : `Importar ${toImport} encomenda${toImport === 1 ? "" : "s"}`}
                </Button>
              </div>
            )
          }
        />
      ) : null}

      {history.length ? (
        <Card title="Importações recentes" className="mt-8">
          <ul className="divide-y divide-slate-100 text-sm">
            {history.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-slate-400" aria-hidden />
                  <span className="font-medium text-slate-900">{item.fileName}</span>
                  <span className="text-slate-400">{new Date(item.createdAt).toLocaleString("pt-PT")}</span>
                </span>
                <span className="text-slate-600">
                  {item.status === "committed" ? `${item.shipmentsCreated} encomendas importadas` : `${item.rowCount} linhas, por importar`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </AppShell>
  );
}

function ReportView({ report, footer }: { report: ImportReport; footer: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Linhas" value={report.summary.rows} />
        <StatCard label="Válidas" value={report.summary.valid} tone="success" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Com erros" value={report.summary.invalid} tone="danger" icon={<XCircle className="h-4 w-4" />} />
        <StatCard label="Possíveis duplicados" value={report.summary.duplicates} tone="warning" icon={<AlertTriangle className="h-4 w-4" />} />
      </div>
      <Card title="Encomendas no ficheiro" subtitle="As linhas com erros não são importadas; corrija o ficheiro e carregue-o de novo.">
        <ul className="divide-y divide-slate-100" data-cy="import-report">
          {report.groups.map((group) => (
            <li key={group.key} className="py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-slate-900">
                  {group.key} <span className="font-normal text-slate-500">· linha{group.rows.length > 1 ? "s" : ""} {group.rows.join(", ")}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-slate-500">
                    {group.recipientName ?? "—"} · {group.volumes} vol. · {group.weightKg} kg
                  </span>
                  {group.shipmentCode && group.shipmentId ? (
                    <Link href={`/agencia/encomendas/${group.shipmentId}`} className="font-mono text-xs font-semibold text-brand-700">
                      {group.shipmentCode}
                    </Link>
                  ) : (
                    <Badge tone={statusTones[group.status]}>{statusLabels[group.status]}</Badge>
                  )}
                </span>
              </div>
              {group.errors.length ? (
                <ul className="mt-1 space-y-0.5 text-xs text-rose-700">
                  {group.errors.map((error, index) => (
                    <li key={index}>
                      Linha {error.row}
                      {error.column ? `, coluna "${error.column}"` : ""}: {error.message}
                    </li>
                  ))}
                </ul>
              ) : null}
              {group.duplicates.length && !group.shipmentCode ? (
                <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
                  {group.duplicates.map((duplicate, index) => (
                    <li key={index}>{duplicate.message}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
      <Card>{footer}</Card>
    </div>
  );
}
