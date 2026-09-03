import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveTemplate } from "@/lib/server/templates";
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

// Música de demonstração por nicho — embed oficial do YouTube (mesmo
// mecanismo do produto real: só embed, sem autoplay). Escolhida pelo clima
// de cada ocasião, não pelo conteúdo fictício em si.
const DEMO_MUSIC: Record<Niche, { id: string; label: string }> = {
  romance: { id: "2Vv-BfVoq4g", label: "Perfect — Ed Sheeran" },
  amizade: { id: "6k8cpUkKK4c", label: "Count on Me — Bruno Mars" },
  familia: { id: "rBrd_3VMC3c", label: "What a Wonderful World — Louis Armstrong" },
  pet: { id: "ZbZSe6N_BXs", label: "Happy — Pharrell Williams" },
  aniversario: { id: "3GwjfUFyY6M", label: "Celebration — Kool & The Gang" },
  bebe: { id: "av5AAjdJzXc", label: "You Are My Sunshine (lullaby)" },
  casamento: { id: "rtOvBOTyX00", label: "A Thousand Years — Christina Perri" },
};

function demoContentFor(niche: Niche, colorScheme: string): ProjectContent {
  const demo = DEMOS[niche];
  const track = DEMO_MUSIC[niche];
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
    music: {
      provider: "youtube",
      kind: "video",
      id: track.id,
      embedUrl: `https://www.youtube.com/embed/${track.id}`,
    },
    finalPhrase: demo.finalPhrase ?? "",
    colorScheme,
  };
}

function demoPhotosFor(niche: Niche): PublicPhoto[] {
  const coverByNiche: Record<Niche, string> = {
    romance: "/demo/romance-cover.jpg",
    amizade: "/demo/amizade-cover.jpg",
    familia: "/demo/familia-cover.jpg",
    pet: "/demo/pet-cover.jpg",
    aniversario: "/demo/aniversario-cover.jpg",
    bebe: "/demo/bebe-cover.jpg",
    casamento: "/demo/casamento-cover.jpg",
  };
  return [
    { assetId: "p1", url: coverByNiche[niche], altText: "Imagem de demonstração da capa", position: 0, isCover: true },
    { assetId: "p2", url: `/demo/${niche}-2.jpg`, altText: "Imagem de demonstração da galeria", position: 1, isCover: false },
    { assetId: "p3", url: `/demo/${niche}-3.jpg`, altText: "Imagem de demonstração da galeria", position: 2, isCover: false },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getActiveTemplate(slug);
  return {
    title: t?.name ?? "Modelo",
    description: t?.description ?? "Veja uma demonstração deste modelo de presente.",
    robots: { index: true, follow: true },
  };
}

export default async function ModeloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = await getActiveTemplate(slug);
  if (!template) notFound();

  return (
    <div className="force-light min-h-screen bg-background">
      <div className="border-b border-border bg-white">
        <BlurFade>
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
            <div>
              <h1 className="font-serif text-3xl">{template.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
            </div>
            <Link href={`/criar?template=${template.slug}`} data-analytics="template_select" data-analytics-label={template.slug} className={buttonVariants({ variant: "shiny" })}>
              Usar este modelo
            </Link>
          </div>
        </BlurFade>
      </div>

      <TemplateRenderer
        slug={template.slug}
        content={demoContentFor(template.niche, template.presets.defaultScheme)}
        photos={demoPhotosFor(template.niche)}
      />
    </div>
  );
}
