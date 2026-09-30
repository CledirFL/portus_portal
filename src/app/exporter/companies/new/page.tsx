"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NewExporterPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Novo exportador</h2>
        <p className="text-sm text-slate-500">Registe a entidade internacional responsável pela carga.</p>
      </div>

      <Card title="Dados da empresa">
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Nome legal" placeholder="Atlantic Exports Ltd." />
          <Input label="País" placeholder="Portugal" />
          <Input label="Contactos" placeholder="+351 214 556 110" />
          <Input label="Licença comercial" placeholder="LIC-PT-2024-118" />

          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <Button type="submit">Guardar exportador</Button>
            {submitted ? <span className="text-sm font-medium text-emerald-700">Registo guardado em mock.</span> : null}
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
