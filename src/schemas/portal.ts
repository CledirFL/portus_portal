import { z } from "zod";

export const shipmentFormSchema = z.object({
  code: z.string().min(3, "Código obrigatório."),
  exporter: z.string().min(2, "Nome do exportador é obrigatório."),
  route: z.string().min(3, "Rota obrigatória."),
  status: z.enum(["Em trânsito", "Validado", "Pendente", "Atrasado"]),
  eta: z.string().min(1, "Data ETA obrigatória."),
  volume: z.string().min(1, "Volume obrigatório."),
});

export const gatePassFormSchema = z.object({
  container: z.string().min(3, "Container obrigatório."),
  vehicle: z.string().min(2, "Veículo obrigatório."),
  destination: z.string().min(2, "Destino obrigatório."),
  status: z.enum(["Em revisão", "Autorizado", "Recusado"]),
  notes: z.string().max(200, "Máximo de 200 caracteres.").optional(),
});

export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;
export type GatePassFormValues = z.infer<typeof gatePassFormSchema>;
