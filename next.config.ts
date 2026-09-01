import type { NextConfig } from "next";

function supabaseConnectOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configured) return null;
  try {
    const url = new URL(configured);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

const connectSources = [
  "'self'",
  // URLs PUT assinadas do SDK usam o endpoint de controle oficial.
  "https://vercel.com",
  "https://blob.vercel-storage.com",
  "https://*.blob.vercel-storage.com",
  // Tokenização de cartão (Card Form) fala direto com a API do Mercado Pago
  // a partir do navegador; nenhum dado de cartão passa pelo nosso servidor.
  // Inclui os domínios de campos seguros e antifraude (Mercado Livre) usados
  // internamente pelo SDK.
  "https://api.mercadopago.com",
  "https://events.mercadopago.com",
  "https://secure-fields.mercadopago.com",
  "https://api-static.mercadopago.com",
  "https://www.mercadolibre.com",
  "https://api.mercadolibre.com",
  supabaseConnectOrigin(),
]
  .filter(Boolean)
  .join(" ");

// CSP compatível com os embeds permitidos (Spotify/YouTube), o SDK de
// pagamento (Mercado Pago Card Form) e os scripts inline de hidratação do
// Next.js. `unsafe-inline` é um baseline pragmático; hardening com nonces
// fica como passo adicional de segurança.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://http2.mlstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "frame-src https://open.spotify.com https://www.youtube.com https://www.mercadopago.com https://api.mercadopago.com https://www.mercadolibre.com https://secure-fields.mercadopago.com",
  `connect-src ${connectSources}`,
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Fotos aceitas pela interface têm até 15 MB; o multipart precisa de uma
    // pequena margem além do tamanho do arquivo.
    serverActions: { bodySizeLimit: "16mb" },
  },
  // Permite testar o servidor de desenvolvimento por Cloudflare Quick Tunnels.
  // A opção só afeta os assets e endpoints internos usados pelo `next dev`.
  allowedDevOrigins: ["*.trycloudflare.com"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
