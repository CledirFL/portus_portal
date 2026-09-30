"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mockLogin } from "@/services/mock/auth";
import { useAuthStore } from "@/store/auth-store";

const loginSchema = z.object({
  email: z.string().email("Insira um email válido."),
  password: z.string().min(6, "A password deve ter pelo menos 6 caracteres."),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "ana@portus.cv",
      password: "password123",
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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-700">PORTUS</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Entrar no portal</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              {...register("email")}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              placeholder="ana@portus.cv"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
            ) : null}
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
            {errors.password ? (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            ) : null}
          </div>

          {serverError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {serverError}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "A entrar..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-5 rounded-md bg-slate-100 p-3 text-xs text-slate-600">
          Demo credentials: <span className="font-semibold">ana@portus.cv</span> / <span className="font-semibold">password123</span>
        </div>
      </Card>
    </main>
  );
}
