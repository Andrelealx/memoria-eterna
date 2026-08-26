import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Família — "Nossa Família". Visual acolhedor (oliva/terracota) e editorial.
export function NossaFamilia({ content, photos }: TemplateProps) {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);

  return (
    <div className="min-h-screen bg-emerald-50 text-stone-800">
      <header className="border-b border-emerald-100 px-6 py-16 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-emerald-700">Nossa família</p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl">{content.title || content.recipientName}</h1>
        {content.relationshipDate && (
          <p className="mt-3 text-emerald-800">
            Desde{" "}
            {new Date(`${content.relationshipDate}T00:00:00`).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-5 py-16">
        {cover && (
          <BlurFade>
            <Photo src={cover.url} alt={cover.altText} aspect="aspect-[16/10]" />
          </BlurFade>
        )}

        {content.message && (
          <BlurFade>
            <section className="mt-12 rounded-3xl bg-white p-8 shadow-sm">
              <p className="whitespace-pre-line text-center text-lg leading-8">{content.message}</p>
            </section>
          </BlurFade>
        )}

        {content.moments.length > 0 && (
          <BlurFade>
            <section className="mt-14">
              <h2 className="font-serif text-2xl">Nossa história</h2>
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

        {gallery.length > 0 && (
          <BlurFade>
            <section className="mt-14 grid grid-cols-2 gap-3">
              {gallery.map((p) => (
                <Photo key={p.assetId} src={p.url} alt={p.altText} aspect="aspect-[3/4]" />
              ))}
            </section>
          </BlurFade>
        )}

        {content.music && (
          <BlurFade>
            <section className="mt-14">
              <MusicEmbed music={content.music} />
            </section>
          </BlurFade>
        )}

        {content.finalPhrase && (
          <BlurFade>
            <section className="mt-14 text-center">
              <p className="font-serif text-2xl italic text-emerald-700">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
