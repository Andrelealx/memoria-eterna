import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Pet (3) — "Diário do Pet". Marcos em formato de diário.
export function DiarioDoPet({ content, photos }: TemplateProps) {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800">
      <header className="px-6 pt-16 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-600">Diário do pet</p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl">{content.recipientName}</h1>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-12">
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

        {content.moments.length > 0 && (
          <BlurFade>
            <section className="mt-12 space-y-3">
              {content.moments.map((m) => (
                <div key={m.id} className="rounded-2xl border border-amber-200 bg-white p-4">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-serif text-lg">{m.title}</h3>
                    {m.date && <span className="text-xs text-amber-600">{m.date}</span>}
                  </div>
                  {m.text && <p className="mt-1 text-sm leading-6 text-stone-600">{m.text}</p>}
                </div>
              ))}
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
              <p className="font-serif text-2xl italic text-amber-700">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
