import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { DEFAULT_TEMPLATES } from "@/lib/domain/templates";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Modelos",
  description: "Escolha um template romântico para o seu presente.",
};

export default function ModelosPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif text-4xl md:text-5xl">Modelos românticos</h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Escolha o estilo que mais combina com a história de vocês. Todos funcionam perfeitamente
          no celular.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {DEFAULT_TEMPLATES.map((t) => (
          <Link
            key={t.slug}
            href={`/modelos/${t.slug}`}
            className="group flex flex-col items-center rounded-3xl border border-border bg-white p-8 transition-colors hover:border-primary"
          >
            <div className="flex h-[300px] w-[160px] items-center justify-center rounded-[1.8rem] border border-border bg-secondary">
              <Heart className="h-9 w-9 text-primary" />
            </div>
            <h2 className="mt-5 font-serif text-xl">{t.name}</h2>
            <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">
              {t.description}
            </p>
            <span className="mt-5 text-sm font-medium text-primary group-hover:underline">
              Ver modelo
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link href="/criar" className={buttonVariants({ size: "lg" })}>
          Criar meu presente
        </Link>
      </div>
    </section>
  );
}
