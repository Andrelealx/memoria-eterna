import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { timeTogetherLabel } from "@/lib/domain/counter";
import { BlurFade } from "@/components/ui/blur-fade";

// Template 3 — Amor Minimalista (seção 11): fundo branco quente, tipografia
// grande em grafite, fotos com respiro e vinho apenas em CTAs/divisores.
export function AmorMinimalista({ content, photos }: TemplateProps) {
  const together = content.counterEnabled && content.relationshipDate
    ? timeTogetherLabel(content.relationshipDate)
    : null;
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);

  return (
    <div className="min-h-screen bg-white text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <BlurFade>
          <header className="text-center">
            <h1 className="font-serif text-5xl leading-tight md:text-6xl">
              {content.creatorName}
              <br />
              <span className="text-muted-foreground">&amp;</span>
              <br />
              {content.recipientName}
            </h1>
            <div className="mx-auto mt-8 h-px w-12 bg-primary" />
          </header>
        </BlurFade>

        {cover && (
          <BlurFade>
            <section className="mt-16">
              <Photo src={cover.url} alt={cover.altText} aspect="aspect-[4/5]" />
            </section>
          </BlurFade>
        )}

        {together && (
          <BlurFade>
            <section className="mt-16 text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Juntos há</p>
              <p className="mt-2 font-serif text-3xl">{together}</p>
            </section>
          </BlurFade>
        )}

        {content.message && (
          <BlurFade>
            <section className="mt-16">
              <p className="whitespace-pre-line text-center text-xl leading-9 text-muted-foreground">
                {content.message}
              </p>
            </section>
          </BlurFade>
        )}

        {gallery.length > 0 && (
          <BlurFade>
            <section className="mt-20 space-y-12">
              {gallery.map((p) => (
                <Photo key={p.assetId} src={p.url} alt={p.altText} aspect="aspect-[4/3]" />
              ))}
            </section>
          </BlurFade>
        )}

        {content.moments.length > 0 && (
          <BlurFade>
            <section className="mt-20 space-y-10">
              {content.moments.map((m) => (
                <div key={m.id} className="text-center">
                  <p className="text-sm text-muted-foreground">{m.date}</p>
                  <h2 className="mt-1 font-serif text-2xl">{m.title}</h2>
                  {m.text && <p className="mt-2 leading-7 text-muted-foreground">{m.text}</p>}
                </div>
              ))}
            </section>
          </BlurFade>
        )}

        {content.music && (
          <BlurFade>
            <section className="mt-16">
              <MusicEmbed music={content.music} />
            </section>
          </BlurFade>
        )}

        {content.finalPhrase && (
          <BlurFade>
            <section className="mt-20 border-t border-border pt-10 text-center">
              <p className="font-serif text-2xl">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
