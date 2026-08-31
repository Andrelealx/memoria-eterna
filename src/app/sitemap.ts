import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { listActiveTemplates } from "@/lib/server/templates";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const templates = await listActiveTemplates();
  const fixed = ["", "/modelos", "/ajuda", "/termos", "/privacidade"];
  return [
    ...fixed.map((path) => ({ url: `${brand.url}${path}`, changeFrequency: "monthly" as const })),
    ...templates.map((template) => ({
      url: `${brand.url}/modelos/${template.slug}`,
      changeFrequency: "monthly" as const,
    })),
  ];
}
