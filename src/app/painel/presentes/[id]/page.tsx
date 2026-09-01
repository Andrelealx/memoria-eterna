import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { publicMediaUrl, preferredVariantKey } from "@/lib/server/media";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ShareButton } from "@/components/templates/share-button";
import { UpgradeButton } from "@/components/upgrade-button";
import { EditProjectButton } from "@/components/edit-project-button";
import { PROJECT_STATUS_LABELS, formatDate } from "@/lib/labels";
import { isProjectStatusEditable } from "@/lib/domain/plans";

export const metadata = { title: "Presente" };

export default async function PresentePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: user.id },
    include: { mediaAssets: true, plan: true },
  });
  if (!project) notFound();

  const content = (project.content ?? {}) as Record<string, unknown>;
  const title = (content.title as string) || "Presente";
  const cover = project.mediaAssets.find((m) => {
    const variants = m.variants as { thumbnail?: string; preview?: string };
    return (variants?.preview ?? variants?.thumbnail) != null;
  });
  const coverUrl = cover ? await publicMediaUrl(preferredVariantKey(cover)) : null;
  const editable = isProjectStatusEditable(project.status, project.plan?.limits);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge variant="muted">{PROJECT_STATUS_LABELS[project.status] ?? project.status}</Badge>
          <h1 className="mt-3 font-serif text-3xl">{title}</h1>
          {project.status === "PUBLISHED" && (
            <p className="mt-2 text-sm text-muted-foreground">
              Válido até {formatDate(project.expiresAt)}
            </p>
          )}
        </div>
        {project.status === "PUBLISHED" && project.slug && (
          <ShareButton title={title} />
        )}
      </div>

      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt={title} className="mt-6 h-64 w-full rounded-3xl object-cover" />
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {project.status === "PUBLISHED" && project.slug && (
          <Link href={`/presente/${project.slug}`} className={buttonVariants({})}>
            Ver página
          </Link>
        )}
        {project.status === "PUBLISHED" && editable && <EditProjectButton projectId={project.id} />}
        {project.status === "DRAFT" && (
          <span className="rounded-2xl bg-secondary px-4 py-2 text-sm text-muted-foreground">
            Rascunho ainda não comprado.
          </span>
        )}
        {(project.status === "EXPIRED" || project.plan?.slug === "momento") && (
          <UpgradeButton projectId={project.id} newPlanSlug="para-sempre" />
        )}
      </div>
    </div>
  );
}
