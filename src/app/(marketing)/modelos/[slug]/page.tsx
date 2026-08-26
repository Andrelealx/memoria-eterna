import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_TEMPLATES } from "@/lib/domain/templates";
import { TemplateRenderer } from "@/components/templates";
import type { ProjectContent } from "@/lib/domain/projects";
import type { PublicPhoto } from "@/lib/server/media";
import { buttonVariants } from "@/components/ui/button";

// Demonstração de um template usando conteúdo fictício e placeholders locais.

const DEMO_CONTENT: ProjectContent = {
  schemaVersion: 1,
  niche: "romance",
  creatorName: "Alex",
  recipientName: "Dani",
  title: "Demonstração do modelo",
  relationshipDate: "2022-06-14",
  message:
    "Esta é uma demonstração do modelo. Aqui aparecerá a mensagem principal que você escrever para a pessoa que ama.",
  counterEnabled: true,
  photos: [],
  moments: [
    { id: "m1", date: "14 de junho", title: "O começo", text: "O dia em que tudo começou." },
    { id: "m2", date: "14 de fevereiro", title: "Dia dos Namorados", text: "Um momento inesquecível." },
    { id: "m3", date: "Hoje", title: "Esta surpresa", text: "Um presente feito por você." },
  ],
  music: null,
  finalPhrase: "Para sempre, nós dois.",
  colorScheme: "vinho",
};

const DEMO_PHOTOS: PublicPhoto[] = [
  { assetId: "p1", url: "/placeholders/foto-1.svg", altText: "Foto de demonstração 1", position: 0, isCover: true },
  { assetId: "p2", url: "/placeholders/foto-2.svg", altText: "Foto de demonstração 2", position: 1, isCover: false },
  { assetId: "p3", url: "/placeholders/foto-3.svg", altText: "Foto de demonstração 3", position: 2, isCover: false },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = DEFAULT_TEMPLATES.find((x) => x.slug === slug);
  return { title: t?.name ?? "Modelo", robots: { index: false, follow: false } };
}

export default async function ModeloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = DEFAULT_TEMPLATES.find((x) => x.slug === slug);
  if (!template) notFound();

  return (
    <div>
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <div>
            <h1 className="font-serif text-3xl">{template.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
          </div>
          <Link href={`/criar?template=${template.slug}`} className={buttonVariants({})}>
            Usar este modelo
          </Link>
        </div>
      </div>

      <TemplateRenderer slug={template.slug} content={DEMO_CONTENT} photos={DEMO_PHOTOS} />
    </div>
  );
}
