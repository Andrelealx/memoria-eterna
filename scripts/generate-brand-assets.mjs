// Script único (não faz parte do build) para gerar favicon, ícones de app e o
// card de compartilhamento (Open Graph / Twitter) a partir do símbolo oficial
// da identidade visual. Rode com `node scripts/generate-brand-assets.mjs`.
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const palette = {
  creme: "#FFF9F6",
  rosaClaro: "#F8E8EC",
  vinho: "#722B45",
  vinhoEscuro: "#4B1625",
  rosaQueimado: "#C86682",
  dourado: "#C5A167",
  grafite: "#292326",
};

// Símbolo oficial (04_Simbolo_Icone), recortado num viewBox quadrado
// centralizado no coração para servir de ícone.
const SYMBOL_PATHS = `
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M400 320 C335 260 250 190 245 112 C240 40 320 12 382 55 C394 64 400 75 400 75 C400 75 406 64 418 55 C480 12 560 40 555 112 C550 190 465 260 400 320" stroke="${palette.vinho}" stroke-width="18"/>
    <path d="M400 318 C328 263 260 218 190 220 C116 222 77 268 90 315 C108 380 210 387 286 354 C334 333 370 304 400 282 C430 304 466 333 514 354 C590 387 692 380 710 315 C723 268 684 222 610 220 C540 218 472 263 400 318 Z" stroke="${palette.vinho}" stroke-width="18"/>
    <circle cx="570" cy="150" r="7" fill="${palette.dourado}" stroke="none"/>
    <path d="M592 160 C615 165 628 178 631 200" stroke="${palette.rosaQueimado}" stroke-width="13"/>
    <path d="M598 126 C642 136 668 164 670 205" stroke="${palette.rosaQueimado}" stroke-width="13"/>
    <path d="M606 91 C669 105 708 146 711 204" stroke="${palette.rosaQueimado}" stroke-width="13"/>
  </g>
`;

function symbolSvg({ background } = {}) {
  return `<svg viewBox="77 -123 646 646" xmlns="http://www.w3.org/2000/svg">
    ${background ? `<rect x="77" y="-123" width="646" height="646" fill="${background}"/>` : ""}
    ${SYMBOL_PATHS}
  </svg>`;
}

async function pngBuffer(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

// Monta um .ico válido (formato Vista+: entradas PNG embutidas), sem depender
// de libs externas de conversão.
function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  const imageData = [];
  let offset = headerSize;
  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    imageData.push(buffer);
    offset += buffer.length;
  }
  return Buffer.concat([header, ...dirEntries, ...imageData]);
}

async function main() {
  const appDir = path.resolve("src/app");
  const publicDir = path.resolve("public/brand");
  await mkdir(publicDir, { recursive: true });

  // favicon.ico (16/32/48, fundo transparente — funciona em aba clara/escura)
  const icoSizes = [16, 32, 48];
  const icoPngs = await Promise.all(
    icoSizes.map(async (size) => ({ size, buffer: await pngBuffer(symbolSvg(), size) })),
  );
  await writeFile(path.join(appDir, "favicon.ico"), buildIco(icoPngs));
  console.log("favicon.ico ok");

  // icon.png (usado pelo Next para <link rel="icon">, PWA etc.)
  const icon512 = await pngBuffer(symbolSvg(), 512);
  await writeFile(path.join(appDir, "icon.png"), icon512);
  console.log("icon.png ok");

  // apple-icon.png — iOS não aceita transparência (viraria preto), fundo sólido creme.
  const appleIcon = await pngBuffer(symbolSvg({ background: palette.creme }), 180);
  await writeFile(path.join(appDir, "apple-icon.png"), appleIcon);
  console.log("apple-icon.png ok");

  // Card de compartilhamento (Open Graph / Twitter): 1200x630.
  const ogSvg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${palette.creme}"/>
        <stop offset="1" stop-color="${palette.rosaClaro}"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <g transform="translate(600 208) scale(0.34)">
      <g transform="translate(-400 -215)">
        ${SYMBOL_PATHS}
      </g>
    </g>
    <text x="600" y="420" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="76" fill="${palette.vinho}">Mem&#243;ria Eterna</text>
    <text x="600" y="472" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="${palette.grafite}">Suas mem&#243;rias em um presente que pode ser tocado</text>
    <g transform="translate(600 528)">
      <circle r="3.5" cx="-170" fill="${palette.rosaQueimado}"/>
      <circle r="3.5" cx="0" fill="${palette.dourado}"/>
      <circle r="3.5" cx="170" fill="${palette.rosaQueimado}"/>
    </g>
  </svg>`;
  const ogBuffer = await sharp(Buffer.from(ogSvg)).png().toBuffer();
  await writeFile(path.join(appDir, "opengraph-image.png"), ogBuffer);
  await writeFile(path.join(appDir, "twitter-image.png"), ogBuffer);
  console.log("opengraph-image.png / twitter-image.png ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
