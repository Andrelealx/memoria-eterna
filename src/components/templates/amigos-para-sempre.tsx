import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Amizade — "Amigos para Sempre". Visual quente (âmbar) e descontraído.
export function AmigosParaSempre({ content, photos }: TemplateProps) {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      <header className="bg-gradient-to-b from-amber-100 to-amber-50 px-6 py-16 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-700">Amizade</p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl">
          {content.creatorName} &amp; {content.recipientName}
        </h1>
        {content.title && <p className="mt-3 text-amber-800">{content.title}</p>}
      </header>

      <div className="mx-auto max-w-2xl px-5 py-16">
        {cover && (
          <BlurFade>
            <Photo src={cover.url} alt={cover.altText} aspect="aspect-[4/3]" />
          </BlurFade>
        )}

        {content.message && (
          <BlurFade>
            <section className="mt-12 rounded-3xl bg-white p-8 shadow-sm">
              <p className="whitespace-pre-line text-lg leading-8">{content.message}</p>
            </section>
          </BlurFade>
        )}

        {gallery.length > 0 && (
          <BlurFade>
            <section className="mt-12 grid grid-cols-2 gap-3">
              {gallery.map((p) => (
                <Photo key={p.assetId} src={p.url} alt={p.altText} aspect="aspect-square" />
              ))}
            </section>
          </BlurFade>
        )}

        {content.moments.length > 0 && (
          <BlurFade>
            <section className="mt-12">
              <h2 className="font-serif text-2xl">Nossos momentos</h2>
              <ul className="mt-6 space-y-4">
                {content.moments.map((m, i) => (
                  <li key={m.id} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-800">
                      {i + 1}
                    </span>
                    <div>
                      {m.date && <p className="text-sm text-amber-700">{m.date}</p>}
                      <h3 className="font-serif text-lg">{m.title}</h3>
                      {m.text && <p className="mt-1 text-sm leading-6 text-stone-600">{m.text}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </BlurFade>
        )}

        {content.music && (
          <BlurFade>
            <section className="mt-12">
              <MusicEmbed music={content.music} />
            </section>
          </BlurFade>
        )}

        {content.finalPhrase && (
          <BlurFade>
            <section className="mt-12 text-center">
              <p className="font-serif text-2xl italic text-amber-700">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
