import Link from "next/link";
import { requireUser } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

export const metadata = { title: "Painel" };

export default async function PainelPage() {
  const user = await requireUser();
  const [gifts, orders] = await Promise.all([
    prisma.project.count({ where: { ownerId: user.id } }),
    prisma.order.count({ where: { customerId: user.id } }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl">Olá 👋</h1>
      <p className="mt-2 text-muted-foreground">{user.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <StatCard label="Presentes" value={gifts} href="/painel/presentes" />
        <StatCard label="Pedidos" value={orders} />
      </div>

      <div className="mt-8">
        <Link href="/criar" className={buttonVariants({})}>
          Criar novo presente
        </Link>
      </div>
    </div>
  );
}
