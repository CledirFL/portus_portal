"use client";

import { use, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AgencyFields } from "@/modules/admin/agency-form";
import { fieldErrors } from "@/modules/admin/user-form";
import {
  type AdminAgency,
  type AgencyInput,
  agencyKindLabels,
  getAdminAgency,
  listAdminAgencies,
  setAgencyPartners,
  updateAgency,
} from "@/services/api/admin-agencies";
import { useAuthStore } from "@/store/auth-store";

function toInput(agency: AdminAgency): AgencyInput {
  const { code, name, kind, countryCode, city, address, phone, email, islands, categories, offersPickup, status } = agency;
  return { code, name, kind, countryCode, city, address, phone, email, islands, categories, offersPickup, status };
}

/** Agências em Cabo Verde que entregam as encomendas pequenas desta agência de origem. */
function Partners({ agency, onSaved }: { agency: AdminAgency; onSaved: (agency: AdminAgency) => void }) {
  const [all, setAll] = useState<AdminAgency[]>([]);
  const [selected, setSelected] = useState(agency.destinations.map((destination) => destination.id));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void listAdminAgencies().then((agencies) => setAll(agencies.filter((item) => item.kind === "destination")));
  }, []);

  const uncovered = agency.islands.filter((island) => !all.some((item) => selected.includes(item.id) && item.islands.includes(island)));

  return (
    <Card title="Agências em Cabo Verde" subtitle="Entregam as encomendas pequenas desta agência; cada encomenda vai para a que atende a ilha do destinatário.">
      <form
        data-cy="agency-partners"
        className="space-y-3 text-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            onSaved(await setAgencyPartners(agency.id, selected));
            setMessage("Guardado.");
          } catch (cause) {
            setMessage(cause instanceof Error ? cause.message : "Não foi possível guardar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {all.length ? (
          all.map((destination) => (
            <label key={destination.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2.5">
              <input
                type="checkbox"
                className="mt-1"
                checked={selected.includes(destination.id)}
                onChange={() =>
                  setSelected((current) => (current.includes(destination.id) ? current.filter((id) => id !== destination.id) : [...current, destination.id]))
                }
              />
              <span>
                <span className="font-medium text-slate-900">{destination.name}</span>
                <span className="block text-xs text-slate-500">
                  {destination.city} · {destination.islands.join(", ")}
                </span>
              </span>
            </label>
          ))
        ) : (
          <p className="text-slate-500">Ainda não há agências em Cabo Verde. Crie-as primeiro.</p>
        )}
        {uncovered.length ? (
          <p className="text-xs text-amber-700">Sem agência em Cabo Verde (levantam no porto): {uncovered.join(", ")}.</p>
        ) : null}
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={busy}>
            Guardar
          </Button>
          {message ? <span className="text-slate-600">{message}</span> : null}
        </div>
      </form>
    </Card>
  );
}

export default function AgencyPage({ params }: PageProps<"/admin/agencias/[id]">) {
  const { id } = use(params);
  const user = useAuthStore((state) => state.user);
  const [agency, setAgency] = useState<AdminAgency | null>(null);
  const [values, setValues] = useState<AgencyInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    getAdminAgency(id)
      .then((found) => {
        setAgency(found);
        setValues(toInput(found));
      })
      .catch((cause: unknown) => setMessage({ tone: "error", text: cause instanceof Error ? cause.message : "Não foi possível carregar a agência." }));
  }, [user, id]);

  return (
    <AppShell>
      <PageHeader backHref="/admin/agencias" title={agency?.name ?? "Agência"} description={agency ? `${agencyKindLabels[agency.kind]} · ${agency.code}` : undefined} />
      {message ? (
        <div
          role={message.tone === "error" ? "alert" : "status"}
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${message.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
        >
          {message.text}
        </div>
      ) : null}
      {agency && values ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card title="Dados da agência">
            <form
              className="space-y-5"
              onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                setErrors({});
                setMessage(null);
                try {
                  const updated = await updateAgency(id, values);
                  setAgency(updated);
                  setValues(toInput(updated));
                  setMessage({ tone: "ok", text: "Alterações guardadas." });
                } catch (cause) {
                  setErrors(fieldErrors(cause));
                  setMessage({ tone: "error", text: cause instanceof Error ? cause.message : "Não foi possível guardar." });
                } finally {
                  setBusy(false);
                }
              }}
            >
              <AgencyFields values={values} onChange={setValues} errors={errors} />
              <Button type="submit" variant="outline" disabled={busy}>
                Guardar alterações
              </Button>
            </form>
          </Card>
          {agency.kind === "origin" ? (
            <Partners agency={agency} onSaved={setAgency} />
          ) : (
            <Card title="Agências de origem" subtitle="Enviam encomendas pequenas que esta agência entrega. A ligação faz-se na agência de origem.">
              {agency.origins.length ? (
                <ul className="space-y-1 text-sm">
                  {agency.origins.map((origin) => (
                    <li key={origin.id}>
                      <span className="font-medium text-slate-900">{origin.name}</span> <span className="text-slate-500">· {origin.city}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Ainda nenhuma.</p>
              )}
            </Card>
          )}
        </div>
      ) : message ? null : (
        <p className="py-10 text-center text-sm text-slate-500">A carregar…</p>
      )}
    </AppShell>
  );
}
