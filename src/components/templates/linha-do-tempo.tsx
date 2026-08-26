import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { timeTogetherLabel } from "@/lib/domain/counter";
import { BlurFade } from "@/components/ui/blur-fade";

// Template 2 — Nossa Linha do Tempo (seção 11): editorial, momentos alternando
// foto e texto, linha vertical fina, contador em destaque e galeria final.
export function LinhaDoTempo({ content, photos }: TemplateProps) {
  const together = content.counterEnabled && content.relationshipDate
    ? timeTogetherLabel(content.relationshipDate)
    : null;

  return (
    <div className="min-h-screen bg-white text-foreground">
      <BlurFade>
        <header className="border-b border-border px-6 py-16 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">A nossa história</p>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl">
            {content.creatorName} &amp; {content.recipientName}
          </h1>
          {content.relationshipDate && (
            <p className="mt-4 text-sm text-muted-foreground">
              Desde{" "}
              {new Date(`${content.relationshipDate}T00:00:00`).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </header>
      </BlurFade>

      {together && (
        <BlurFade>
          <div className="border-b border-border bg-secondary px-6 py-8 text-center">
            <p className="font-serif text-2xl md:text-3xl text-primary">Juntos há {together}</p>
          </div>
        </BlurFade>
      )}

      {/* Momentos alternados */}
      <div className="mx-auto max-w-3xl px-5 py-16">
        {content.moments.map((m, i) => {
          const photo = photos.find((p) => p.assetId === m.assetId);
          const even = i % 2 === 0;
          return (
            <BlurFade key={m.id} delay={i * 0.05}>
              <section
                className="grid items-center gap-6 md:grid-cols-2 md:gap-12"
              >
                <div className={even ? "md:order-1" : "md:order-2"}>
                  {photo ? (
                    <Photo src={photo.url} alt={m.title} aspect="aspect-[4/3]" />
                  ) : (
                    <div className="aspect-[4/3] rounded-2xl bg-secondary" />
                  )}
                </div>
                <div className={even ? "md:order-2" : "md:order-1"}>
                  <p className="text-sm text-muted-foreground">{m.date}</p>
                  <h2 className="mt-1 font-serif text-2xl">{m.title}</h2>
                  {m.text && <p className="mt-2 leading-7 text-muted-foreground">{m.text}</p>}
                </div>
              </section>
            </BlurFade>
          );
        })}

        {/* Carta / mensagem principal */}
        {content.message && (
          <BlurFade>
            <section className="mt-16 rounded-3xl bg-secondary/50 p-8">
              <p className="whitespace-pre-line font-serif text-lg leading-8">{content.message}</p>
            </section>
          </BlurFade>
        )}

        {/* Galeria final (carrossel acessível via scroll-snap) */}
        {photos.length > 0 && (
          <BlurFade>
            <section className="mt-16">
              <h2 className="font-serif text-2xl">Momentos</h2>
              <div
                className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
                role="list"
                aria-label="Galeria de fotos"
              >
                {photos.map((p) => (
                  <div key={p.assetId} role="listitem" className="w-64 shrink-0 snap-start">
                    <Photo src={p.url} alt={p.altText} aspect="aspect-[3/4]" />
                  </div>
                ))}
              </div>
            </section>
          </BlurFade>
        )}

        {content.music && (
          <BlurFade>
            <section className="mt-14">
              <MusicEmbed music={content.music} />
            </section>
          </BlurFade>
        )}

        {content.finalPhrase && (
          <BlurFade>
            <section className="mt-14 text-center">
              <p className="font-serif text-2xl italic text-primary">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
