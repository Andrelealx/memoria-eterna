import QRCode from "qrcode";
import { brand } from "@/lib/brand";

// Geração de QR Code (seções 9, 13). Usado para o cartão de contingência.

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 480,
    margin: 2,
    color: { dark: "#4B1625", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
}

/** URL estável de uma tag NFC: /t/[token]. */
export function nfcUrl(token: string): string {
  return `${brand.url}/t/${token}`;
}
