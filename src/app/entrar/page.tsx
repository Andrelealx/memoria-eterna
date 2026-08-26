import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-creme px-4">
      <Logo />
      <h1 className="mt-8 font-serif text-3xl">Acessar minha conta</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">
        Enviamos um link de acesso por e-mail. Sem senha.
      </p>
      <LoginForm />
      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/" className="underline">
          Voltar ao início
        </Link>
      </p>
    </div>
  );
}
