"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NewVolumePage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Novo volume</h2>
        <p className="text-sm text-slate-500">Registe o volume, peso, QR e rota da carga.</p>
      </div>

      <Card title="Detalhes do volume">
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Volume ID global" placeholder="VOL-2024-004" />
          <Input label="QR Code" placeholder="QR-VOL-2024-004" />
          <Input label="Peso (kg)" placeholder="1.800kg" />
          <Input label="Volume (m³)" placeholder="14.2m³" />
          <Input label="Rota" placeholder="Mindelo → Rotterdam" className="md:col-span-2" />
          <Input label="Descrição" placeholder="Produto alimentício para entrega em porto de destino" className="md:col-span-2" />

          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <Button type="submit">Guardar volume</Button>
            {submitted ? <span className="text-sm font-medium text-emerald-700">Volume registado em mock.</span> : null}
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
