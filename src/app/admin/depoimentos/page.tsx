import { prisma } from "@/lib/db";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { TestimonialCard } from "@/components/admin/testimonial-card";

export const metadata = { title: "Depoimentos" };

export default async function AdminDepoimentosPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Depoimentos</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Aparecem na home, na ordem abaixo. Só depoimentos ativos ficam visíveis para os clientes.
      </p>

      <div className="mt-6">
        <TestimonialForm />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <TestimonialCard
            key={t.id}
            t={{
              id: t.id,
              authorName: t.authorName,
              occasion: t.occasion,
              quote: t.quote,
              mediaType: t.mediaType,
              mediaUrl: t.mediaUrl,
              active: t.active,
            }}
          />
        ))}
      </div>
      {testimonials.length === 0 && (
        <p className="mt-6 text-muted-foreground">Nenhum depoimento ainda.</p>
      )}
    </div>
  );
}
