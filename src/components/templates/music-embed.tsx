"use client";

import { useRef, useState } from "react";
import type { ProjectContent } from "@/lib/domain/projects";

// Bloco de música (seções 10.5, 11). Somente embed permitido (Spotify/YouTube).
// O `embedUrl` já foi validado pela whitelist em domain/music.ts.
//
// Navegadores bloqueiam áudio automático com som no primeiro acesso — não tem
// como contornar isso de verdade. O que dá para fazer: no YouTube, abrir já
// tocando mudo (autoplay mudo é sempre permitido) e oferecer um botão de
// "ativar som" que ativa o áudio sem reiniciar o vídeo, via postMessage da
// própria API do player do YouTube.

export function MusicEmbed({ music }: { music: NonNullable<ProjectContent["music"]> }) {
  if (music.provider === "youtube") {
    return <YouTubeMusicEmbed music={music} />;
  }
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

function YouTubeMusicEmbed({ music }: { music: NonNullable<ProjectContent["music"]> }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);

  const separator = music.embedUrl.includes("?") ? "&" : "?";
  const src = `${music.embedUrl}${separator}autoplay=1&mute=1&enablejsapi=1&playsinline=1&rel=0`;

  function ativarSom() {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
    win.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [100] }), "*");
    setMuted(false);
  }

  return (
    <figure className="relative w-full">
      <iframe
        ref={iframeRef}
        src={src}
        title="Música"
        loading="lazy"
        allow="autoplay; encrypted-media"
        className="h-[152px] w-full rounded-2xl border border-border bg-white"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {muted && (
        <button
          type="button"
          onClick={ativarSom}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur transition-colors hover:bg-black"
        >
          🔊 Ativar som
        </button>
      )}
    </figure>
  );
}
