"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cancelShipmentRequestByLookup, lookupShipmentRequest } from "@/services/api/shipment-requests";
import { useHydrated } from "@/lib/use-hydrated";
import type { ShipmentRequest } from "@/domain/shipment-request";
import { RequestCard } from "@/modules/customer/components/request-card";

export function RequestLookup({ initialReference = "" }: { initialReference?: string }) {
  const [reference, setReference] = useState(initialReference);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<ShipmentRequest | null>(null);
  // Telefone com que o pedido foi encontrado (o campo pode mudar depois).
  const [foundWithPhone, setFoundWithPhone] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const isHydrated = useHydrated();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <form
          className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          data-cy="request-lookup"
          data-hydrated={isHydrated}
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSearching(true);
            setError("");
            try {
              const found = await lookupShipmentRequest(reference, phone);
              setResult(found);
              setFoundWithPhone(phone);
              setNotFound(!found);
            } catch (cause) {
              setResult(null);
              setNotFound(false);
              setError(cause instanceof Error ? cause.message : "Não foi possível consultar o pedido.");
            } finally {
              setIsSearching(false);
            }
          }}
        >
          <Input
            label="Código do pedido"
            placeholder="PED-XXXXXX"
            value={reference}
            onChange={(event) => setReference(event.target.value.toUpperCase())}
            className="font-mono uppercase tracking-wider"
            required
          />
          <Input
            label="Telefone do remetente"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
          <Button type="submit" disabled={isSearching}>
            <Search className="h-4 w-4" aria-hidden />
            Procurar
          </Button>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          Por segurança pedimos o telefone usado no pedido. Tem conta?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800">
            Entre para ver todos os envios
          </Link>
          .
        </p>
      </Card>

      {error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-center text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {notFound ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Não encontrámos nenhum pedido com esse código e telefone. Confirme os dados.
        </div>
      ) : null}
      {result ? (
        <RequestCard
          request={result}
          onCancel={async (reason) => setResult(await cancelShipmentRequestByLookup(result.reference, foundWithPhone, reason))}
        />
      ) : null}
    </div>
  );
}
