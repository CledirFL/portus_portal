"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ShipmentRequest } from "@/domain/shipment-request";
import { RequestCard } from "@/modules/customer/components/request-card";
import { cancelShipmentRequestByLink, openShipmentRequestByLink } from "@/services/api/shipment-requests";

/** Pedido aberto pelo link pessoal do email: ver o estado e cancelar sem conta. */
export function RequestByLink({ token }: { token: string }) {
  const [request, setRequest] = useState<ShipmentRequest | null | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    openShipmentRequestByLink(token)
      .then((found) => {
        if (isCurrent) setRequest(found);
      })
      .catch((cause: unknown) => {
        if (isCurrent) setError(cause instanceof Error ? cause.message : "Não foi possível abrir o pedido.");
      });
    return () => {
      isCurrent = false;
    };
  }, [token]);

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-center text-sm text-rose-700">
        {error}
      </div>
    );
  }
  if (request === undefined) {
    return <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>;
  }
  if (request === null) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="font-medium text-slate-900">Este link não é válido</p>
        <p className="mt-1 text-sm text-slate-500">
          Confirme o endereço no email ou consulte o pedido com o código e o telefone do remetente.
        </p>
        <Link href="/acompanhar" className="mt-5 inline-block">
          <Button>Acompanhar pedido</Button>
        </Link>
      </div>
    );
  }

  return (
    <RequestCard
      request={request}
      onCancel={async (reason) => setRequest(await cancelShipmentRequestByLink(token, reason))}
    />
  );
}
