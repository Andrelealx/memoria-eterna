import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canPackPhysicalOrder,
  canTransition,
  NFC_TAG_TRANSITIONS,
} from "./state-machine";

describe("state-machine", () => {
  it("permite transições válidas do projeto", () => {
    expect(canTransition("project", "DRAFT", "AWAITING_PAYMENT")).toBe(true);
    expect(canTransition("project", "AWAITING_PAYMENT", "DRAFT")).toBe(true);
    expect(canTransition("project", "PROCESSING", "PUBLISHED")).toBe(true);
    expect(canTransition("project", "PUBLISHED", "EXPIRED")).toBe(true);
  });

  it("rejeita transições inválidas", () => {
    expect(canTransition("project", "DRAFT", "PUBLISHED")).toBe(false);
    expect(() => assertTransition("project", "DRAFT", "PUBLISHED")).toThrow();
  });

  it("cobre todos os estados de tag NFC com transições definidas", () => {
    expect(Object.keys(NFC_TAG_TRANSITIONS)).toHaveLength(7);
    expect(NFC_TAG_TRANSITIONS.ACTIVE).toEqual(["DISABLED"]);
  });

  it("só permite empacotar pedido físico com tag testada", () => {
    expect(canPackPhysicalOrder("TESTED")).toBe(true);
    expect(canPackPhysicalOrder("ACTIVE")).toBe(true);
    expect(canPackPhysicalOrder("WRITTEN")).toBe(false);
    expect(canPackPhysicalOrder(null)).toBe(true); // digital, sem NFC
  });
});
