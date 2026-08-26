import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <h1 className="font-serif text-3xl">Termos de uso</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          Conteúdo em preparação. Os termos definitivos serão publicados antes do lançamento em
          produção.
        </p>
        <p>
          Enquanto isso, o uso da plataforma em ambiente de desenvolvimento é apenas para testes,
          com dados fictícios e sem valor jurídico.
        </p>
      </div>
    </section>
  );
}
