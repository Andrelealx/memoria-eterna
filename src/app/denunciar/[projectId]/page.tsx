import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ReportForm } from "@/components/report-form";

export const metadata: Metadata = { title: "Denunciar conteúdo" };

export default async function DenunciarPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl">Denunciar conteúdo</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Conteúdo íntimo não consentido, exploração infantil, violência ilegal e uso abusivo violam
        nossos termos. Sua denúncia será analisada.
      </p>

      {project ? (
        <ReportForm projectId={project.id} />
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Conteúdo não encontrado.</p>
      )}

      <p className="mt-8 text-sm">
        <Link href="/" className="text-primary underline">
          Voltar ao início
        </Link>
      </p>
    </div>
  );
}
