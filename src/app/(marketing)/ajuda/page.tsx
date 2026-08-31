import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Ajuda" };

export default function AjudaPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-primary">Central de ajuda</p>
      <h1 className="mt-2 font-serif text-4xl">Como podemos ajudar?</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
        Respostas rápidas para criar, pagar, compartilhar e acompanhar seu presente.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          ["Meu rascunho sumiu", "No mesmo navegador, abra Criar meu presente. Se houver um rascunho salvo, você verá a opção de continuar."],
          ["Não recebi o acesso", "Confira spam e promoções. O e-mail usado na compra recebe um link pessoal para entrar sem senha."],
          ["O pagamento está pendente", "PIX pode levar alguns instantes para confirmar. Mantenha o código e confira novamente pela página do pedido."],
          ["Como funciona o NFC", "Aproxime a parte superior do celular do coração. Se o aparelho não tiver NFC, use o QR Code do cartão."],
          ["Posso editar depois?", "A edição posterior depende do plano escolhido. Seu painel informa os recursos disponíveis em cada presente."],
          ["Quero remover uma página", "Entre na sua conta para gerenciar o presente ou solicite ajuda pelo canal oficial abaixo."],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 rounded-3xl bg-secondary p-7 text-center">
        <h2 className="font-serif text-2xl">Ainda precisa de ajuda?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Inclua o número do pedido ao entrar em contato.</p>
        {brand.legal.email ? (
          <a href={`mailto:${brand.legal.email}`} className={buttonVariants({ className: "mt-5" })}>Enviar e-mail</a>
        ) : (
          <Link href="/entrar" className={buttonVariants({ className: "mt-5" })}>Acessar minha conta</Link>
        )}
      </div>
    </section>
  );
}
