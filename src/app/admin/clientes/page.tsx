import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/labels";
import { UserRole } from "@/components/admin/user-role";

export const metadata = { title: "Clientes" };

const PAGE_SIZE = 100;

export default async function AdminClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const [currentUser, users] = await Promise.all([
    getCurrentUser(),
    prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Clientes</h1>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por e-mail ou nome"
          className="border-border bg-card min-w-[260px] flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Filtrar
        </button>
        {query && (
          <Link
            href="/admin/clientes"
            className="text-muted-foreground hover:text-primary self-center text-sm underline"
          >
            Limpar
          </Link>
        )}
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-4">E-mail</th>
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2 pr-4">Papel</th>
              <th className="py-2 pr-4">Criado em</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border">
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4">{u.name ?? "—"}</td>
                <td className="py-2 pr-4">
                  <UserRole userId={u.id} currentRole={u.role} isSelf={u.id === currentUser?.id} />
                </td>
                <td className="py-2 pr-4">{formatDate(u.createdAt)}</td>
                <td className="py-2 pr-4">
                  <Link
                    href={`/admin/pedidos?q=${encodeURIComponent(u.email)}`}
                    className="text-primary hover:underline"
                  >
                    Ver pedidos
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="mt-4 text-muted-foreground">
            {query ? "Nenhum cliente encontrado com esse filtro." : "Nenhum cliente ainda."}
          </p>
        )}
        {users.length === PAGE_SIZE && (
          <p className="mt-4 text-xs text-muted-foreground">
            Mostrando os {PAGE_SIZE} clientes mais recentes. Refine a busca para achar outros.
          </p>
        )}
      </div>
    </div>
  );
}
