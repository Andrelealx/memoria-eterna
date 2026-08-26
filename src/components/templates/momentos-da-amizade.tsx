import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Amizade (3) — "Momentos da Amizade". Fotos em grade e momentos em destaque.
export function MomentosDaAmizade({ content, photos }: TemplateProps) {
  return (
    <div className="min-h-screen bg-cyan-50 text-stone-800">
      <header className="px-6 pt-16 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-600">Momentos da amizade</p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl">
          {content.creatorName} &amp; {content.recipientName}
        </h1>
        {content.title && <p className="mt-2 text-cyan-700">{content.title}</p>}
      </header>

      <div className="mx-auto max-w-3xl px-5 py-12">
        {photos.length > 0 && (
          <BlurFade>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p) => (
                <Photo key={p.assetId} src={p.url} alt={p.altText} aspect="aspect-square" />
              ))}
            </div>
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
            <section className="mt-12">
              <h2 className="font-serif text-2xl">Nossos momentos</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {content.moments.map((m) => (
                  <span key={m.id} className="rounded-full bg-cyan-100 px-4 py-1.5 text-sm text-cyan-700">
                    {m.title}
                  </span>
                ))}
              </div>
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
              <p className="font-serif text-2xl italic text-cyan-600">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
