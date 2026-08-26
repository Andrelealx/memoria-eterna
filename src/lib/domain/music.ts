// Parser de links de música (seções 10.5, 18, 23). Whitelist estrita:
// apenas Spotify e YouTube. Nenhum outro domínio é aceito.

export type MusicProvider = "spotify" | "youtube";

export interface MusicReference {
  provider: MusicProvider;
  kind: string; // "track" | "album" | "playlist" | "video"
  id: string;
  embedUrl: string;
}

const SPOTIFY_HOSTS = new Set(["open.spotify.com", "open.spotify.com"]);
const YOUTUBE_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "youtu.be",
  "music.youtube.com",
]);

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

function parseSpotify(url: URL): MusicReference | null {
  if (!SPOTIFY_HOSTS.has(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  // Ex.: /track/<id>, /embed/track/<id>, /album/<id>, /playlist/<id>
  if (parts[0] === "embed") parts.shift();
  const kind = parts[0];
  const id = parts[1];
  if (!["track", "album", "playlist"].includes(kind) || !id) return null;
  const safe = safeId(id);
  return { provider: "spotify", kind, id: safe, embedUrl: `https://open.spotify.com/embed/${kind}/${safe}` };
}

function parseYouTube(url: URL): MusicReference | null {
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;
  let id: string | null = null;

  if (url.hostname === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) {
    id = url.pathname.split("/")[2] ?? null;
  } else {
    id = url.searchParams.get("v");
  }

  if (!id) return null;
  const safe = safeId(id);
  return { provider: "youtube", kind: "video", id: safe, embedUrl: `https://www.youtube.com/embed/${safe}` };
}

/** Extrai uma referência de música segura a partir de uma URL. Retorna null se inválida. */
export function parseMusicUrl(raw: string): MusicReference | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  if (SPOTIFY_HOSTS.has(url.hostname)) return parseSpotify(url);
  if (YOUTUBE_HOSTS.has(url.hostname)) return parseYouTube(url);
  return null;
}
