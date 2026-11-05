"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Botão "Cancelar pedido" com confirmação e motivo opcional. */
export function CancelRequest({ onCancel }: { onCancel: (reason: string | undefined) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <XCircle className="h-4 w-4" aria-hidden /> Cancelar pedido
      </Button>
    );
  }

  return (
    <form
      data-cy="cancel-request"
      className="space-y-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsBusy(true);
        setError("");
        try {
          await onCancel(reason.trim() || undefined);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Não foi possível cancelar o pedido.");
          setIsBusy(false);
        }
      }}
    >
      <p className="text-sm font-medium text-rose-800">Quer mesmo cancelar este pedido? A agência deixa de o tratar.</p>
      <Input label="Motivo (opcional)" value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" size="sm" disabled={isBusy}>
          Confirmar cancelamento
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={isBusy} onClick={() => setIsOpen(false)}>
          Voltar
        </Button>
      </div>
    </form>
  );
}
