import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/labels";

export const metadata = { title: "Denúncias" };

export default async function AdminDenunciasPage() {
  const reports = await prisma.abuseReport.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: true },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Denúncias</h1>
      {reports.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Nenhuma denúncia.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{r.reason}</p>
                <span className="text-xs text-muted-foreground">{r.status}</span>
              </div>
              {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(r.createdAt)} ·{" "}
                <Link href={`/presente/${r.project.slug}`} className="text-primary underline">
                  ver página
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
