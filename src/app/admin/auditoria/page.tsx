import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/labels";

export const metadata = { title: "Auditoria" };

export default async function AdminAuditoriaPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="font-serif text-3xl">Auditoria</h1>
      {logs.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Nenhuma ação registrada.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {logs.map((l) => (
            <li key={l.id} className="rounded-xl border border-border bg-white px-4 py-2 text-sm">
              <span className="font-medium">{l.action}</span>
              <span className="text-muted-foreground"> · {l.entity}</span>
              {l.entityId && <span className="text-muted-foreground"> · {l.entityId}</span>}
              <span className="text-muted-foreground"> · {formatDate(l.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
