import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pagamento aprovado" };

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  let slug: string | null = null;

  if (order) {
    const o = await prisma.order.findUnique({
      where: { id: order },
      include: { project: true },
    });
    slug = o?.project?.slug ?? null;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
        <Check className="h-8 w-8 text-success" />
      </span>
      <h1 className="mt-6 font-serif text-3xl">Pagamento aprovado!</h1>
      <p className="mt-3 text-muted-foreground">
        Seu presente foi publicado. Enviamos um link de acesso para o seu e-mail.
      </p>
      {slug ? (
        <Link href={`/presente/${slug}`} className={buttonVariants({ className: "mt-8" })}>
          Ver meu presente
        </Link>
      ) : (
        <Link href="/" className={buttonVariants({ variant: "secondary", className: "mt-8" })}>
          Voltar ao início
        </Link>
      )}
    </div>
  );
}
