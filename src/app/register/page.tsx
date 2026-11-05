"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { roleLabels } from "@/lib/permissions";
import { requestAccess } from "@/services/api/users";

const requestableRoles = ["agente_recolha", "transitario", "agente_maritimo", "cv_operator", "alfandega", "portaria"] as const;

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Insira o nome completo."),
    email: z.string().trim().email("Insira um email válido."),
    phone: z.string().trim().min(6, "Insira o telefone, com indicativo."),
    organization: z.string().trim().min(2, "Insira o nome da empresa ou entidade."),
    role: z.enum(requestableRoles),
    accessNote: z.string().trim().max(500).optional(),
    password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a palavra-passe."),
    acceptTerms: z.boolean().refine((value) => value, "Tem de confirmar para continuar."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

/** "Pedir acesso" para a equipa: a conta fica em revisão até o administrador a aprovar. */
export default function RegisterPage() {
  const [serverError, setServerError] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "agente_recolha", phone: "+", acceptTerms: false },
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      setServerError("");
      const { name, email, phone, organization, role, accessNote, password } = values;
      await requestAccess({ name, email, phone, organization, role, accessNote, password });
      setSentTo(email);
    } catch (error) {
      if (error instanceof ApiError && error.issues.length) {
        for (const issue of error.issues) setError(issue.path as keyof RegisterValues, { message: issue.message });
      }
      setServerError(error instanceof Error ? error.message : "Não foi possível enviar o pedido.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <Card className="w-full max-w-2xl">
        {sentTo ? (
          <div className="py-6 text-center" data-cy="access-requested">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Pedido de acesso enviado</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              O administrador vai confirmar os seus dados e associar a conta à sua agência ou ao seu porto. Enviamos um email para{" "}
              <strong className="text-slate-900">{sentTo}</strong> quando a conta estiver ativa.
            </p>
            <Link href="/login" className="mt-6 inline-block">
              <Button variant="outline">Voltar ao início de sessão</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-700">PORTUS</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">Pedir acesso para a equipa</h1>
              <p className="mt-2 text-sm text-slate-600">
                Para agências, transitários, terminal, Alfândega e portaria. O pedido fica em revisão até o administrador o aprovar.
                Clientes não precisam de conta: basta <Link href="/enviar" className="font-medium text-brand-700">enviar uma encomenda</Link>.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Nome completo" placeholder="Ana Silva" {...register("name")} error={errors.name?.message} />
                <Input label="Email profissional" type="email" placeholder="ana@empresa.pt" {...register("email")} error={errors.email?.message} />
                <Input label="Telefone" type="tel" placeholder="+351 912 345 678" {...register("phone")} error={errors.phone?.message} />
                <Input label="Empresa ou entidade" placeholder="Morabeza Envios" {...register("organization")} error={errors.organization?.message} />
                <Select
                  label="Perfil"
                  {...register("role")}
                  options={requestableRoles.map((role) => ({ value: role, label: roleLabels[role] }))}
                  error={errors.role?.message}
                />
                <Input
                  label="Agência ou porto onde trabalha (opcional)"
                  placeholder="Ex.: agência de Lisboa, porto da Praia"
                  {...register("accessNote")}
                  error={errors.accessNote?.message}
                />
                <Input label="Palavra-passe" type="password" autoComplete="new-password" {...register("password")} error={errors.password?.message} />
                <Input
                  label="Confirmar palavra-passe"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                />
              </div>

              <label className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <input type="checkbox" {...register("acceptTerms")} className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600" />
                <span>Confirmo que os dados são verdadeiros e que o pedido vai ser revisto antes de ter acesso.</span>
              </label>
              {errors.acceptTerms ? <p className="text-xs text-rose-600">{errors.acceptTerms.message}</p> : null}

              {serverError ? (
                <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {serverError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? "A enviar…" : "Pedir acesso"}
                </Button>
                <Link href="/login" className="text-sm font-medium text-brand-700 hover:text-brand-800">
                  Já tenho conta
                </Link>
              </div>
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
