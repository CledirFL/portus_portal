"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { ApiError } from "@/lib/api-client";
import { registerCustomer } from "@/services/api/auth";

const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Indique o seu nome."),
    email: z.string().trim().email("Indique um email válido."),
    phone: z.string().trim().min(6, "Indique o telefone, com indicativo do país."),
    password: z.string().min(8, "A palavra-passe deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a palavra-passe."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As palavras-passe não coincidem.",
    path: ["confirmPassword"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

/** Conta de cliente: vê todos os seus pedidos, acompanha-os até à entrega e cancela os que estão em andamento. */
export default function SignUpPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema), defaultValues: { phone: "+" } });

  const onSubmit = async (values: SignUpValues) => {
    setServerError("");
    try {
      await registerCustomer({ name: values.name, email: values.email, phone: values.phone, password: values.password });
      router.push("/cliente");
    } catch (error) {
      if (error instanceof ApiError && error.issues.length) {
        for (const issue of error.issues) setError(issue.path as keyof SignUpValues, { message: issue.message });
      }
      setServerError(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <Card className="w-full max-w-lg">
        <div className="mb-6">
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold text-slate-900">Criar conta de cliente</h1>
          <p className="mt-2 text-sm text-slate-600">
            Com conta vê todos os seus envios num só sítio, acompanha cada um até à entrega e cancela os que ainda estão em
            andamento. Para enviar uma vez não precisa de conta:{" "}
            <Link href="/enviar" className="font-medium text-brand-700 hover:text-brand-800">
              enviar sem conta
            </Link>
            .
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate data-cy="sign-up-form">
          <Input label="Nome" autoComplete="name" {...register("name")} error={errors.name?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" autoComplete="email" {...register("email")} error={errors.email?.message} />
            <Input label="Telefone" type="tel" autoComplete="tel" placeholder="+351 912 345 678" {...register("phone")} error={errors.phone?.message} />
            <Input label="Palavra-passe" type="password" autoComplete="new-password" {...register("password")} error={errors.password?.message} />
            <Input
              label="Confirmar palavra-passe"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
          </div>

          {serverError ? (
            <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {serverError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "A criar conta…" : "Criar conta"}
            </Button>
            <Link href="/login" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              Já tenho conta
            </Link>
          </div>
        </form>
      </Card>
    </main>
  );
}
