import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ajuda" };

export default function AjudaPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <h1 className="font-serif text-3xl">Ajuda</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          Precisa de ajuda? Consulte as perguntas frequentes na{" "}
          <Link href="/#como-funciona" className="text-primary underline">
            página inicial
          </Link>{" "}
          ou entre em contato pelo e-mail de suporte quando disponível.
        </p>
        <p>Central de ajuda completa em preparação.</p>
      </div>
    </section>
  );
}
