import { describe, expect, it } from "vitest";
import { parseMusicUrl } from "./music";

describe("music parser", () => {
  it("aceita Spotify track", () => {
    const r = parseMusicUrl("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC");
    expect(r?.provider).toBe("spotify");
    expect(r?.kind).toBe("track");
    expect(r?.embedUrl).toContain("/embed/track/");
  });

  it("aceita YouTube watch e youtu.be", () => {
    expect(parseMusicUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.id).toBe("dQw4w9WgXcQ");
    expect(parseMusicUrl("https://youtu.be/dQw4w9WgXcQ")?.provider).toBe("youtube");
  });

  it("rejeita domínio fora da whitelist", () => {
    expect(parseMusicUrl("https://evil.com/track/x")).toBeNull();
  });

  it("rejeita protocolo não https", () => {
    expect(parseMusicUrl("http://open.spotify.com/track/x")).toBeNull();
  });

  it("rejeita URL inválida", () => {
    expect(parseMusicUrl("não é uma url")).toBeNull();
  });
});
