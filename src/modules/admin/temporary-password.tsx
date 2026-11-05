"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

/** Palavra-passe temporária, mostrada uma única vez ao administrador. */
export function TemporaryPassword({ email, password }: { email: string; password: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div data-cy="temporary-password" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="flex items-center gap-2 font-semibold">
        <KeyRound className="h-4 w-4" aria-hidden /> Palavra-passe temporária de {email}
      </p>
      <div className="mt-2 flex items-center justify-between rounded-md bg-white px-3 py-2">
        <span className="font-mono text-base font-semibold tracking-wider text-slate-900">{password}</span>
        <button
          type="button"
          className="rounded-md p-1.5 text-amber-700 hover:bg-amber-100"
          aria-label="Copiar palavra-passe"
          onClick={() => {
            void navigator.clipboard?.writeText(password);
            setCopied(true);
          }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <p className="mt-2">
        Só aparece agora. Entregue-a à pessoa por um canal seguro (pessoalmente ou por telefone), não por email.
      </p>
    </div>
  );
}
