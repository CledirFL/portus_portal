"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { gatePassFormSchema, type GatePassFormValues } from "@/schemas/portal";

export default function NewGatePassPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GatePassFormValues>({
    resolver: zodResolver(gatePassFormSchema),
    defaultValues: {
      container: "CNT-1042",
      vehicle: "TRK-44",
      destination: "Terminal Norte",
      status: "Em revisão",
      notes: "Aguardando validação documental.",
    },
  });

  const onSubmit = async (values: GatePassFormValues) => {
    console.log("Gate pass payload", values);
    alert(`Gate Pass ${values.container} registado.`);
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Novo Gate Pass</h2>
          <p className="text-sm text-slate-500">Registar movimentação e autorização de contentor.</p>
        </div>
        <Link href="/cv/gate-pass" className="text-sm font-medium text-sky-700 hover:text-sky-800">
          Voltar
        </Link>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
          <Input label="Container" {...register("container")} error={errors.container?.message} />
          <Input label="Veículo" {...register("vehicle")} error={errors.vehicle?.message} />
          <Input label="Destino" {...register("destination")} error={errors.destination?.message} />
          <Select
            label="Status"
            options={[
              { value: "Em revisão", label: "Em revisão" },
              { value: "Autorizado", label: "Autorizado" },
              { value: "Recusado", label: "Recusado" },
            ]}
            {...register("status")}
            error={errors.status?.message}
          />
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
            <textarea
              {...register("notes")}
              rows={4}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            {errors.notes ? <span className="mt-1 block text-xs text-rose-600">{errors.notes.message}</span> : null}
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "A guardar..." : "Guardar gate pass"}
            </Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
