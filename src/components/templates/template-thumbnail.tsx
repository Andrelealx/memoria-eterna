import Image from "next/image";
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
      <Image
        src={`/marketing/templates/${slug}.png`}
        alt={`Prévia do modelo ${name}`}
        width={480}
        height={660}
        className="h-full w-full object-cover object-top"
        sizes={compact ? "160px" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
      />
    </div>
  );
}
