// Script único (não faz parte do build): captura o mockup do celular da
// home a partir de um presente REAL publicado (não um template de
// demonstração) — pedido explícito do dono do site, dono também da conta em
// /presente/manuelly-andre, já usada como "Ver um exemplo real" no hero.
// Por padrão aponta para produção, onde o presente está publicado; passe
// BASE_URL para capturar de outro ambiente. Aspecto 360:800, igual ao que
// capture-template-previews.mjs gerava antes para o mesmo mockup.
import { chromium } from "playwright";
import sharp from "sharp";

const BASE_URL = process.env.BASE_URL ?? "https://www.memoriaeternaprime.com.br";
const SLUG = process.env.HERO_SLUG ?? "manuelly-andre";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 950 } });
await page.goto(`${BASE_URL}/presente/${SLUG}`, { waitUntil: "networkidle" });
const root = page.locator(".experience-root");
await root.waitFor({ state: "visible" });
await page.waitForTimeout(800);
const box = await root.boundingBox();
const shot = await page.screenshot({
  clip: { x: box.x, y: box.y, width: 360, height: 800 },
});
await sharp(shot).webp({ quality: 82, effort: 6 }).toFile("public/marketing/hero-preview.webp");
console.log("ok:", SLUG);
await browser.close();
