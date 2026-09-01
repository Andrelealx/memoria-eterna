import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    NODE_ENV: "production",
    NEXT_PUBLIC_SUPABASE_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
  }),
}));

import { getStorageAdapter } from "./factory";

const previous = {
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN,
  BLOB_STORE_ID: process.env.BLOB_STORE_ID,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
};

afterEach(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("seleção do storage", () => {
  it("prioriza Vercel Blob no runtime Vercel mesmo sem BLOB_STORE_ID explícito", () => {
    process.env.VERCEL = "1";
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.BLOB_STORE_ID;
    delete process.env.BLOB_READ_WRITE_TOKEN;

    expect(getStorageAdapter().name).toBe("vercel-blob");
  });

  it("também reconhece preview pelo VERCEL_ENV", () => {
    delete process.env.VERCEL;
    process.env.VERCEL_ENV = "preview";
    delete process.env.BLOB_STORE_ID;

    expect(getStorageAdapter().name).toBe("vercel-blob");
  });

  it("não confunde o OIDC gravado pelo vercel link com o runtime da Vercel", () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    process.env.VERCEL_OIDC_TOKEN = "token-local-do-link";

    expect(() => getStorageAdapter()).toThrow(
      "Configure Vercel Blob privado ou Supabase para mídia em produção",
    );
  });
});
