"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mockRegister } from "@/services/mock/auth";
import { useAuthStore } from "@/store/auth-store";

const roleOptions = [
  { value: "exporter", label: "Exportador" },
  { value: "transitario", label: "Transitário" },
  { value: "agente_maritimo", label: "Agente Marítimo" },
  { value: "cv_operator", label: "Operador CV" },
] as const;

const registerSchema = z
  .object({
    name: z.string().min(2, "Insira o nome completo."),
    email: z.string().email("Insira um email válido."),
    company: z.string().min(2, "Insira o nome da empresa."),
    country: z.string().min(2, "Selecione o país."),
    role: z.enum(["exporter", "transitario", "agente_maritimo", "cv_operator"]),
    taxId: z.string().min(3, "Insira o NIF ou identificador da entidade."),
    password: z.string().min(8, "A password deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a password."),
    acceptTerms: z.boolean().refine((value) => value, "Tem de aceitar os termos para continuar."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As passwords não coincidem.",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: "Cabo Verde",
      role: "exporter",
      acceptTerms: false,
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      setServerError("");
      const result = await mockRegister({
        name: values.name,
        email: values.email,
        company: values.company,
        country: values.country,
        role: values.role,
        taxId: values.taxId,
        password: values.password,
      });

      setUser(result.user);
      router.push(result.redirectTo);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Não foi possível concluir o registo.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <Card className="w-full max-w-2xl">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-700">PORTUS</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Criar conta no PORTUS</h1>
          <p className="mt-2 text-sm text-slate-600">
            Registe a sua empresa e comece a operar em poucos minutos. O seu pedido ficará em revisão antes de ganhar acesso total ao portal.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                Nome completo
              </label>
              <input
                id="name"
                {...register("name")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                placeholder="Ana Silva"
              />
              {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p> : null}
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email profissional
              </label>
              <input
                id="email"
                {...register("email")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                placeholder="ana@empresa.pt"
              />
              {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <label htmlFor="company" className="mb-1 block text-sm font-medium text-slate-700">
                Empresa
              </label>
              <input
                id="company"
                {...register("company")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                placeholder="Atlantic Exports"
              />
              {errors.company ? <p className="mt-1 text-xs text-rose-600">{errors.company.message}</p> : null}
            </div>

            <div>
              <label htmlFor="country" className="mb-1 block text-sm font-medium text-slate-700">
                País
              </label>
              <select
                id="country"
                {...register("country")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="Cabo Verde">Cabo Verde</option>
                <option value="Portugal">Portugal</option>
                <option value="França">França</option>
                <option value="Países Baixos">Países Baixos</option>
              </select>
              {errors.country ? <p className="mt-1 text-xs text-rose-600">{errors.country.message}</p> : null}
            </div>

            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-700">
                Perfil
              </label>
              <select
                id="role"
                {...register("role")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role ? <p className="mt-1 text-xs text-rose-600">{errors.role.message}</p> : null}
            </div>

            <div>
              <label htmlFor="taxId" className="mb-1 block text-sm font-medium text-slate-700">
                NIF / Identificador da entidade
              </label>
              <input
                id="taxId"
                {...register("taxId")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                placeholder="PT123456789"
              />
              {errors.taxId ? <p className="mt-1 text-xs text-rose-600">{errors.taxId.message}</p> : null}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                placeholder="••••••••"
              />
              {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
                Confirmar password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                placeholder="••••••••"
              />
              {errors.confirmPassword ? (
                <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
              ) : null}
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <input type="checkbox" {...register("acceptTerms")} className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600" />
            <span>
              Confirmo que os dados fornecidos são verdadeiros e aceito a revisão do pedido de acesso ao PORTUS.
            </span>
          </label>
          {errors.acceptTerms ? <p className="text-xs text-rose-600">{errors.acceptTerms.message}</p> : null}

          {serverError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {serverError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "A criar conta..." : "Criar conta"}
            </Button>

            <Link href="/login" className="text-sm font-medium text-sky-700 hover:text-sky-800">
              Já tenho conta
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
