"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { useHydrated } from "@/lib/use-hydrated";
import { mockLogin } from "@/services/mock/auth";
import { useAuthStore } from "@/store/auth-store";

const loginSchema = z.object({
  email: z.string().email("Insira um email válido."),
  password: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres."),
});

type LoginValues = z.infer<typeof loginSchema>;


export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [serverError, setServerError] = useState("");
  const isHydrated = useHydrated();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      setServerError("");
      const result = await mockLogin(values.email, values.password);
      setUser(result.user);
      router.push(result.redirectTo);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Erro ao iniciar sessão.");
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(40rem 24rem at 100% 0%, rgba(59,110,240,0.55), transparent 60%)" }}
          aria-hidden
        />
        <div className="relative">
          <Logo tone="light" />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Recolha, consolidação, despacho e levantamento num só lugar.
          </h2>
          <p className="mt-4 text-brand-100/75">
            Para agências, transitários, terminal, Alfândega e portaria.
          </p>
        </div>
        <p className="relative text-sm text-brand-200/60">De qualquer país para Cabo Verde</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Entrar no portal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quer só enviar uma encomenda?{" "}
            <Link href="/enviar" className="font-medium text-brand-700 hover:text-brand-800">
              Não precisa de conta
            </Link>
            .
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-4"
            data-cy="login-form"
            data-hydrated={isHydrated}
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                {...register("email")}
                className={fieldClasses}
                placeholder="nome@empresa.cv"
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Palavra-passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className={fieldClasses}
                placeholder="••••••••"
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
              ) : null}
            </div>

            {serverError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {serverError}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "A entrar..." : "Entrar"}
            </Button>
          </form>

          <details className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-medium text-slate-700">Contas de demonstração</summary>
            <div className="mt-2 space-y-1">
              <p>
                Exportador: <span className="font-semibold">ana@portus.cv</span>
              </p>
              <p>
                Agente de recolha: <span className="font-semibold">agente@portus.cv</span>
              </p>
              <p>
                Administrador: <span className="font-semibold">joao@portus.cv</span>
              </p>
              <p>
                Palavra-passe: <span className="font-semibold">PortusDemo!2026-CV</span>
              </p>
            </div>
          </details>

          <p className="mt-6 text-center text-sm text-slate-500">
            Empresa sem conta?{" "}
            <Link href="/register" className="font-medium text-brand-700 hover:text-brand-800">
              Pedir acesso
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
