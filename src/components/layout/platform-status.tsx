"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { getPlatformStatus, type PlatformStatus } from "@/services/api/blocks";

/** Aviso do super admin: plataforma em manutenção ou processos parados (ex.: entregas suspensas). */
export function PlatformStatusBanner() {
  const [status, setStatus] = useState<PlatformStatus | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getPlatformStatus()
      .then((result) => {
        if (isCurrent) setStatus(result);
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, []);

  if (!status || (!status.maintenance && status.blocked.length === 0)) return null;
  return (
    <div role="status" data-cy="platform-status" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {status.maintenance ? "Plataforma em manutenção" : "Processos parados pela administração"}
      </p>
      <ul className="mt-1 space-y-0.5 pl-6">
        {status.maintenance ? <li>{status.maintenance.message}</li> : null}
        {status.blocked.map((item) => (
          <li key={item.process}>
            <strong>{item.label}:</strong> {item.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
