import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedProject } from "@/lib/server/projects";
import { TemplateRenderer } from "@/components/templates";
import { ShareButton } from "@/components/templates/share-button";
import { brand } from "@/lib/brand";

// Página pública publicada (seção 11). SEO noindex por padrão para proteger a
// privacidade. Não usa o layout de marketing (header/footer institucional).

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedProject(slug);
  return {
    title: data ? `${data.content.creatorName} & ${data.content.recipientName}` : brand.name,
    robots: { index: false, follow: false },
  };
}

export default async function PublicGiftPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublishedProject(slug);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-creme">
      <TemplateRenderer slug={data.templateSlug} content={data.content} photos={data.photos} />

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-5 py-8 sm:flex-row sm:justify-between">
          <ShareButton title={data.content.title} />
          <Link
            href={`/denunciar/${data.id}`}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Denunciar conteúdo
          </Link>
        </div>
        <p className="pb-6 text-center text-xs text-muted-foreground">
          Feito com <span className="text-primary">♥</span> {brand.name}
        </p>
      </footer>
    </div>
  );
}
