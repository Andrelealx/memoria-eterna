import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-primary">Atualizado em 27 de agosto de 2026</p>
      <h1 className="mt-2 font-serif text-4xl">Termos de uso</h1>
      <p className="mt-4 leading-7 text-muted-foreground">
        Estes termos explicam as regras para criar, comprar, publicar e compartilhar presentes no {brand.name}.
        Ao finalizar uma compra, você confirma que leu e concordou com estas condições.
      </p>
      <div className="mt-10 space-y-8 leading-7 text-muted-foreground">
        <LegalSection title="1. O serviço">
          Você pode montar uma página de presente com textos, fotos, datas e links de música. Alguns planos
          também incluem um item físico com NFC. Recursos, limites, duração e preço aparecem antes da compra.
        </LegalSection>
        <LegalSection title="2. Sua responsabilidade pelo conteúdo">
          Publique apenas conteúdo que você tem autorização para usar. Não é permitido enviar material ilegal,
          ofensivo, enganoso, que viole direitos autorais, intimidade ou dados de terceiros. Podemos suspender
          conteúdo denunciado enquanto ele é analisado.
        </LegalSection>
        <LegalSection title="3. Link e privacidade do presente">
          O presente é acessado por um link não listado. Isso reduz a descoberta casual, mas não equivale a uma
          senha: qualquer pessoa com o link poderá abri-lo. Compartilhe-o somente com pessoas de confiança.
        </LegalSection>
        <LegalSection title="4. Pagamento e entrega">
          O preço final, descontos e frete são recalculados no servidor e mostrados antes da confirmação. A
          publicação ocorre após a aprovação do pagamento. Para itens físicos, prazo e rastreamento dependem do
          endereço, da produção e da transportadora.
        </LegalSection>
        <LegalSection title="5. Duração, edição e disponibilidade">
          A duração depende do plano escolhido. Planos com edição posterior permitem atualizar o conteúdo sem
          mudar o link. Podemos realizar manutenções e adotar medidas de segurança que afetem temporariamente o
          acesso.
        </LegalSection>
        <LegalSection title="6. Cancelamento e suporte">
          Solicitações de cancelamento, correção ou exclusão serão avaliadas conforme o estágio de publicação ou
          produção do item físico e a legislação aplicável. Consulte também nossa{" "}
          <Link href="/privacidade" className="font-medium text-primary underline underline-offset-4">
            Política de Privacidade
          </Link>.
        </LegalSection>
        <LegalSection title="7. Contato">
          {brand.legal.email ? (
            <>Fale com a equipe pelo e-mail <a className="font-medium text-primary underline" href={`mailto:${brand.legal.email}`}>{brand.legal.email}</a>.</>
          ) : (
            <>O canal oficial de suporte será exibido nesta página antes da abertura comercial.</>
          )}
        </LegalSection>
      </div>
    </section>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="font-serif text-2xl text-foreground">{title}</h2><p className="mt-3">{children}</p></section>;
}
