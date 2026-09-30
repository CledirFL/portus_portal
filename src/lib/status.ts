export type StatusTone = "neutral" | "success" | "warning" | "danger";

const statusToneMap: Record<string, StatusTone> = {
  "Validado": "success",
  "Liberado": "success",
  "Autorizado": "success",
  "Aprovada": "success",
  "Conforme": "success",
  "Ótimo": "success",
  "Normal": "neutral",
  "Em trânsito": "neutral",
  "Aguardando descarga": "neutral",
  "Observações": "warning",
  "Pendente": "warning",
  "Em revisão": "warning",
  "Em inspeção": "warning",
  "Elevado": "warning",
  "Atrasado": "danger",
  "Não conforme": "danger",
  "Recusado": "danger",
  "Em operação": "warning",
  "Atracado": "success",
  "Em rota": "neutral",
};

export function getStatusTone(value: string | undefined | null): StatusTone {
  if (!value) {
    return "neutral";
  }

  return statusToneMap[value] ?? "neutral";
}
