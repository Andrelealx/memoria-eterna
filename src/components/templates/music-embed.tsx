import type { ProjectContent } from "@/lib/domain/projects";

// Bloco de música (seções 10.5, 11). Somente embed permitido (Spotify/YouTube),
// sem autoplay. O `embedUrl` já foi validado pela whitelist em domain/music.ts.

export function MusicEmbed({ music }: { music: NonNullable<ProjectContent["music"]> }) {
  return (
    <figure className="w-full">
      <iframe
        src={music.embedUrl}
        title="Música"
        loading="lazy"
        allow="encrypted-media"
        className="h-[152px] w-full rounded-2xl border border-border bg-white"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </figure>
  );
}
