import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Casamento (3) — "Nossos Votos". Mensagem central em estilo de carta.
export function NossosVotos({ content, photos }: TemplateProps) {
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p !== cover);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="px-6 py-16 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-[#C6A15B]">Nossos votos</p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl">
          {content.creatorName} &amp; {content.recipientName}
        </h1>
      </header>

      <div className="mx-auto max-w-2xl px-5 pb-16">
        {content.message && (
          <BlurFade>
            <section className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
              <p className="whitespace-pre-line font-serif text-xl leading-9">{content.message}</p>
            </section>
          </BlurFade>
        )}

        {cover && (
          <BlurFade>
            <section className="mt-14">
              <Photo src={cover.url} alt={cover.altText} aspect="aspect-[4/5]" />
            </section>
          </BlurFade>
        )}

        {content.moments.length > 0 && (
          <BlurFade>
            <section className="mt-14">
              <h2 className="text-center font-serif text-2xl">Nossa história</h2>
              <ol className="mx-auto mt-8 max-w-md space-y-8 border-l border-[#C6A15B] pl-6">
                {content.moments.map((m) => (
                  <li key={m.id} className="relative">
                    <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-[#C6A15B]" />
                    {m.date && <p className="text-sm text-stone-500">{m.date}</p>}
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
              <p className="font-serif text-2xl italic text-[#9a7b3a]">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
