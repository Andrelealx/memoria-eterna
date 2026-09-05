// Script único (não faz parte do build): captura o recorte real da
// experiência de um template representante de cada nicho — mesma técnica de
// capture-template-previews.mjs — para usar nos 7 cards de "Modelos para
// cada ocasião" na home, no lugar das fotos de estilo de vida geradas à
// parte. Assim o card mostra o produto de verdade, com as fotos novas que
// acabamos de colocar em public/demo/*. Requer o servidor dev em :3000.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const NICHE_TEMPLATE = {
  romance: "romance-classico",
  amizade: "amigos-para-sempre",
  familia: "nossa-familia",
  pet: "melhor-amigo",
  // "feliz-aniversario" usa um hero só de texto/ícone (preset "poster", sem
  // foto) — "surpresa-de-aniversario" usa hero "cover" (com foto).
  aniversario: "surpresa-de-aniversario",
  bebe: "bem-vindo-bebe",
  casamento: "nosso-sim",
};

const OUT_DIR = path.resolve("public/marketing/niches");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 480, height: 900 } });

  const CROP_HEIGHT = 660;

  for (const [niche, slug] of Object.entries(NICHE_TEMPLATE)) {
    await page.goto(`${BASE_URL}/modelos/${slug}`, { waitUntil: "networkidle" });
    const root = page.locator(".experience-root");
    await root.waitFor({ state: "visible" });
    await page.waitForTimeout(500);
    const box = await root.boundingBox();

    // Alguns templates (ex.: Feliz Aniversário) abrem com um bloco de texto
    // grande antes da foto de capa — recortar sempre a partir do topo da
    // experiência deixaria o card sem nenhuma foto. Se a foto de capa não
    // cabe no recorte padrão, ancora o recorte nela em vez do topo.
    const coverImg = page.locator('img[alt="Imagem de demonstração da capa"]').first();
    let top = box.y;
    if (await coverImg.count()) {
      const imgBox = await coverImg.boundingBox();
      if (imgBox && imgBox.y > box.y + CROP_HEIGHT - 200) {
        top = Math.max(box.y, imgBox.y - 24);
      }
    }

    const shot = await page.screenshot({
      clip: { x: box.x, y: top, width: 480, height: CROP_HEIGHT },
    });
    await sharp(shot).webp({ quality: 84, effort: 6 }).toFile(path.join(OUT_DIR, `${niche}.webp`));
    console.log("ok:", niche, "<-", slug);
  }

  await page.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
