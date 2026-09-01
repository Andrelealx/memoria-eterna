// Script único (não faz parte do build) para capturar prévias reais dos
// templates renderizados em /modelos/[slug], usadas como imagens de card e
// no mockup do celular da home. Requer o servidor dev rodando em :3000.
import { chromium } from "playwright";
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
    await cardPage.screenshot({
      path: path.join(OUT_DIR, `${slug}.png`),
      clip: { x: box.x, y: box.y, width: 480, height: 660 },
    });
    console.log("card ok:", slug);
  }
  await cardPage.close();

  // Mockup do celular na home: viewport baixo o bastante para a capa (80vh)
  // caber inteira no recorte, incluindo o título "Alex & Dani" e a data —
  // não só o fundo. Aspecto ~206:436 (área útil do PhoneMockup).
  const heroPage = await browser.newPage({ viewport: { width: 360, height: 950 } });
  await heroPage.goto(`${BASE_URL}/modelos/romance-classico`, { waitUntil: "networkidle" });
  const heroRoot = heroPage.locator(".experience-root");
  await heroRoot.waitFor({ state: "visible" });
  await heroPage.waitForTimeout(400);
  const heroBox = await heroRoot.boundingBox();
  await heroPage.screenshot({
    path: path.resolve("public/marketing/hero-preview.png"),
    clip: { x: heroBox.x, y: heroBox.y, width: 360, height: 800 },
  });
  console.log("hero ok");
  await heroPage.close();

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
