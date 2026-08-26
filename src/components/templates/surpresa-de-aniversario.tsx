import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Aniversário (3) — "Surpresa de Aniversário". Celebração com fotos grandes.
export function SurpresaDeAniversario({ content, photos }: TemplateProps) {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);

  return (
    <div className="min-h-screen bg-rose-50 text-stone-800">
      <header className="bg-gradient-to-b from-rose-100 to-rose-50 px-6 py-16 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-rose-500">Uma surpresa</p>
        <h1 className="mt-4 font-serif text-5xl md:text-6xl text-rose-800">{content.recipientName}</h1>
        {content.title && <p className="mt-3 text-rose-600">{content.title}</p>}
      </header>

      <div className="mx-auto max-w-2xl px-5 py-12">
        {cover && (
          <BlurFade>
            <Photo src={cover.url} alt={cover.altText} aspect="aspect-[4/5]" />
          </BlurFade>
        )}

        {content.message && (
          <BlurFade>
            <section className="mt-12 rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="whitespace-pre-line text-lg leading-8">{content.message}</p>
            </section>
          </BlurFade>
        )}

        {content.moments.length > 0 && (
          <BlurFade>
            <section className="mt-12">
              <h2 className="font-serif text-2xl">Momentos</h2>
              <ul className="mt-6 space-y-3">
                {content.moments.map((m) => (
                  <li key={m.id} className="rounded-2xl bg-white p-4">
                    {m.date && <p className="text-sm text-rose-400">{m.date}</p>}
                    <h3 className="font-serif text-lg">{m.title}</h3>
                    {m.text && <p className="mt-1 text-sm leading-6 text-stone-600">{m.text}</p>}
                  </li>
                ))}
              </ul>
            </section>
          </BlurFade>
        )}

        {gallery.length > 0 && (
          <BlurFade>
            <section className="mt-12 grid grid-cols-3 gap-3">
              {gallery.map((p) => (
                <Photo key={p.assetId} src={p.url} alt={p.altText} aspect="aspect-square" />
              ))}
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
              <p className="font-serif text-2xl italic text-rose-600">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
