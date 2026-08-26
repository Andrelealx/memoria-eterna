import { requireUser } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/labels";

export const metadata = { title: "Conta" };

export default async function ContaPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  return (
    <div>
      <h1 className="font-serif text-3xl">Conta</h1>

      <div className="mt-6 rounded-3xl border border-border bg-white p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">E-mail</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Nome</dt>
            <dd>{dbUser?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Criado em</dt>
            <dd>{formatDate(dbUser?.createdAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-white p-6">
        <h2 className="font-serif text-xl">Privacidade e exclusão</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Para solicitar a remoção dos seus dados e conteúdo, entre em contato pelo e-mail de
          suporte. O fluxo completo de exclusão (LGPD) estará disponível em breve.
        </p>
      </div>
    </div>
  );
}
