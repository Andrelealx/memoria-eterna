import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/labels";

export const metadata = { title: "Auditoria" };

const ENTITIES = ["abuse_report", "coupon", "nfc_tag", "physical_order", "plan", "template", "user"];
const PAGE_SIZE = 200;

export default async function AdminAuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entity?: string }>;
}) {
  const { q, entity } = await searchParams;
  const query = q?.trim();

  const where: Prisma.AuditLogWhereInput = {
    ...(entity && ENTITIES.includes(entity) ? { entity } : {}),
    ...(query
      ? {
          OR: [
            { action: { contains: query, mode: "insensitive" } },
            { entityId: { contains: query, mode: "insensitive" } },
            { actor: { email: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    include: { actor: true },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">Auditoria</h1>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por ação, ID do registro ou e-mail de quem agiu"
          className="border-border bg-card min-w-[280px] flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <select
          name="entity"
          defaultValue={entity ?? ""}
          className="border-border bg-card rounded-xl border px-3 py-2 text-sm"
        >
          <option value="">Todos os tipos</option>
          {ENTITIES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Filtrar
        </button>
        {(query || entity) && (
          <Link
            href="/admin/auditoria"
            className="text-muted-foreground hover:text-primary self-center text-sm underline"
          >
            Limpar
          </Link>
        )}
      </form>

      {logs.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          {query || entity ? "Nenhum registro encontrado com esse filtro." : "Nenhuma ação registrada."}
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {logs.map((l) => (
            <li key={l.id} className="rounded-xl border border-border bg-card px-4 py-2 text-sm">
              <span className="font-medium">{l.action}</span>
              <span className="text-muted-foreground"> · {l.entity}</span>
              {l.entityId && <span className="text-muted-foreground"> · {l.entityId}</span>}
              {l.actor && <span className="text-muted-foreground"> · por {l.actor.email}</span>}
              <span className="text-muted-foreground"> · {formatDate(l.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
      {logs.length === PAGE_SIZE && (
        <p className="mt-4 text-xs text-muted-foreground">
          Mostrando os {PAGE_SIZE} registros mais recentes. Refine a busca para achar registros mais antigos.
        </p>
      )}
    </div>
  );
}
