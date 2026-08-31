import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-primary">Atualizada em 27 de agosto de 2026</p>
      <h1 className="mt-2 font-serif text-4xl">Política de privacidade</h1>
      <p className="mt-4 leading-7 text-muted-foreground">
        Esta política descreve como o {brand.name} trata os dados necessários para criar, vender e entregar
        presentes digitais e físicos.
      </p>
      <div className="mt-10 space-y-8 leading-7 text-muted-foreground">
        <PrivacySection title="Dados que tratamos">
          Recebemos dados de conta e compra, como nome, e-mail, consentimentos, pagamento e endereço quando há
          entrega. Também armazenamos o conteúdo enviado ao presente, como textos, datas e fotos, além de dados
          técnicos essenciais para segurança e funcionamento.
        </PrivacySection>
        <PrivacySection title="Por que usamos esses dados">
          Usamos as informações para salvar o rascunho, processar a compra, publicar o presente, enviar links de
          acesso, produzir e entregar itens físicos, atender solicitações, prevenir fraude e cumprir obrigações
          legais.
        </PrivacySection>
        <PrivacySection title="Compartilhamento necessário">
          Dados podem ser enviados a provedores que operam partes do serviço, como pagamento, e-mail,
          armazenamento e transporte. Cada parceiro recebe apenas o necessário para executar sua função. Não
          vendemos dados pessoais.
        </PrivacySection>
        <PrivacySection title="Visibilidade do presente">
          A página não é listada no catálogo interno e usa um link específico, mas não possui senha por padrão.
          Pessoas que receberem esse link poderão visualizar o conteúdo. Não coloque informações sensíveis na
          página.
        </PrivacySection>
        <PrivacySection title="Retenção e exclusão">
          Mantemos dados enquanto forem necessários ao plano contratado, à operação, à segurança ou a deveres
          legais. O titular pode pedir acesso, correção ou exclusão; alguns registros de transação precisam ser
          preservados pelo prazo legal.
        </PrivacySection>
        <PrivacySection title="Seus direitos e contato">
          Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade quando aplicável,
          informações sobre compartilhamento e eliminação nos limites da LGPD. {brand.legal.email ? (
            <>Envie a solicitação para <a className="font-medium text-primary underline" href={`mailto:${brand.legal.email}`}>{brand.legal.email}</a>.</>
          ) : (
            <>O canal oficial de privacidade será exibido aqui antes da abertura comercial.</>
          )}
        </PrivacySection>
      </div>
    </section>
  );
}

function PrivacySection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="font-serif text-2xl text-foreground">{title}</h2><p className="mt-3">{children}</p></section>;
}
