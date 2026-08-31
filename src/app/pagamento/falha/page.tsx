import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, LogIn, RotateCcw, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PaymentFrame } from "@/components/checkout/payment-frame";
import { RetryPaymentLink } from "@/components/checkout/retry-payment-link";
import { getFailedPaymentRecovery } from "@/lib/server/orders";

export const metadata: Metadata = { title: "Pagamento não concluído" };

export default async function FalhaPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const orderParam = (await searchParams).order;
  const orderId = typeof orderParam === "string" ? orderParam : "";
  const recovery = orderId ? await getFailedPaymentRecovery(orderId) : null;

  return (
    <PaymentFrame>
      <section className="border-border bg-card w-full rounded-[2rem] border p-6 text-center shadow-sm sm:p-9">
        <span
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            recovery ? "bg-primary/10" : "bg-error/10"
          }`}
        >
          {recovery ? (
            <RotateCcw className="text-primary h-8 w-8" aria-hidden="true" />
          ) : (
            <CircleAlert className="text-error h-8 w-8" aria-hidden="true" />
          )}
        </span>

        {recovery ? (
          <>
            <p className="text-primary mt-5 text-xs font-semibold tracking-[0.16em] uppercase">
              Pedido {recovery.orderNumber}
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Seu presente está seguro</h1>
            <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-7">
              O pagamento desta tentativa não foi concluído. Seu rascunho voltou para edição com os
              textos, fotos e escolhas que você já fez.
            </p>

            <div
              className="bg-success/10 text-success mt-6 flex items-start gap-3 rounded-2xl p-4 text-left text-sm"
              role="status"
            >
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p>
                Nenhum pagamento foi aprovado nesta tentativa e não faremos uma nova cobrança
                automaticamente. Revise tudo com calma antes de tentar novamente.
              </p>
            </div>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <RetryPaymentLink draftToken={recovery.draftToken} orderId={orderId} />
              <Link
                href="/entrar"
                className={buttonVariants({ variant: "secondary", className: "w-full sm:w-auto" })}
              >
                <LogIn aria-hidden="true" />
                Acessar meus pedidos
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-6 font-serif text-3xl">Não foi possível validar este pagamento</h1>
            <p className="text-muted-foreground mx-auto mt-3 max-w-md leading-7">
              O link pode estar incompleto ou a tentativa ainda pode estar sendo atualizada. Seu
              presente não é apagado por causa disso.
            </p>

            <div className="bg-secondary mt-6 flex items-start gap-3 rounded-2xl p-4 text-left text-sm">
              <ShieldCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>
                Se o valor saiu da sua conta, não gere outro Pix agora. Aguarde alguns minutos e
                confira seus pedidos antes de tentar novamente.
              </p>
            </div>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/criar" className={buttonVariants({ className: "w-full sm:w-auto" })}>
                Retomar minha criação
              </Link>
              <Link
                href="/entrar"
                className={buttonVariants({ variant: "secondary", className: "w-full sm:w-auto" })}
              >
                Acessar meus pedidos
              </Link>
            </div>
          </>
        )}
      </section>
    </PaymentFrame>
  );
}
