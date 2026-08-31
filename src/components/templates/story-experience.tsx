import type { LucideIcon } from "lucide-react";
import { Baby, CakeSlice, Gem, Heart, Home, Leaf, PawPrint, Quote, Sparkles, Star } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { timeTogetherLabel } from "@/lib/domain/counter";
import { cn } from "@/lib/utils";
import { experienceStyle } from "./experience-palette";
import { MusicEmbed } from "./music-embed";
import { Photo } from "./photo";
import type { TemplateProps } from "./types";

export type HeroStyle = "cover" | "editorial" | "poster" | "album" | "split";
export type GalleryStyle = "mosaic" | "polaroid" | "filmstrip" | "editorial" | "grid";
export type MomentsStyle = "timeline" | "cards" | "diary" | "milestones" | "tags";
export type Motif = "heart" | "star" | "home" | "leaf" | "paw" | "cake" | "baby" | "rings" | "sparkles";

export interface StoryPreset {
  eyebrow: string;
  momentsTitle: string;
  galleryTitle: string;
  fallbackScheme: string;
  hero: HeroStyle;
  gallery: GalleryStyle;
  moments: MomentsStyle;
  motif: Motif;
  titleMode?: "title" | "recipient" | "names";
  showCounter?: boolean;
  datePrefix?: string;
}

const MOTIFS: Record<Motif, LucideIcon> = {
  heart: Heart,
  star: Star,
  home: Home,
  leaf: Leaf,
  paw: PawPrint,
  cake: CakeSlice,
  baby: Baby,
  rings: Gem,
  sparkles: Sparkles,
};

export function StoryExperience({ content, photos, preset }: TemplateProps & { preset: StoryPreset }) {
  const cover = photos.find((photo) => photo.isCover) ?? photos[0];
  const gallery = photos.filter((photo) => photo !== cover);
  const MotifIcon = MOTIFS[preset.motif];
  const title = preset.titleMode === "recipient"
    ? content.recipientName
    : preset.titleMode === "names"
      ? `${content.creatorName} & ${content.recipientName}`
      : content.title || content.recipientName;
  const together = preset.showCounter && content.counterEnabled && content.relationshipDate
    ? timeTogetherLabel(content.relationshipDate)
    : null;
  const date = formatExperienceDate(content.relationshipDate);

  return (
    <div
      className="experience-root min-h-screen overflow-hidden bg-[var(--exp-bg)] text-[var(--exp-ink)]"
      style={experienceStyle(content.colorScheme, preset.fallbackScheme)}
    >
      <ExperienceHero
        preset={preset}
        title={title}
        creatorName={content.creatorName}
        recipientName={content.recipientName}
        cover={cover}
        date={date}
        MotifIcon={MotifIcon}
      />

      <div className="relative mx-auto max-w-5xl px-5 py-16 sm:px-8 md:py-24">
        <div className="experience-orb -left-32 top-20" aria-hidden />
        <div className="experience-orb -right-40 top-1/2 [animation-delay:-4s]" aria-hidden />

        {together && (
          <BlurFade>
            <section className="relative mx-auto mb-16 max-w-3xl text-center md:mb-24">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--exp-accent)]">Nossa história acontece há</p>
              <p className="mt-4 font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">{together}</p>
              <Flourish MotifIcon={MotifIcon} />
            </section>
          </BlurFade>
        )}

        {content.message && (
          <BlurFade>
            <section className={cn(
              "relative mx-auto max-w-3xl border border-[color:var(--exp-accent)]/15 bg-[var(--exp-surface)] shadow-[0_24px_80px_-45px_var(--exp-accent)]",
              preset.moments === "diary" ? "rotate-[-0.5deg] rounded-sm px-7 py-12 sm:px-14" : "rounded-[2rem] px-7 py-10 sm:px-14 sm:py-14",
            )}>
              <Quote className="absolute left-6 top-6 h-8 w-8 text-[var(--exp-soft)] sm:left-10 sm:top-9" aria-hidden />
              <p className="whitespace-pre-line text-balance text-center font-serif text-xl leading-9 sm:text-2xl sm:leading-10">
                {content.message}
              </p>
              <p className="mt-7 text-right text-sm italic text-[var(--exp-muted)]">— {content.creatorName}</p>
            </section>
          </BlurFade>
        )}

        {content.moments.length > 0 && (
          <MomentsSection
            title={preset.momentsTitle}
            style={preset.moments}
            moments={content.moments}
            photos={photos}
            MotifIcon={MotifIcon}
          />
        )}

        {gallery.length > 0 && (
          <GallerySection title={preset.galleryTitle} style={preset.gallery} photos={gallery} />
        )}

        {content.music && (
          <BlurFade>
            <section className="mx-auto mt-20 max-w-2xl rounded-[2rem] bg-[var(--exp-soft)] p-4 sm:p-6">
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-[var(--exp-accent)]">A trilha desta história</p>
              <MusicEmbed music={content.music} />
            </section>
          </BlurFade>
        )}
      </div>

      {content.finalPhrase && (
        <BlurFade>
          <footer className="relative overflow-hidden bg-[var(--exp-accent)] px-6 py-20 text-center text-[var(--exp-contrast)] sm:py-28">
            <MotifIcon className="mx-auto h-7 w-7 opacity-70" aria-hidden />
            <p className="mx-auto mt-7 max-w-3xl text-balance font-serif text-3xl italic leading-tight sm:text-4xl md:text-5xl">{content.finalPhrase}</p>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] opacity-75">Feito especialmente para {content.recipientName}</p>
          </footer>
        </BlurFade>
      )}
    </div>
  );
}

