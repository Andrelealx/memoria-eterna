import type { Metadata } from "next";
import Link from "next/link";
import { NICHE_LABELS, groupTemplatesByNiche } from "@/lib/domain/templates";
import { NICHES } from "@/lib/domain/enums";
import { listActiveTemplates } from "@/lib/server/templates";
import { buttonVariants } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import { ShineBorder } from "@/components/ui/shine-border";
import { TemplateThumbnail } from "@/components/templates/template-thumbnail";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Modelos",
  description: "Escolha um template para o seu presente.",
};

export default async function ModelosPage({
  searchParams,
}: {
  searchParams: Promise<{ nicho?: string }>;
}) {
  const byNiche = groupTemplatesByNiche(await listActiveTemplates());
  const requestedNiche = (await searchParams).nicho;
  const selectedNiche = NICHES.find((niche) => niche === requestedNiche) ?? NICHES[0];
  const templates = byNiche[selectedNiche];

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

        <nav aria-label="Filtrar modelos por ocasião" className="mt-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:justify-center md:overflow-visible">
          {NICHES.map((niche) => (
            <Link
              key={niche}
              href={`/modelos?nicho=${niche}`}
              aria-current={niche === selectedNiche ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                niche === selectedNiche
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/50 hover:text-primary",
              )}
            >
              {NICHE_LABELS[niche]}
            </Link>
          ))}
        </nav>

        <section className="mt-10" aria-labelledby="catalog-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Ocasião selecionada</p>
              <h2 id="catalog-title" className="mt-1 font-serif text-2xl">
                {NICHE_LABELS[selectedNiche]}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {templates.length} {templates.length === 1 ? "modelo" : "modelos"}
            </p>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template, index) => (
              <BlurFade key={template.slug} delay={index * 0.08} className="h-full">
                <ShineBorder borderRadius={24} className="h-full">
                  <article className="flex h-full flex-col p-5">
                    <TemplateThumbnail niche={template.niche} name={template.name} slug={template.slug} />
                    <h3 className="mt-5 font-serif text-xl">{template.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                      {template.description}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <Link
                        href={`/modelos/${template.slug}`}
                        className={buttonVariants({ variant: "secondary", size: "sm" })}
                      >
                        Ver exemplo
                      </Link>
                      <Link
                        href={`/criar?template=${template.slug}`}
                        data-analytics="template_select"
                        data-analytics-label={template.slug}
                        className={buttonVariants({ size: "sm" })}
                      >
                        Usar modelo
                      </Link>
                    </div>
                  </article>
                </ShineBorder>
              </BlurFade>
            ))}
          </div>
        </section>

        <BlurFade className="mt-16 text-center">
          <Link href="/criar" className={buttonVariants({ variant: "shiny", size: "lg" })}>
            Criar meu presente
          </Link>
        </BlurFade>
      </div>
    </section>
  );
}
