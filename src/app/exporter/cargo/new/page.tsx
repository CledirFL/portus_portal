"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NewCargoPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Nova carga</h2>
        <p className="text-sm text-slate-500">Registe a mercadoria e os detalhes comerciais.</p>
      </div>

      <Card title="Dados da carga">
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Tipo de carga" placeholder="Bebidas" />
          <Input label="HS Code" placeholder="2208.40" />
          <Input label="Valor comercial" placeholder="€18.500" className="md:col-span-2" />
          <Input label="País de origem" placeholder="Portugal" />
          <Input label="Descrição" placeholder="Lot de bebidas para distribuição local" className="md:col-span-2" />

          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <Button type="submit">Guardar carga</Button>
            {submitted ? <span className="text-sm font-medium text-emerald-700">Carga guardada em mock.</span> : null}
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
