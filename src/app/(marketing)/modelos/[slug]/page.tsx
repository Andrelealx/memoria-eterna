import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_TEMPLATES } from "@/lib/domain/templates";
import type { Niche } from "@/lib/domain/enums";
import { TemplateRenderer } from "@/components/templates";
import type { ProjectContent } from "@/lib/domain/projects";
import type { PublicPhoto } from "@/lib/server/media";
import { buttonVariants } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";

// Demonstração de um template usando conteúdo fictício e placeholders locais.
// O conteúdo de demonstração é ajustado ao nicho para a prévia parecer real.

type Demo = Partial<ProjectContent> & { moments: ProjectContent["moments"] };

const DEMOS: Record<Niche, Demo> = {
  romance: {
    creatorName: "Alex",
    recipientName: "Dani",
    relationshipDate: "2022-06-14",
    counterEnabled: true,
    message: "Esta é uma demonstração do modelo. Aqui aparecerá a mensagem principal que você escrever para a pessoa que ama.",
    moments: [
      { id: "m1", date: "14 de junho", title: "O começo", text: "O dia em que tudo começou." },
      { id: "m2", date: "14 de fevereiro", title: "Dia dos Namorados", text: "Um momento inesquecível." },
      { id: "m3", date: "Hoje", title: "Esta surpresa", text: "Um presente feito por você." },
    ],
    finalPhrase: "Para sempre, nós dois.",
  },
  amizade: {
    creatorName: "Ana",
    recipientName: "Bia",
    title: "Amigas para sempre",
    message: "Esta é uma demonstração do modelo. Aqui aparecerá a mensagem que você escrever para o seu melhor amigo.",
    moments: [
      { id: "m1", date: "2018", title: "Como nos conhecemos", text: "O dia em que tudo começou." },
      { id: "m2", date: "2021", title: "A viagem", text: "Uma aventura inesquecível." },
    ],
    finalPhrase: "Amigos para sempre.",
  },
  familia: {
    creatorName: "Nossa família",
    recipientName: "Todos nós",
    title: "Nossa família",
    relationshipDate: "2010-01-01",
    message: "Esta é uma demonstração do modelo. Aqui aparecerá a mensagem para a sua família.",
    moments: [
      { id: "m1", date: "2010", title: "O começo", text: "Tudo começou aqui." },
      { id: "m2", date: "Hoje", title: "Cada vez mais unidos", text: "Uma família, uma história." },
    ],
    finalPhrase: "Juntos, sempre.",
  },
  pet: {
    creatorName: "Toda a família",
    recipientName: "Rex",
    title: "Meu melhor amigo",
    message: "Esta é uma demonstração do modelo. Aqui aparecerá a mensagem para o seu pet.",
    moments: [
      { id: "m1", date: "2020", title: "Chegou em casa", text: "O dia em que tudo mudou." },
      { id: "m2", date: "Hoje", title: "Melhor amigo", text: "Companheiro de todas as horas." },
    ],
    finalPhrase: "Meu melhor amigo.",
  },
  aniversario: {
    creatorName: "Com carinho",
    recipientName: "Maria",
    title: "Feliz aniversário",
    message: "Esta é uma demonstração do modelo. Aqui aparecerá a mensagem de parabéns.",
    moments: [
      { id: "m1", date: "Ano passado", title: "Aquela festa", text: "Um dia inesquecível." },
      { id: "m2", date: "Hoje", title: "Seu dia", text: "Parabéns!" },
    ],
    finalPhrase: "Feliz aniversário!",
  },
  bebe: {
    creatorName: "Papai e mamãe",
    recipientName: "Alice",
    title: "Bem-vinda, Alice",
    relationshipDate: "2025-05-10",
    message: "Esta é uma demonstração do modelo. Aqui aparecerá a mensagem de boas-vindas.",
    moments: [
      { id: "m1", date: "10 de maio", title: "A chegada", text: "O dia mais feliz." },
      { id: "m2", date: "Hoje", title: "Primeiros sorrisos", text: "Cada momento é um presente." },
    ],
    finalPhrase: "Bem-vinda ao mundo.",
  },
  casamento: {
    creatorName: "Alice",
    recipientName: "Bruno",
    title: "Nosso sim",
    relationshipDate: "2024-09-21",
    message: "Esta é uma demonstração do modelo. Aqui aparecerá a mensagem para o grande dia.",
    moments: [
      { id: "m1", date: "21 de setembro", title: "O sim", text: "O começo de tudo." },
      { id: "m2", date: "Hoje", title: "Bodas", text: "Celebrando o nosso amor." },
    ],
    finalPhrase: "Para sempre, nós dois.",
  },
};

function demoContentFor(niche: Niche): ProjectContent {
  const demo = DEMOS[niche];
  return {
    schemaVersion: 1,
    niche,
    creatorName: demo.creatorName ?? "Você",
    recipientName: demo.recipientName ?? "Quem recebe",
    title: demo.title ?? "Demonstração do modelo",
    relationshipDate: demo.relationshipDate ?? "",
    message: demo.message ?? "",
    counterEnabled: demo.counterEnabled ?? false,
    photos: [],
    moments: demo.moments,
    music: null,
    finalPhrase: demo.finalPhrase ?? "",
    colorScheme: "vinho",
  };
}

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
        <BlurFade>
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
            <div>
              <h1 className="font-serif text-3xl">{template.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
            </div>
            <Link href={`/criar?template=${template.slug}`} className={buttonVariants({ variant: "shiny" })}>
              Usar este modelo
            </Link>
          </div>
        </BlurFade>
      </div>

      <TemplateRenderer
        slug={template.slug}
        content={demoContentFor(template.niche)}
        photos={DEMO_PHOTOS}
      />
    </div>
  );
}
