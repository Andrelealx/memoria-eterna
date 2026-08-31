import { describe, expect, it } from "vitest";
import { DEFAULT_TEMPLATES } from "@/lib/domain/templates";
import { EXPERIENCE_PRESETS } from "./experience-presets";

describe("experiências dos templates", () => {
  it("possui uma experiência narrativa para cada template do catálogo", () => {
    const missing = DEFAULT_TEMPLATES
      .map((template) => template.slug)
      .filter((slug) => !EXPERIENCE_PRESETS[slug]);
    expect(missing).toEqual([]);
  });

  it("mantém variedade real de composições", () => {
    const presets = Object.values(EXPERIENCE_PRESETS);
    expect(new Set(presets.map((preset) => preset.hero)).size).toBe(5);
    expect(new Set(presets.map((preset) => preset.gallery)).size).toBe(5);
    expect(new Set(presets.map((preset) => preset.moments)).size).toBe(5);
  });
});
