"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function NewConsigneePage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Novo destinatário</h2>
        <p className="text-sm text-slate-500">Registe a entidade recebedora em Cabo Verde.</p>
      </div>

      <Card title="Dados do destinatário">
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Nome" placeholder="Maria Lopes" />
          <Input label="NIF" placeholder="987654321" />
          <Select
            label="Tipo de documento"
            defaultValue="BI"
            options={[
              { value: "BI", label: "BI" },
              { value: "Passaporte", label: "Passaporte" },
              { value: "NIF", label: "NIF" },
            ]}
          />
          <Input label="Número do documento" placeholder="BI-230989" />
          <Input label="Telefone" placeholder="+238 991 112 233" />
          <Input label="Endereço" placeholder="Rua da Marinha 14, Mindelo" />

          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <Button type="submit">Guardar destinatário</Button>
            {submitted ? <span className="text-sm font-medium text-emerald-700">Destinatário guardado em mock.</span> : null}
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
