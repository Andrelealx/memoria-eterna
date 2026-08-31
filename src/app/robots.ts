import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/modelos/", "/ajuda", "/termos", "/privacidade"],
      disallow: ["/admin/", "/painel/", "/api/", "/criar", "/pagamento/", "/presente/", "/t/"],
    },
    sitemap: `${brand.url}/sitemap.xml`,
  };
}
