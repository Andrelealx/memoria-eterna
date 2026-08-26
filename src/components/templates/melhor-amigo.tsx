import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Pet — "Meu Melhor Amigo". Visual afetuoso (céu/menta) e foto-dirigido.
export function MelhorAmigo({ content, photos }: TemplateProps) {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);

  return (
    <div className="min-h-screen bg-sky-50 text-stone-800">
      {cover && (
        <section className="relative flex h-[70vh] items-end justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.url} alt={cover.altText} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-sky-900/80 via-sky-900/30 to-transparent" />
          <div className="relative z-10 px-6 pb-14 text-center text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Meu melhor amigo</p>
            <h1 className="mt-3 font-serif text-4xl md:text-6xl">{content.recipientName}</h1>
            {content.title && <p className="mt-3 text-sm text-sky-100">{content.title}</p>}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-2xl px-5 py-16">
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
              <h2 className="font-serif text-2xl">Marcos da vida dele(a)</h2>
              <ul className="mt-6 space-y-3">
                {content.moments.map((m) => (
                  <li key={m.id} className="rounded-2xl bg-white p-4">
                    {m.date && <p className="text-sm text-sky-600">{m.date}</p>}
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
            <section className="mt-12 grid grid-cols-2 gap-3">
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
              <p className="font-serif text-2xl italic text-sky-700">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
