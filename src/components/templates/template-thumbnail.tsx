import { Heart, PawPrint, Sparkles, Star, Users } from "lucide-react";
import type { Niche } from "@/lib/domain/enums";
import { cn } from "@/lib/utils";
import { EXPERIENCE_PRESETS } from "./experience-presets";

const STYLES: Record<Niche, { background: string; accent: string }> = {
  romance: { background: "from-rose-100 via-white to-rose-50", accent: "text-rose-700" },
  amizade: { background: "from-amber-100 via-white to-orange-50", accent: "text-amber-700" },
  familia: { background: "from-orange-100 via-white to-stone-50", accent: "text-orange-800" },
  pet: { background: "from-emerald-100 via-white to-sky-50", accent: "text-emerald-700" },
  aniversario: { background: "from-violet-100 via-white to-pink-50", accent: "text-violet-700" },
  bebe: { background: "from-sky-100 via-white to-rose-50", accent: "text-sky-700" },
  casamento: { background: "from-stone-100 via-white to-amber-50", accent: "text-stone-700" },
};

const ICONS: Record<Niche, typeof Heart> = {
  romance: Heart,
  amizade: Star,
  familia: Users,
  pet: PawPrint,
  aniversario: Sparkles,
  bebe: Heart,
  casamento: Heart,
};

export function TemplateThumbnail({
  niche,
  name,
  slug,
  compact = false,
}: {
  niche: Niche;
  name: string;
  slug: string;
  compact?: boolean;
}) {
  const Icon = ICONS[niche];
  const style = STYLES[niche];
  const hero = EXPERIENCE_PRESETS[slug]?.hero ?? "poster";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative w-full overflow-hidden border border-black/10 bg-gradient-to-b shadow-sm",
        style.background,
        compact ? "h-36 rounded-2xl" : "aspect-[4/5] rounded-[1.75rem]",
      )}
    >
      {hero === "cover" && <div className="absolute inset-3 rounded-[1.25rem] bg-gradient-to-t from-black/55 via-white/5 to-white/20"><Icon className="absolute bottom-5 left-1/2 h-7 w-7 -translate-x-1/2 text-white" /></div>}
      {hero === "editorial" && <><div className="absolute bottom-4 left-4 top-4 w-[42%] rounded-t-full bg-white/75 shadow-sm" /><div className="absolute right-5 top-[32%] h-2 w-[35%] rounded-full bg-black/15" /><div className="absolute right-8 top-[42%] h-2 w-[29%] rounded-full bg-black/10" /></>}
      {hero === "album" && <div className="absolute inset-x-7 inset-y-5 rotate-[-3deg] bg-white p-2 pb-8 shadow-md"><div className="h-full bg-black/10" /><Icon className={cn("absolute bottom-2 left-1/2 h-4 w-4 -translate-x-1/2", style.accent)} /></div>}
      {hero === "split" && <><div className="absolute bottom-4 left-4 top-4 w-[48%] rounded-[50%_50%_35%_65%] bg-white/70" /><Icon className={cn("absolute right-[18%] top-[35%] h-7 w-7", style.accent)} /></>}
      {hero === "poster" && <><div className="absolute left-1/2 top-[18%] h-16 w-16 -translate-x-1/2 rounded-full border-4 border-white/80 bg-white/60 shadow-sm" /><Icon className={cn("absolute left-1/2 top-[24%] h-6 w-6 -translate-x-1/2", style.accent)} /></>}
      <div className={cn("absolute inset-x-5 text-center", hero === "cover" ? "bottom-8 text-white" : hero === "album" ? "hidden" : hero === "editorial" || hero === "split" ? "bottom-7" : "top-[55%]")}>
        <p className={cn("font-serif font-semibold", compact ? "text-base" : "text-xl", hero !== "cover" && style.accent)}>
          {name.split(" ").slice(0, 2).map((word) => word[0]).join("")}
        </p>
        <div className={cn("mx-auto mt-2 h-1.5 w-1/2 rounded-full", hero === "cover" ? "bg-white/50" : "bg-black/10")} />
      </div>
      <div className="absolute -bottom-5 -left-4 h-20 w-20 rounded-full bg-white/45" />
      <div className="absolute -bottom-8 -right-3 h-24 w-24 rounded-full bg-white/35" />
    </div>
  );
}
