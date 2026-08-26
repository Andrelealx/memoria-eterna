import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Pet (2) — "Aventuras do Pet". Linha do tempo das aventuras.
export function AventurasDoPet({ content, photos }: TemplateProps) {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);

  return (
    <div className="min-h-screen bg-emerald-50 text-stone-800">
      <header className="px-6 pt-16 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-600">Aventuras do pet</p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl">{content.recipientName}</h1>
        {content.title && <p className="mt-2 text-emerald-700">{content.title}</p>}
      </header>

      <div className="mx-auto max-w-2xl px-5 py-12">
        {content.message && (
          <BlurFade>
            <section className="rounded-3xl bg-white p-8 shadow-sm">
              <p className="whitespace-pre-line text-lg leading-8">{content.message}</p>
            </section>
          </BlurFade>
        )}

        {content.moments.length > 0 && (
          <BlurFade>
            <section className="mt-12">
              <h2 className="font-serif text-2xl">Nossas aventuras</h2>
              <ol className="mt-6 space-y-6 border-l border-emerald-200 pl-6">
                {content.moments.map((m) => (
                  <li key={m.id} className="relative">
                    <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    {m.date && <p className="text-sm text-emerald-700">{m.date}</p>}
                    <h3 className="font-serif text-lg">{m.title}</h3>
                    {m.text && <p className="mt-1 text-sm leading-6 text-stone-600">{m.text}</p>}
                  </li>
                ))}
              </ol>
            </section>
          </BlurFade>
        )}

        {cover && (
          <BlurFade>
            <section className="mt-12">
              <Photo src={cover.url} alt={cover.altText} aspect="aspect-[16/9]" />
            </section>
          </BlurFade>
        )}

        {gallery.length > 0 && (
          <BlurFade>
            <section className="mt-12 flex snap-x gap-3 overflow-x-auto pb-4">
              {gallery.map((p) => (
                <div key={p.assetId} className="w-56 shrink-0 snap-start">
                  <Photo src={p.url} alt={p.altText} aspect="aspect-square" />
                </div>
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
              <p className="font-serif text-2xl italic text-emerald-700">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
