import { defineConfig } from "@playwright/test";

// E2E com Playwright (seção 23). Requer `npx playwright install` (1ª vez).
// O banco de desenvolvimento (docker-compose) e o seed devem estar prontos.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // O E2E precisa ser hermético mesmo quando o diretório está vinculado à
      // Vercel e o .env local aponta para o domínio real.
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      DEV_FAKE_PAYMENT_ENABLED: "true",
      DEV_FAKE_AI_ENABLED: "true",
      VERCEL: "",
      VERCEL_ENV: "",
      VERCEL_OIDC_TOKEN: "",
      BLOB_READ_WRITE_TOKEN: "",
    },
  },
});
