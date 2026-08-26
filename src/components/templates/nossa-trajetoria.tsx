import type { TemplateProps } from "./types";
import { Photo } from "./photo";
import { MusicEmbed } from "./music-embed";
import { BlurFade } from "@/components/ui/blur-fade";

// Template Aniversário (2) — "Nossa Trajetória". Linha do tempo com foto ao lado.
export function NossaTrajetoria({ content, photos }: TemplateProps) {
  return (
    <div className="min-h-screen bg-pink-50 text-stone-800">
      <header className="bg-gradient-to-b from-pink-100 to-pink-50 px-6 py-16 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-pink-600">Uma trajetória</p>
        <h1 className="mt-4 font-serif text-4xl md:text-5xl text-pink-900">{content.recipientName}</h1>
        {content.title && <p className="mt-2 text-pink-700">{content.title}</p>}
      </header>

      <div className="mx-auto max-w-2xl px-5 py-12">
        {content.message && (
          <BlurFade>
            <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <p className="whitespace-pre-line text-lg leading-8">{content.message}</p>
            </section>
          </BlurFade>
        )}

        {content.moments.length > 0 && (
          <section className="mt-14 space-y-10">
            {content.moments.map((m, i) => {
              const photo = photos.find((p) => p.assetId === m.assetId);
              return (
                <BlurFade key={m.id} delay={i * 0.05}>
                  <div className="grid items-center gap-4 md:grid-cols-2">
                    <div className={i % 2 === 0 ? "md:order-1" : "md:order-2"}>
                      {photo ? (
                        <Photo src={photo.url} alt={m.title} aspect="aspect-square" />
                      ) : (
                        <div className="aspect-square rounded-2xl bg-pink-100" />
                      )}
                    </div>
                    <div className={i % 2 === 0 ? "md:order-2" : "md:order-1"}>
                      {m.date && <p className="text-sm text-pink-500">{m.date}</p>}
                      <h2 className="mt-1 font-serif text-xl">{m.title}</h2>
                      {m.text && <p className="mt-2 text-sm leading-6 text-stone-600">{m.text}</p>}
                    </div>
                  </div>
                </BlurFade>
              );
            })}
          </section>
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
              <p className="font-serif text-2xl italic text-pink-600">{content.finalPhrase}</p>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
