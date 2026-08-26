import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { timeTogetherLabel } from "@/lib/domain/counter";

// Template 1 — Romance Clássico (seção 11): capa em tela cheia, carta central,
// galeria em mosaico, linha do tempo vertical e detalhes dourados/rosa queimado.
export function RomanceClassico({ content, photos }: TemplateProps) {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);
  const together = content.counterEnabled && content.relationshipDate
    ? timeTogetherLabel(content.relationshipDate)
    : null;

  return (
    <div className="min-h-screen bg-creme text-foreground">
      {/* Capa */}
      {cover && (
        <section className="relative flex h-[80vh] items-end justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover.url}
            alt={cover.altText}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/90 via-primary/40 to-transparent" />
          <div className="relative z-10 px-6 pb-16 text-center text-white">
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-accent">
              {content.title}
            </p>
            <h1 className="mt-3 font-serif text-4xl md:text-6xl">
              {content.creatorName} &amp; {content.recipientName}
            </h1>
            {content.relationshipDate && (
              <p className="mt-4 text-sm text-creme/90">
                {new Date(`${content.relationshipDate}T00:00:00`).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-2xl px-5 py-16">
        {/* Contador */}
        {together && (
          <section className="text-center">
            <p className="font-serif text-3xl md:text-4xl">Juntos há {together}</p>
            <div className="mx-auto mt-4 h-px w-16 bg-accent" />
          </section>
        )}

        {/* Carta central */}
        {content.message && (
          <section className="mt-12 rounded-3xl border border-border bg-white p-8 shadow-sm md:p-10">
            <p className="whitespace-pre-line font-serif text-lg leading-8 text-foreground">
              {content.message}
            </p>
          </section>
        )}

        {/* Galeria em mosaico */}
        {gallery.length > 0 && (
          <section className="mt-14 grid grid-cols-2 gap-3">
            {gallery.map((p) => (
              <Photo
                key={p.assetId}
                src={p.url}
                alt={p.altText}
                aspect={gallery.length % 3 === 1 && p.position % 3 === 0 ? "aspect-square" : "aspect-[3/4]"}
              />
            ))}
          </section>
        )}

        {/* Linha do tempo */}
        {content.moments.length > 0 && (
          <section className="mt-14">
            <h2 className="font-serif text-2xl">Nossa história</h2>
            <ol className="mt-6 space-y-6 border-l border-border pl-6">
              {content.moments.map((m) => (
                <li key={m.id} className="relative">
                  <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-accent" />
                  <p className="text-sm text-muted-foreground">{m.date}</p>
                  <h3 className="font-serif text-lg">{m.title}</h3>
                  {m.text && <p className="mt-1 text-sm leading-6 text-muted-foreground">{m.text}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Música */}
        {content.music && (
          <section className="mt-14">
            <MusicEmbed music={content.music} />
          </section>
        )}

        {/* Mensagem final */}
        {content.finalPhrase && (
          <section className="mt-14 text-center">
            <p className="font-serif text-2xl italic text-primary">{content.finalPhrase}</p>
          </section>
        )}
      </div>
    </div>
  );
}
