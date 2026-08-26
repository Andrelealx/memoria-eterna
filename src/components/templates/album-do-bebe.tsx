import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Bebê (2) — "Álbum do Bebê". Marcos em cards com data.
export function AlbumDoBebe({ content, photos }: TemplateProps) {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);

  return (
    <div className="min-h-screen bg-sky-50 text-stone-800">
      <header className="px-6 pt-16 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-500">Álbum do bebê</p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl text-sky-800">{content.recipientName}</h1>
        {content.relationshipDate && (
          <p className="mt-3 text-sky-600">
            {new Date(`${content.relationshipDate}T00:00:00`).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-5 py-12">
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
              <h2 className="text-center font-serif text-2xl">Marcos</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {content.moments.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-sky-100 bg-white p-4 text-center">
                    {m.date && <p className="text-xs uppercase tracking-wide text-sky-500">{m.date}</p>}
                    <h3 className="mt-1 font-serif text-lg">{m.title}</h3>
                    {m.text && <p className="mt-1 text-sm leading-6 text-stone-600">{m.text}</p>}
                  </div>
                ))}
              </div>
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
              <p className="font-serif text-2xl italic text-sky-600">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
