import { describe, expect, it } from "vitest";
import { contentWithinLimits, parseProjectContent } from "./projects";

const base = {
  schemaVersion: 1,
  niche: "romance" as const,
  creatorName: "Alex",
  recipientName: "Dani",
  title: "Nossa história",
};

describe("projects content", () => {
  it("valida conteúdo mínimo válido", () => {
    const c = parseProjectContent(base);
    expect(c.photos).toEqual([]);
    expect(c.counterEnabled).toBe(true);
  });

  it("respeita limites de fotos e momentos do plano", () => {
    const content = parseProjectContent({
      ...base,
      photos: [{ assetId: "a1", altText: "", position: 0 }, { assetId: "a2", altText: "", position: 1 }],
    });
    const ok = contentWithinLimits(content, { maxPhotos: 5, maxMoments: 0 });
    expect(ok.ok).toBe(true);

    const over = contentWithinLimits(content, { maxPhotos: 1, maxMoments: 0 });
    expect(over.ok).toBe(false);
    expect(over.errors[0]).toContain("fotos");
  });
});
