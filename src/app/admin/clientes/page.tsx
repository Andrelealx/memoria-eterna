import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, formatDate, roleVariant } from "@/lib/labels";

export const metadata = { title: "Clientes" };

export default async function AdminClientesPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="font-serif text-3xl">Clientes</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pr-4">E-mail</th>
              <th className="py-2 pr-4">Nome</th>
              <th className="py-2 pr-4">Papel</th>
              <th className="py-2 pr-4">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border">
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4">{u.name ?? "—"}</td>
                <td className="py-2 pr-4">
                  <Badge variant={roleVariant(u.role)}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                </td>
                <td className="py-2 pr-4">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
