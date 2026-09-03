import { cn } from "@/lib/utils";

// Prévia real do template: recorte da capa renderizada em /modelos/[slug]
// (gerado por scripts/capture-template-previews.mjs), não um desenho abstrato.
export function TemplateThumbnail({
  slug,
  name,
  compact = false,
}: {
  slug: string;
  name: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden border border-black/10 bg-secondary shadow-sm",
        compact ? "h-36 rounded-2xl" : "aspect-[4/5] rounded-[1.75rem]",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/marketing/templates/${slug}.png`}
        alt={`Prévia do modelo ${name}`}
        className="h-full w-full object-cover object-top"
      />
    </div>
  );
}
