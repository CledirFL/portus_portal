"use client";

import { useEffect, useRef, useState } from "react";
import { Bug, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { fieldClasses } from "@/components/ui/input";
import {
  attachFeedbackScreenshot,
  type FeedbackPriority,
  type FeedbackType,
  feedbackPriorityLabels,
  feedbackTypeLabels,
  reportProblem,
} from "@/services/api/feedback";

const maxScreenshotBytes = 5 * 1024 * 1024;
const typeHints: Record<FeedbackType, string> = {
  bug: "Não funciona como devia.",
  missing: "Devia existir e não existe.",
  improvement: "Funciona, mas pode ficar mais fácil ou mais claro.",
};

/** Botão "Reportar problema" no cabeçalho: regista a página atual e, se quiser, uma captura de ecrã. */
export function ReportProblem() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [priority, setPriority] = useState<FeedbackPriority>("medium");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [isOpen]);

  function reset() {
    setType("bug");
    setPriority("medium");
    setDescription("");
    setFile(null);
    setError("");
    setSent(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <Bug className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Reportar problema</span>
      </button>

      <dialog
        ref={dialog}
        onClose={() => setIsOpen(false)}
        aria-labelledby="report-problem-title"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id="report-problem-title" className="font-semibold">
            Reportar problema
          </h2>
          <button type="button" onClick={() => setIsOpen(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent !== null ? (
          <div className="px-5 py-8 text-center" data-cy="problem-sent">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
            <p className="mt-3 font-medium">Obrigado! Registámos o problema #{sent}.</p>
            <p className="mt-1 text-sm text-slate-500">O administrador vai analisá-lo.</p>
            <Button className="mt-5" variant="outline" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <form
            data-cy="report-problem"
            className="space-y-4 px-5 py-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (file && file.size > maxScreenshotBytes) {
                setError("A captura tem mais de 5 MB.");
                return;
              }
              setBusy(true);
              setError("");
              try {
                const report = await reportProblem({ type, priority, description, page: `${window.location.pathname}${window.location.search}` });
                if (file) await attachFeedbackScreenshot(report.id, file);
                setSent(report.number);
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Não foi possível registar o problema.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-slate-700">Tipo</legend>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(feedbackTypeLabels) as FeedbackType[]).map((option) => (
                  <label
                    key={option}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium ${
                      type === option ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <input type="radio" name="type" value={option} checked={type === option} onChange={() => setType(option)} className="sr-only" />
                    {feedbackTypeLabels[option]}
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-500">{typeHints[type]}</p>
            </fieldset>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">O que fez, o que aconteceu e o que esperava</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                maxLength={4000}
                className={fieldClasses}
                placeholder="Ex.: cliquei em Validar na encomenda ENC-… e apareceu um erro em vez da lista dos campos em falta."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Prioridade"
                value={priority}
                onChange={(event) => setPriority(event.target.value as FeedbackPriority)}
                options={(Object.keys(feedbackPriorityLabels) as FeedbackPriority[]).map((option) => ({ value: option, label: feedbackPriorityLabels[option] }))}
              />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Captura de ecrã (opcional)</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
                />
              </label>
            </div>

            <p className="text-xs text-slate-500">A página atual e o navegador são registados automaticamente.</p>
            {error ? (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "A enviar…" : "Enviar"}
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
