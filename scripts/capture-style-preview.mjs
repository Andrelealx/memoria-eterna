// Script único (não faz parte do build) para capturar prévias reais de estilo
// de template para a seção "Escolha o estilo" da home — mesma técnica do
// capture-template-previews.mjs (recorte real de .experience-root), só que
// para um conjunto curado e diverso de templates. Requer o servidor dev
// rodando em :3000.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const TEMPLATES = [
  { slug: "romance-classico", label: "Clássico" },
  { slug: "amor-minimalista", label: "Minimalista" },
  { slug: "nossa-linha-do-tempo", label: "Linha do tempo" },
  { slug: "melhor-amigo", label: "Pet" },
];

const OUT_DIR = path.resolve("public/marketing/style-preview");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 360, height: 950 } });

  for (const { slug } of TEMPLATES) {
    await page.goto(`${BASE_URL}/modelos/${slug}`, { waitUntil: "networkidle" });
    const root = page.locator(".experience-root");
    await root.waitFor({ state: "visible" });
    await page.waitForTimeout(400);
    const box = await root.boundingBox();
    await page.screenshot({
      path: path.join(OUT_DIR, `${slug}.png`),
      clip: { x: box.x, y: box.y, width: 360, height: 800 },
    });
    console.log("ok:", slug);
  }

  await page.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
