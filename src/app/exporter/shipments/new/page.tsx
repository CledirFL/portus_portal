"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { shipmentFormSchema, type ShipmentFormValues } from "@/schemas/portal";

export default function NewShipmentPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      code: "BL-2024-056",
      exporter: "Atlantic Exports",
      origin: "Mindelo",
      destination: "Rotterdam",
      status: "Em trânsito",
      eta: "2026-10-02",
      volume: "2.4k TEU",
    },
  });

  const onSubmit = async (values: ShipmentFormValues) => {
    const payload = {
      ...values,
      route: `${values.origin} → ${values.destination}`,
    };

    console.log("New shipment payload", payload);
    alert(`Embarque ${values.code} criado com sucesso.`);
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Novo embarque</h2>
          <p className="text-sm text-slate-500">Registar nova operação de exportação.</p>
        </div>
        <Link href="/exporter/shipments" className="text-sm font-medium text-sky-700 hover:text-sky-800">
          Voltar
        </Link>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
          <Input label="Código" {...register("code")} error={errors.code?.message} />
          <Input label="Exportador" {...register("exporter")} error={errors.exporter?.message} />
          <Input label="Origem" {...register("origin")} error={errors.origin?.message} />
          <Input label="Destino" {...register("destination")} error={errors.destination?.message} />
          <Select
            label="Status"
            options={[
              { value: "Em trânsito", label: "Em trânsito" },
              { value: "Validado", label: "Validado" },
              { value: "Pendente", label: "Pendente" },
              { value: "Atrasado", label: "Atrasado" },
            ]}
            {...register("status")}
            error={errors.status?.message}
          />
          <Input label="ETA" type="date" {...register("eta")} error={errors.eta?.message} />
          <Input label="Volume" {...register("volume")} error={errors.volume?.message} />

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "A guardar..." : "Guardar embarque"}
            </Button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}
