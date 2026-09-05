// Script único (não faz parte do build) para capturar prévias reais dos
// templates renderizados em /modelos/[slug], usadas como imagens de card do
// catálogo. Requer o servidor dev rodando em :3000. O mockup do celular da
// home usa capture-hero-preview.mjs, que captura um presente real publicado
// em vez de um template de demonstração.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const SLUGS = [
  "romance-classico",
  "nossa-linha-do-tempo",
  "amor-minimalista",
  "amigos-para-sempre",
  "nossa-familia",
  "melhor-amigo",
  "feliz-aniversario",
  "bem-vindo-bebe",
  "nosso-sim",
  "mural-de-memorias",
  "cantinho-da-familia",
  "aventuras-do-pet",
  "nossa-trajetoria",
  "album-do-bebe",
  "galeria-de-casamento",
  "momentos-da-amizade",
  "album-da-familia",
  "diario-do-pet",
  "surpresa-de-aniversario",
  "mes-a-mes",
  "nossos-votos",
];

const OUT_DIR = path.resolve("public/marketing/templates");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();

  // Cards do catálogo (/modelos): recorte 4:5 do topo da experiência (sem o
  // cabeçalho/barra de marketing da página de demonstração).
  const cardPage = await browser.newPage({ viewport: { width: 480, height: 900 } });
  for (const slug of SLUGS) {
    await cardPage.goto(`${BASE_URL}/modelos/${slug}`, { waitUntil: "networkidle" });
    const root = cardPage.locator(".experience-root");
    await root.waitFor({ state: "visible" });
    await cardPage.waitForTimeout(400); // animações de entrada (blur-fade)
    const box = await root.boundingBox();
    const shot = await cardPage.screenshot({
      clip: { x: box.x, y: box.y, width: 480, height: 660 },
    });
    await sharp(shot).webp({ quality: 82, effort: 6 }).toFile(path.join(OUT_DIR, `${slug}.webp`));
    console.log("card ok:", slug);
  }
  await cardPage.close();

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
