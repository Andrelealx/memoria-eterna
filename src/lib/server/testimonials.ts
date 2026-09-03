import { prisma } from "@/lib/db";

export interface TestimonialView {
  id: string;
  authorName: string;
  occasion: string | null;
  quote: string | null;
  mediaType: "NONE" | "PHOTO" | "VIDEO";
  mediaUrl: string | null;
}

/** Depoimentos ativos, na ordem definida no admin. Única fonte exibida na home. */
export async function listActiveTestimonials(): Promise<TestimonialView[]> {
  const rows = await prisma.testimonial.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return rows.map((t) => ({
    id: t.id,
    authorName: t.authorName,
    occasion: t.occasion,
    quote: t.quote,
    mediaType: t.mediaType,
    mediaUrl: t.mediaUrl,
  }));
}
