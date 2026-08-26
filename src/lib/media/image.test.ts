import { describe, expect, it } from "vitest";
import { detectImageMime } from "./image";

describe("detectImageMime", () => {
  it("detecta JPEG", () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    expect(detectImageMime(buf)).toBe("image/jpeg");
  });

  it("detecta PNG", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    expect(detectImageMime(buf)).toBe("image/png");
  });

  it("detecta WebP", () => {
    const buf = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP")]);
    expect(detectImageMime(buf)).toBe("image/webp");
  });

  it("rejeita dados não-imagem", () => {
    expect(detectImageMime(Buffer.from("<svg>"))).toBeNull();
    expect(detectImageMime(Buffer.from("plain text not an image!"))).toBeNull();
  });
});