function ExperienceHero({ preset, title, creatorName, recipientName, cover, date, MotifIcon }: {
  preset: StoryPreset;
  title: string;
  creatorName: string;
  recipientName: string;
  cover: TemplateProps["photos"][number] | undefined;
  date: string | null;
  MotifIcon: LucideIcon;
}) {
  const copy = (
    <div className="relative z-10">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--exp-accent)]">{preset.eyebrow}</p>
      <h1 className="mt-5 text-balance font-serif text-5xl leading-[0.95] sm:text-6xl md:text-7xl">{title}</h1>
      {preset.titleMode !== "names" && creatorName && recipientName && (
        <p className="mt-5 font-serif text-xl italic text-[var(--exp-muted)]">de {creatorName}, para {recipientName}</p>
      )}
      {date && <p className="mt-6 text-sm tracking-wide text-[var(--exp-muted)]">{preset.datePrefix ?? "Desde"} {date}</p>}
    </div>
  );

  if (preset.hero === "cover" && cover) {
    return (
      <header className="relative flex min-h-[78svh] items-end overflow-hidden px-6 py-16 text-[var(--exp-contrast)] sm:px-10 md:py-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover.url} alt={cover.altText} className="absolute inset-0 h-full w-full object-cover [animation:experience-zoom_18s_ease-out_both]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        <div className="relative z-10 mx-auto w-full max-w-5xl text-center [&_*]:!text-[var(--exp-contrast)]">
          <MotifIcon className="mx-auto mb-6 h-8 w-8 opacity-80" aria-hidden />
          {copy}
        </div>
      </header>
    );
  }

  if (preset.hero === "editorial" || preset.hero === "split") {
    return (
      <header className="mx-auto grid min-h-[70svh] max-w-7xl items-center gap-10 px-6 py-14 sm:px-10 md:grid-cols-2 md:gap-16 md:py-20">
        <div className={preset.hero === "split" ? "md:order-2" : undefined}>{copy}</div>
        <HeroPhoto cover={cover} style={preset.hero === "split" ? "rounded-[50%_50%_38%_62%/42%_55%_45%_58%]" : "rounded-t-[12rem] rounded-b-[2rem]"} MotifIcon={MotifIcon} />
      </header>
    );
  }

  if (preset.hero === "album") {
    return (
      <header className="relative px-6 py-16 text-center sm:py-24">
        <div className="mx-auto max-w-3xl">{copy}</div>
        <div className="mx-auto mt-12 max-w-2xl rotate-[-1.5deg] bg-[var(--exp-surface)] p-3 pb-12 shadow-[0_30px_90px_-40px_var(--exp-accent)] sm:p-5 sm:pb-16">
          {cover ? <Photo src={cover.url} alt={cover.altText} aspect="aspect-[4/3]" priority /> : <HeroPlaceholder MotifIcon={MotifIcon} />}
          <p className="mt-5 font-serif text-lg italic text-[var(--exp-muted)]">Uma história para guardar</p>
        </div>
      </header>
    );
  }

  return (
    <header className="relative isolate flex min-h-[64svh] items-center overflow-hidden px-6 py-20 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--exp-soft),transparent_36%),radial-gradient(circle_at_80%_70%,var(--exp-soft),transparent_32%)]" />
      <MotifIcon className="absolute left-[10%] top-[20%] h-20 w-20 text-[var(--exp-accent)] opacity-10" aria-hidden />
      <MotifIcon className="absolute bottom-[14%] right-[8%] h-32 w-32 rotate-12 text-[var(--exp-accent)] opacity-10" aria-hidden />
      <div className="mx-auto max-w-4xl">{copy}</div>
    </header>
  );
}

function HeroPhoto({ cover, style, MotifIcon }: { cover: TemplateProps["photos"][number] | undefined; style: string; MotifIcon: LucideIcon }) {
  return (
    <div className={cn("relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden bg-[var(--exp-soft)] shadow-[0_35px_100px_-50px_var(--exp-accent)]", style)}>
      {cover ? <Photo src={cover.url} alt={cover.altText} aspect="h-full" className="h-full" priority /> : <HeroPlaceholder MotifIcon={MotifIcon} />}
    </div>
  );
}

function HeroPlaceholder({ MotifIcon }: { MotifIcon: LucideIcon }) {
  return <div className="flex aspect-[4/3] h-full w-full items-center justify-center bg-[var(--exp-soft)]"><MotifIcon className="h-16 w-16 text-[var(--exp-accent)] opacity-40" aria-hidden /></div>;
}

