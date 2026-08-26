import { describe, expect, it } from "vitest";
import { timeTogether, timeTogetherLabel } from "./counter";

describe("counter", () => {
  it("calcula tempo juntos", () => {
    const now = new Date("2025-06-15T00:00:00Z");
    const t = timeTogether("2022-06-14", now);
    expect(t?.years).toBe(3);
    expect(t?.days).toBe(1);
  });

  it("retorna null para data futura ou inválida", () => {
    expect(timeTogether("2030-01-01")).toBeNull();
    expect(timeTogether("não é data")).toBeNull();
  });

  it("formata rótulo", () => {
    expect(timeTogetherLabel("2022-06-14", new Date("2025-06-15T00:00:00Z"))).toBe("3 anos, 1 dia");
  });
});
