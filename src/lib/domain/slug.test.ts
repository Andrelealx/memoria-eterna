import { describe, expect, it } from "vitest";
import { isSlugAvailable, isValidSlug, slugify, suggestUniqueSlug } from "./slug";

describe("slug", () => {
  it("normaliza acentos e caracteres especiais", () => {
    expect(slugify("Nossa História")).toBe("nossa-historia");
    expect(slugify("  Amor  Eterno!  ")).toBe("amor-eterno");
  });

  it("valida formato", () => {
    expect(isValidSlug("nossa-historia")).toBe(true);
    expect(isValidSlug("Nossa Historia")).toBe(false);
    expect(isValidSlug("nossa--historia")).toBe(false);
  });

  it("rejeita slugs reservados", () => {
    expect(isSlugAvailable("admin", new Set())).toBe(false);
    expect(isSlugAvailable("presente", new Set())).toBe(false);
    expect(isSlugAvailable("alex-e-dani", new Set())).toBe(true);
  });

  it("sugere slug único evitando colisões", () => {
    const existing = new Set(["alex-e-dani"]);
    expect(suggestUniqueSlug("Alex e Dani", existing)).toBe("alex-e-dani-2");
  });
});
