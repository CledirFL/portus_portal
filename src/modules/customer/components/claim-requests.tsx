"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmClaimCode, countClaimableRequests, requestClaimCode } from "@/services/api/shipment-requests";

/**
 * Juntar à conta os pedidos feitos antes sem conta, com o mesmo email. Só aparece se houver algum;
 * a pessoa confirma com o código enviado para o email da conta.
 */
export function ClaimRequests({ onClaimed }: { onClaimed: (linked: number) => void }) {
  const [claimable, setClaimable] = useState<{ count: number; email: string } | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void countClaimableRequests()
      .then(setClaimable)
      .catch(() => setClaimable(null));
  }, []);

  if (!claimable?.count) return null;
  const plural = claimable.count === 1 ? "pedido feito" : "pedidos feitos";

  return (
    <div data-cy="claim-requests" className="mb-4 rounded-2xl border border-brand-200 bg-brand-50/60 p-4 text-sm text-slate-700">
      <p className="flex items-center gap-2 font-medium text-slate-900">
        <Link2 className="h-4 w-4 text-brand-700" aria-hidden />
        Tem {claimable.count} {plural} sem conta com o email {claimable.email}
      </p>

      {!codeSent ? (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>Junte-os à sua conta para os ver e gerir aqui. Enviamos um código para o seu email para confirmar.</p>
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMessage(null);
              try {
                await requestClaimCode();
                setCodeSent(true);
                setMessage({ tone: "info", text: `Enviámos um código de 6 algarismos para ${claimable.email}. Vale 15 minutos.` });
              } catch (cause) {
                setMessage({ tone: "error", text: cause instanceof Error ? cause.message : "Não foi possível enviar o código." });
              } finally {
                setBusy(false);
              }
            }}
          >
            Juntar à minha conta
          </Button>
        </div>
      ) : (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setMessage(null);
            try {
              const { linked } = await confirmClaimCode(code);
              setClaimable(null);
              onClaimed(linked);
            } catch (cause) {
              setMessage({ tone: "error", text: cause instanceof Error ? cause.message : "Não foi possível confirmar o código." });
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="sm:w-48">
            <Input label="Código do email" inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
          </div>
          <Button type="submit" disabled={busy || code.length !== 6}>
            Confirmar
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => setCodeSent(false)}>
            Enviar outro código
          </Button>
        </form>
      )}

      {message ? (
        <p role={message.tone === "error" ? "alert" : "status"} className={`mt-2 ${message.tone === "error" ? "text-rose-700" : "text-slate-600"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
