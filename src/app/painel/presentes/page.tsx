import Link from "next/link";
import { requireUser } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS, statusVariant } from "@/lib/labels";

export const metadata = { title: "Meus presentes" };

type ContentLike = { creatorName?: string; recipientName?: string; title?: string };

function names(content: unknown): string {
  const c = (content ?? {}) as ContentLike;
  if (c.recipientName && c.creatorName) return `${c.creatorName} & ${c.recipientName}`;
  return c.title ?? "Presente sem título";
}

export default async function PresentesPage() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Meus presentes</h1>

      {projects.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          Você ainda não criou nenhum presente.{" "}
          <Link href="/criar" className="text-primary underline">
            Criar agora
          </Link>
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/painel/presentes/${p.id}`}
                className="block rounded-3xl border border-border bg-white p-5 transition-colors hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={statusVariant(p.status)}>{PROJECT_STATUS_LABELS[p.status] ?? p.status}</Badge>
                </div>
                <p className="mt-3 font-serif text-xl">{names(p.content)}</p>
                {p.status === "PUBLISHED" && p.slug && (
                  <p className="mt-2 text-xs text-muted-foreground">/presente/{p.slug}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
