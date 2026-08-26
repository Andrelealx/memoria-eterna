import Link from "next/link";
import { requireUser } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";

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
        <div className="rounded-3xl border border-border bg-white p-6">
          <p className="text-sm text-muted-foreground">Presentes</p>
          <p className="mt-1 font-serif text-4xl">{gifts}</p>
          <Link href="/painel/presentes" className="mt-3 inline-block text-sm text-primary underline">
            Ver presentes
          </Link>
        </div>
        <div className="rounded-3xl border border-border bg-white p-6">
          <p className="text-sm text-muted-foreground">Pedidos</p>
          <p className="mt-1 font-serif text-4xl">{orders}</p>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/criar" className={buttonVariants({})}>
          Criar novo presente
        </Link>
      </div>
    </div>
  );
}
