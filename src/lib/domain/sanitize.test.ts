import { describe, expect, it } from "vitest";
import { isPlainText, sanitizeText, stripHtml } from "./sanitize";

describe("sanitize", () => {
  it("remove tags HTML", () => {
    expect(stripHtml("<script>alert(1)</script>Oi")).toContain("Oi");
    expect(stripHtml("<b>oi</b>")).toBe(" oi ");
  });

  it("limpa caracteres de controle e limita tamanho", () => {
    expect(sanitizeText("  olá\u0000 mundo  ", 5)).toBe("olá m");
  });

  it("detecta texto não puro", () => {
    expect(isPlainText("texto limpo")).toBe(true);
    expect(isPlainText("<img src=x>")).toBe(false);
  });
});
