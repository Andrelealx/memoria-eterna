import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <h1 className="font-serif text-3xl">Política de privacidade</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          Conteúdo em preparação. A política definitiva será publicada antes do lançamento em
          produção.
        </p>
        <p>
          Em desenvolvimento, nenhum dado real é coletado — são usados apenas dados fictícios de
          demonstração.
        </p>
      </div>
    </section>
  );
}
