import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <div className="bg-background relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="bg-primary/5 pointer-events-none absolute -top-28 -right-24 h-80 w-80 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-accent/10 pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-8 font-serif text-3xl">Acessar minha conta</h1>
          <p className="text-muted-foreground mt-2 mb-6 text-sm">
            Enviamos um link de acesso por e-mail. Sem senha.
          </p>
        </div>

        {erro === "link-invalido" && (
          <p role="alert" className="bg-error/10 text-error mb-4 rounded-xl px-4 py-3 text-center text-sm">
            Esse link não é mais válido — ele já foi usado ou expirou. Peça um novo abaixo.
          </p>
        )}

        <div className="border-border bg-card rounded-3xl border p-6 shadow-sm sm:p-8">
          <LoginForm />
        </div>

        <p className="text-muted-foreground mt-8 text-center text-sm">
          <Link href="/" className="hover:text-primary underline underline-offset-2">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}
