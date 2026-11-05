"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cancelMyShipmentRequest, listMyShipmentRequests } from "@/services/api/shipment-requests";
import type { ShipmentRequest } from "@/domain/shipment-request";
import { RequestCard } from "@/modules/customer/components/request-card";
import { useAuthStore } from "@/store/auth-store";

export default function CustomerHomePage() {
  const user = useAuthStore((state) => state.user);
  const [requests, setRequests] = useState<ShipmentRequest[] | null>(null);

  useEffect(() => {
    if (user) {
      void listMyShipmentRequests()
        .then(setRequests)
        .catch(() => setRequests([]));
    }
  }, [user]);

  return (
    <AppShell>
      <PageHeader
        title="Os meus pedidos"
        description="Acompanhe os envios que pediu às agências."
        actions={
          <Link href="/enviar">
            <Button>
              <Plus className="h-4 w-4" aria-hidden /> Novo envio
            </Button>
          </Link>
        }
      />

      {requests === null ? null : requests.length ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onCancel={async (reason) => {
                const cancelled = await cancelMyShipmentRequest(request.id, reason);
                setRequests((current) => current?.map((item) => (item.id === cancelled.id ? cancelled : item)) ?? null);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="font-medium text-slate-900">Ainda não tem pedidos</p>
          <p className="mt-1 text-sm text-slate-500">Faça o primeiro pedido de envio para Cabo Verde.</p>
          <Link href="/enviar" className="mt-5 inline-block">
            <Button>Enviar encomenda</Button>
          </Link>
        </div>
      )}
    </AppShell>
  );
}
