import type { Metadata } from "next";
import Link from "next/link";
import { NICHE_LABELS, templatesByNiche } from "@/lib/domain/templates";
import { NICHES } from "@/lib/domain/enums";
import { buttonVariants } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import { ShineBorder } from "@/components/ui/shine-border";

export const metadata: Metadata = {
  title: "Modelos",
  description: "Escolha um template para o seu presente.",
};

export default function ModelosPage() {
  const byNiche = templatesByNiche();

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <BlurFade>
          <div className="text-center">
            <h1 className="font-serif text-4xl md:text-5xl">Modelos</h1>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Escolha o estilo que mais combina com a sua ocasião. Todos funcionam perfeitamente no
              celular.
            </p>
          </div>
        </BlurFade>

        {NICHES.map((niche) => {
          const templates = byNiche[niche];
          if (templates.length === 0) return null;
          return (
            <section key={niche} className="mt-16">
              <h2 className="font-serif text-2xl">{NICHE_LABELS[niche]}</h2>
              <div className="mt-6 grid gap-8 md:grid-cols-3">
                {templates.map((t, i) => (
                  <BlurFade key={t.slug} delay={i * 0.1} className="h-full">
                    <ShineBorder borderRadius={24} className="h-full">
                      <Link
                        href={`/modelos/${t.slug}`}
                        className="group flex h-full flex-col items-center p-8 transition-transform duration-300 hover:-translate-y-1"
                      >
                        <div className="flex h-[220px] w-[150px] items-center justify-center rounded-[1.8rem] border border-border bg-gradient-to-b from-secondary to-background">
                          <span className="font-serif text-5xl text-primary">{t.name.slice(0, 1)}</span>
                        </div>
                        <h3 className="mt-5 font-serif text-xl">{t.name}</h3>
                        <p className="mt-2 flex-1 text-center text-sm leading-6 text-muted-foreground">
                          {t.description}
                        </p>
                        <span className="mt-5 text-sm font-medium text-primary group-hover:underline">
                          Ver modelo
                        </span>
                      </Link>
                    </ShineBorder>
                  </BlurFade>
                ))}
              </div>
            </section>
          );
        })}

        <BlurFade className="mt-16 text-center">
          <Link href="/criar" className={buttonVariants({ variant: "shiny", size: "lg" })}>
            Criar meu presente
          </Link>
        </BlurFade>
      </div>
    </section>
  );
}
