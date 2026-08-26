import sharp from "sharp";

// Processamento de imagem (seções 10.3, 18). Converte para WebP (removendo EXIF),
// aplica orientação e gera variantes responsivas (full/preview/thumbnail).
// Nenhum SVG de usuário é aceito (apenas raster). HEIC/HEIF é aceito se o sharp
// conseguir decodificar (conversão segura).

export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** Detecta o MIME real a partir dos magic bytes (não confia no header do cliente). */
export function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: "RIFF" + "WEBP"
  if (buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }

  // HEIC/HEIF: "ftyp" box com brand heic/heix/hevc/mif1
  if (buffer.slice(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.slice(8, 12).toString("ascii").toLowerCase();
    if (["heic", "heix", "hevc", "mif1", "msf1", "heif"].includes(brand)) return "image/heic";
  }

  return null;
}

export interface ImageVariant {
  key: string;
  width: number;
  height: number;
  sizeBytes: number;
  buffer: Buffer;
}

export interface ProcessedImage {
  width: number;
  height: number;
  full: ImageVariant;
  preview: ImageVariant;
  thumbnail: ImageVariant;
}

const FULL_MAX = 2048;
const PREVIEW_MAX = 1200;
const THUMB_MAX = 400;

async function render(input: Buffer, maxWidth: number, key: string): Promise<ImageVariant> {
  const { data, info } = await sharp(input)
    .rotate() // aplica orientação EXIF (e remove a orientação)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  return {
    key,
    width: info.width,
    height: info.height,
    sizeBytes: data.length,
    buffer: data,
  };
}

/**
 * Processa uma imagem de entrada e gera três variantes WebP (sem EXIF).
 * `baseKey` é um prefixo aleatório gerado pelo chamador (ex.: "ab12cd/foto").
 */
export async function processImage(input: Buffer, baseKey: string): Promise<ProcessedImage> {
  const metadata = await sharp(input).metadata();
  const [full, preview, thumbnail] = await Promise.all([
    render(input, FULL_MAX, `${baseKey}/full.webp`),
    render(input, PREVIEW_MAX, `${baseKey}/preview.webp`),
    render(input, THUMB_MAX, `${baseKey}/thumb.webp`),
  ]);

  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    full,
    preview,
    thumbnail,
  };
}
