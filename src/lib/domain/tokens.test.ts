import { describe, expect, it } from "vitest";
import { generateNfcToken, generateOrderNumber, hashToken } from "./tokens";

describe("tokens", () => {
  it("gera token NFC com comprimento e alfabeto esperados", () => {
    const t = generateNfcToken(7);
    expect(t).toHaveLength(7);
    expect(t).toMatch(/^[A-HJ-NP-Z2-9]+$/);
  });

  it("gera tokens distintos", () => {
    const a = generateNfcToken();
    const b = generateNfcToken();
    expect(a).not.toBe(b);
  });

  it("hash de token é determinístico e não vaza o original", () => {
    const raw = "secret-token";
    expect(hashToken(raw)).toBe(hashToken(raw));
    expect(hashToken(raw)).not.toContain(raw);
  });

  it("gera número de pedido humano formatado", () => {
    expect(generateOrderNumber(123, new Date("2026-01-01T00:00:00Z"))).toBe("PV-2026-000123");
  });
});
