import { cn } from "@/lib/utils";

// Imagem com recorte responsivo (object-fit: cover), dimensões reservadas para
// evitar layout shift e lazy-loading. Não estica/deforma a foto (seção 7).
export function Photo({
  src,
  alt,
  className,
  aspect = "aspect-[3/4]",
}: {
  src: string;
  alt: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div className={cn("overflow-hidden", aspect, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
        style={{ objectPosition: "center" }}
      />
    </div>
  );
}
