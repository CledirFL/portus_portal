import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Acesso</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Sem permissão</h1>
        <p className="mt-2 text-slate-600">
          Este perfil não tem acesso a esta área do portal.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Voltar para login
        </Link>
      </div>
    </main>
  );
}