function MomentsSection({ title, style, moments, photos, MotifIcon }: {
  title: string;
  style: MomentsStyle;
  moments: TemplateProps["content"]["moments"];
  photos: TemplateProps["photos"];
  MotifIcon: LucideIcon;
}) {
  return (
    <section className="relative mt-20 md:mt-28">
      <SectionHeading title={title} eyebrow="Capítulos inesquecíveis" />
      <ol className={cn(
        "mt-10",
        style === "cards" && "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
        style === "timeline" && "mx-auto max-w-3xl space-y-8 border-l border-[var(--exp-accent)]/30 pl-7 sm:pl-10",
        style === "diary" && "mx-auto max-w-3xl space-y-5",
        style === "milestones" && "grid gap-5 sm:grid-cols-2",
        style === "tags" && "flex flex-wrap justify-center gap-3",
      )}>
        {moments.map((moment, index) => {
          const photo = photos.find((item) => item.assetId === moment.assetId);
          if (style === "tags") return <li key={moment.id} className="rounded-full border border-[var(--exp-accent)]/20 bg-[var(--exp-surface)] px-5 py-3 font-serif text-lg shadow-sm">{moment.title}</li>;
          return (
            <BlurFade key={moment.id} delay={Math.min(index * 0.05, 0.3)}>
              <li className={cn(
                "relative h-full",
                style === "cards" && "rounded-[1.75rem] bg-[var(--exp-surface)] p-6 shadow-sm",
                style === "timeline" && "pb-3",
                style === "diary" && "border-b border-[var(--exp-accent)]/15 bg-[linear-gradient(transparent_31px,var(--exp-soft)_32px)] px-6 py-7",
                style === "milestones" && "overflow-hidden rounded-[1.75rem] border border-[var(--exp-accent)]/15 bg-[var(--exp-surface)]",
              )}>
                {style === "timeline" && <span className="absolute -left-[34px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--exp-bg)] ring-2 ring-[var(--exp-accent)] sm:-left-[46px]" />}
                {photo && style === "milestones" && <Photo src={photo.url} alt={photo.altText || moment.title} aspect="aspect-[16/10]" />}
                <div className={style === "milestones" ? "p-6" : undefined}>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--exp-accent)]">
                    {style !== "timeline" && <MotifIcon className="h-3.5 w-3.5" aria-hidden />}
                    {moment.date || `Momento ${index + 1}`}
                  </div>
                  <h3 className="mt-2 font-serif text-2xl">{moment.title}</h3>
                  {moment.text && <p className="mt-3 leading-7 text-[var(--exp-muted)]">{moment.text}</p>}
                </div>
              </li>
            </BlurFade>
          );
        })}
      </ol>
    </section>
  );
}

function GallerySection({ title, style, photos }: { title: string; style: GalleryStyle; photos: TemplateProps["photos"] }) {
  return (
    <section className="mt-20 md:mt-28">
      <SectionHeading title={title} eyebrow="Memórias em imagens" />
      <div className={cn(
        "mt-10",
        style === "mosaic" && "grid grid-cols-2 gap-3 sm:grid-cols-4 sm:auto-rows-[180px]",
        style === "polaroid" && "grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-8",
        style === "filmstrip" && "-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0",
        style === "editorial" && "space-y-8 sm:space-y-14",
        style === "grid" && "grid grid-cols-2 gap-3 sm:grid-cols-3",
      )} role="list" aria-label={title}>
        {photos.map((photo, index) => (
          <BlurFade key={photo.assetId} delay={Math.min(index * 0.04, 0.28)} className={cn(
            style === "mosaic" && index % 5 === 0 && "col-span-2 row-span-2",
            style === "editorial" && index % 2 === 1 && "sm:ml-auto sm:w-3/4",
          )}>
            <div role="listitem" className={cn(
              "overflow-hidden",
              style === "polaroid" && "bg-[var(--exp-surface)] p-2 pb-8 shadow-lg odd:rotate-[-2deg] even:rotate-2",
              style === "filmstrip" && "w-[78vw] max-w-sm shrink-0 snap-center rounded-[2rem] bg-[var(--exp-surface)] p-2 shadow-sm",
              (style === "mosaic" || style === "grid") && "rounded-2xl",
              style === "editorial" && "rounded-[2rem]",
            )}>
              <Photo
                src={photo.url}
                alt={photo.altText}
                aspect={style === "mosaic" ? "h-full min-h-52 sm:min-h-0" : style === "editorial" ? (index % 2 === 0 ? "aspect-[16/10]" : "aspect-[4/5]") : style === "filmstrip" ? "aspect-[4/5]" : "aspect-square"}
                className="h-full"
              />
            </div>
          </BlurFade>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <div className="text-center"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--exp-accent)]">{eyebrow}</p><h2 className="mt-3 text-balance font-serif text-3xl sm:text-4xl">{title}</h2></div>;
}

function Flourish({ MotifIcon }: { MotifIcon: LucideIcon }) {
  return <div className="mt-7 flex items-center justify-center gap-3 text-[var(--exp-accent)]" aria-hidden><span className="h-px w-14 bg-current opacity-30" /><MotifIcon className="h-4 w-4" /><span className="h-px w-14 bg-current opacity-30" /></div>;
}

function formatExperienceDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
