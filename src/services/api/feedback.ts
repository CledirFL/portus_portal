import { apiDownload, apiRequest } from "@/lib/api-client";

export type FeedbackType = "bug" | "missing" | "improvement";
export type FeedbackPriority = "low" | "medium" | "high";
export type FeedbackStatus = "new" | "in_review" | "resolved" | "not_a_bug";

export interface FeedbackReport {
  id: string;
  number: number;
  type: FeedbackType;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  description: string;
  page: string;
  userAgent: string | null;
  hasScreenshot: boolean;
  adminNote: string | null;
  reporter: { name: string; email: string; role: string };
  createdAt: string;
  updatedAt: string;
}

export const feedbackTypeLabels: Record<FeedbackType, string> = { bug: "Erro", missing: "Falta", improvement: "Melhoria" };
export const feedbackPriorityLabels: Record<FeedbackPriority, string> = { low: "Baixa", medium: "Média", high: "Alta" };
export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  new: "Novo",
  in_review: "Em análise",
  resolved: "Resolvido",
  not_a_bug: "Não é erro",
};

export function reportProblem(input: { type: FeedbackType; priority: FeedbackPriority; description: string; page: string }) {
  return apiRequest<FeedbackReport>("/feedback", { method: "POST", body: input });
}

export function attachFeedbackScreenshot(id: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest<FeedbackReport>(`/feedback/${id}/screenshot`, { method: "POST", body: form });
}

export function listFeedback(query: { status?: FeedbackStatus; type?: FeedbackType; page: number; pageSize: number }) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.status) params.set("status", query.status);
  if (query.type) params.set("type", query.type);
  return apiRequest<{ items: FeedbackReport[]; total: number; page: number; pageSize: number; open: number }>(`/feedback?${params}`);
}

export function updateFeedback(id: string, input: { status?: FeedbackStatus; adminNote?: string | null }) {
  return apiRequest<FeedbackReport>(`/feedback/${id}`, { method: "PATCH", body: input });
}

/** Captura de ecrã (a API exige sessão, por isso vem como blob). */
export async function feedbackScreenshot(id: string) {
  return (await apiDownload(`/feedback/${id}/screenshot`, "captura.png")).blob;
}
