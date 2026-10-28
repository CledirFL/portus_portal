"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listCollections } from "@/modules/field-agent/services/collection-storage";
import type { FieldCollection } from "@/modules/field-agent/types/collection";
import { useAuthStore } from "@/store/auth-store";

export default function AgentCollectionsPage() {
  const user = useAuthStore((state) => state.user);
  const [collections, setCollections] = useState<FieldCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCurrent = true;
    listCollections(user.id)
      .then((records) => {
        if (isCurrent) {
          setCollections(records);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(
            error instanceof Error ? error.message : "Não foi possível carregar as recolhas.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [user]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Recolhas</h2>
          <p className="text-sm text-slate-500">Registos das encomendas recolhidas no terreno.</p>
        </div>
        <Link href="/agent/collections/new">
          <Button>Nova recolha</Button>
        </Link>
      </div>

      <div
        role="note"
        className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      >
        Os dados e fotografias ficam guardados apenas neste navegador; não são sincronizados com
        outros dispositivos.
      </div>

      {loadError ? (
        <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-800">
          {loadError}
        </p>
      ) : null}

      <Card title="Histórico de recolhas">
        {isLoading ? (
          <p role="status" className="mt-4 text-sm text-slate-600">
            A carregar recolhas…
          </p>
        ) : collections.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Ainda não existem recolhas neste navegador.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200" data-cy="collection-list">
            {collections.map((collection) => (
              <li
                key={collection.id}
                data-cy="collection-record"
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {collection.fields.recipientName} · {collection.fields.contentDescription}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {collection.id} · {new Date(collection.createdAt).toLocaleString("pt-PT")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Fotografia guardada: {collection.photoName}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                  {collection.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
