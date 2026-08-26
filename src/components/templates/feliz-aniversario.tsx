import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Aniversário — "Feliz Aniversário". Visual festivo (violeta).
export function FelizAniversario({ content, photos }: TemplateProps) {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);

  return (
    <div className="min-h-screen bg-violet-50 text-stone-800">
      <header className="bg-gradient-to-b from-violet-100 to-violet-50 px-6 py-16 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-600">Parabéns</p>
        <h1 className="mt-4 font-serif text-5xl md:text-6xl text-violet-900">Feliz aniversário!</h1>
        <p className="mt-4 font-serif text-2xl text-violet-700">{content.recipientName}</p>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-16">
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
              <h2 className="font-serif text-2xl">Momentos para lembrar</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {content.moments.map((m) => (
                  <div key={m.id} className="rounded-2xl bg-white p-4">
                    {m.date && <p className="text-sm text-violet-500">{m.date}</p>}
                    <h3 className="font-serif text-lg">{m.title}</h3>
                    {m.text && <p className="mt-1 text-sm leading-6 text-stone-600">{m.text}</p>}
                  </div>
                ))}
              </div>
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
              <p className="font-serif text-2xl italic text-violet-700">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
