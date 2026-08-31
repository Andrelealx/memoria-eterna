import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Clock3, Gift, LogIn, MailCheck, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { PaymentFrame } from "@/components/checkout/payment-frame";

export const metadata: Metadata = { title: "Pagamento aprovado" };

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const orderParam = (await searchParams).order;
  const orderId = typeof orderParam === "string" ? orderParam : "";
  const hasValidOrderId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId);
  const order = hasValidOrderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          status: true,
          project: { select: { slug: true, status: true } },
        },
      })
    : null;
  const published =
    order?.status === "PAID" &&
    order.project?.status === "PUBLISHED" &&
    Boolean(order.project.slug);
  const paid = order?.status === "PAID";

  if (published && order.project?.slug) {
    return (
      <PaymentFrame>
        <section className="border-border bg-card w-full rounded-[2rem] border p-6 text-center shadow-sm sm:p-9">
          <span className="bg-success/15 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <Check className="text-success h-8 w-8" aria-hidden="true" />
          </span>
          <p className="text-success mt-5 text-xs font-semibold tracking-[0.16em] uppercase">
            Pedido {order.orderNumber}
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Pagamento aprovado!</h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-7">
            Tudo certo: seu presente foi publicado e já está pronto para ser aberto.
          </p>

          <div className="bg-success/10 text-success mt-6 flex items-start gap-3 rounded-2xl p-4 text-left text-sm">
            <Check className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>Pagamento confirmado. Você não precisa realizar nenhuma outra ação financeira.</p>
          </div>

          <div className="border-border mt-4 grid gap-3 rounded-2xl border p-4 text-left text-sm sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Gift className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>
                <strong className="block font-medium">Confira antes de compartilhar</strong>
                <span className="text-muted-foreground">
                  Abra o presente e revise a experiência final.
                </span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <MailCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>
                <strong className="block font-medium">Acesso sempre disponível</strong>
                <span className="text-muted-foreground">
                  Você também encontra o presente entrando com o e-mail da compra.
                </span>
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={`/presente/${order.project.slug}`}
              className={buttonVariants({ className: "w-full sm:w-auto" })}
            >
              Abrir meu presente
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              href="/entrar"
              className={buttonVariants({ variant: "secondary", className: "w-full sm:w-auto" })}
            >
              <LogIn aria-hidden="true" />
              Ver meus pedidos
            </Link>
          </div>
        </section>
      </PaymentFrame>
    );
  }

  return paid ? (
    <PaymentFrame>
      <section className="border-border bg-card w-full rounded-[2rem] border p-6 text-center shadow-sm sm:p-9">
        <span className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <Clock3 className="text-primary h-8 w-8" aria-hidden="true" />
        </span>
        <p className="text-primary mt-5 text-xs font-semibold tracking-[0.16em] uppercase">
          Pedido {order.orderNumber}
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Pagamento confirmado</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-7">
          Recebemos a confirmação e estamos terminando de publicar seu presente. Isso costuma levar
          apenas alguns instantes.
        </p>
        <div className="bg-secondary mt-6 rounded-2xl p-4 text-left text-sm">
          Não faça um novo pagamento. Você poderá acessar o presente pela sua área de pedidos assim
          que a publicação terminar.
        </div>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/entrar" className={buttonVariants({ className: "w-full sm:w-auto" })}>
            <LogIn aria-hidden="true" />
            Acessar meus pedidos
          </Link>
          <Link
            href={`/pagamento/sucesso?order=${encodeURIComponent(orderId)}`}
            className={buttonVariants({ variant: "secondary", className: "w-full sm:w-auto" })}
          >
            Atualizar esta página
          </Link>
        </div>
      </section>
    </PaymentFrame>
  ) : (
    <PaymentFrame>
      <section className="border-border bg-card w-full rounded-[2rem] border p-6 text-center shadow-sm sm:p-9">
        <span className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <Search className="text-primary h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-serif text-3xl sm:text-4xl">Vamos localizar seu pagamento</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-7">
          Não encontramos uma confirmação válida neste link. Entre com o e-mail usado na compra para
          consultar o pedido com segurança.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/entrar" className={buttonVariants({ className: "w-full sm:w-auto" })}>
            <LogIn aria-hidden="true" />
            Consultar meus pedidos
          </Link>
          <Link
            href="/ajuda"
            className={buttonVariants({ variant: "secondary", className: "w-full sm:w-auto" })}
          >
            Preciso de ajuda
          </Link>
        </div>
      </section>
    </PaymentFrame>
  );
}
