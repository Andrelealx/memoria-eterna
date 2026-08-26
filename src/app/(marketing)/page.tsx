import Link from "next/link";
import { Check, Heart, Link2, QrCode, Smartphone, Sparkles } from "lucide-react";
import { cn, formatBRL } from "@/lib/utils";
import { DEFAULT_PLANS } from "@/lib/domain/plans";
import { DEFAULT_TEMPLATES } from "@/lib/domain/templates";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Landing page (seção 9). Layout exato em duas colunas no desktop, uma no mobile.

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <TemplatesSection />
      <PhysicalSection />
      <PricingSection />
      <PrivacySection />
      <FaqSection />
    </>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 md:grid-cols-2 md:pt-20">
      <div>
        <Badge variant="secondary" className="mb-5 gap-1.5 text-sm">
          <Sparkles className="h-3.5 w-3.5" /> Uma surpresa feita por você
        </Badge>
        <h1 className="font-serif text-4xl leading-tight text-foreground md:text-6xl">
          Suas memórias em um presente que pode ser tocado.
        </h1>
        <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">
          Crie uma página com fotos, mensagens e a história de vocês. Se quiser, conecte tudo a um
          coração com NFC.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/criar" className={buttonVariants({ size: "lg" })}>
            Criar meu presente
          </Link>
          <Link href="/como-funciona" className={buttonVariants({ variant: "secondary", size: "lg" })}>
            Ver como funciona
          </Link>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          A partir de R$ 19,90 · Pronto em poucos minutos
        </p>
      </div>

      <HeroVisual />
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="relative">
        <PhoneMockup />
        <div className="absolute -right-4 -top-6 md:-right-10">
          <FloatingTag label="Fotos" />
        </div>
        <div className="absolute -left-4 top-16 md:-left-10">
          <FloatingTag label="Nossa história" />
        </div>
        <div className="absolute -bottom-4 left-6 md:left-10">
          <FloatingTag label="NFC" />
        </div>
      </div>
      <div className="absolute -right-2 bottom-2 md:-right-8">
        <HeartKeychain />
      </div>
    </div>
  );
}

function FloatingTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
      {label}
    </span>
  );
}

function PhoneMockup() {
  return (
    <div className="h-[460px] w-[230px] rounded-[2.5rem] border border-border bg-white p-3 shadow-sm">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] bg-creme">
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-secondary to-background p-5 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-white">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <p className="font-serif text-xl text-foreground">Alex &amp; Dani</p>
          <p className="text-xs text-muted-foreground">Juntos desde 14 de junho</p>
          <div className="mt-2 h-2 w-24 rounded-full bg-primary/20" />
        </div>
      </div>
    </div>
  );
}

function HeartKeychain() {
  return (
    <svg viewBox="0 0 80 100" className="h-24 w-20" aria-hidden="true">
      <circle cx="40" cy="14" r="6" fill="none" stroke="#C6A15B" strokeWidth="2" />
      <path
        d="M40 20 L40 34"
        stroke="#C6A15B"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M40 34 C 22 28 16 48 24 58 C 30 66 40 70 40 70 C 40 70 50 66 56 58 C 64 48 58 28 40 34 Z"
        fill="#7A2438"
        stroke="#4B1625"
        strokeWidth="1.5"
      />
      <path d="M26 50 C 24 48 22 48 21 50" stroke="#FFF9F5" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", title: "Escolha o estilo", text: "Selecione um template romântico que combine com vocês." },
    { n: "2", title: "Conte a história de vocês", text: "Adicione fotos, datas, mensagens e uma música." },
    { n: "3", title: "Envie o link ou presenteie com NFC", text: "Compartilhe pelo WhatsApp ou aproxime o coração do celular." },
  ];
  return (
    <section className="border-y border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center font-serif text-3xl md:text-4xl">Como funciona</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-border p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-serif text-lg text-primary-foreground">
                {s.n}
              </span>
              <h3 className="mt-5 font-serif text-xl">{s.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TemplatesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 className="text-center font-serif text-3xl md:text-4xl">Modelos românticos</h2>
      <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
        Três estilos pensados para contar a história de vocês.
      </p>
      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {DEFAULT_TEMPLATES.map((t) => (
          <div key={t.slug} className="flex flex-col items-center">
            <div className="h-[260px] w-[140px] rounded-[1.8rem] border border-border bg-white p-2 shadow-sm">
              <div className="flex h-full w-full items-center justify-center rounded-[1.4rem] bg-secondary">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="mt-4 font-serif text-lg">{t.name}</h3>
            <Link
              href={`/modelos/${t.slug}`}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Ver modelo
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function PhysicalSection() {
  const benefits = [
    { icon: Smartphone, title: "NFC oculto", text: "A tecnologia fica escondida dentro da peça." },
    { icon: Link2, title: "Link atualizável", text: "O destino pode ser trocado sem regravar a tag." },
    { icon: QrCode, title: "QR de segurança", text: "QR Code de contingência no cartão que acompanha." },
  ];
  return (
    <section className="bg-primary-dark text-creme">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl leading-tight md:text-4xl">
            A tecnologia fica escondida. A emoção aparece quando a pessoa encosta o celular.
          </h2>
          <ul className="mt-8 space-y-4">
            {benefits.map((b) => (
              <li key={b.title} className="flex items-start gap-3">
                <b.icon className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-sm text-creme/80">{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center">
          <HeartKeychain />
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = DEFAULT_PLANS;
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 className="text-center font-serif text-3xl md:text-4xl">Escolha o seu presente</h2>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((p) => {
          const featured = p.slug === "para-sempre";
          return (
            <div
              key={p.slug}
              className={cn(
                "flex flex-col rounded-3xl border p-8",
                featured ? "border-primary bg-white shadow-sm" : "border-border bg-white",
              )}
            >
              {featured && (
                <Badge className="mb-3 self-start" variant="default">
                  Melhor experiência
                </Badge>
              )}
              <h3 className="font-serif text-2xl">{p.name}</h3>
              <p className="mt-3">
                <span className="font-serif text-3xl">{formatBRL(p.priceCents)}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {planFeatures(p.slug).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/criar"
                className={buttonVariants({
                  variant: featured ? "default" : "secondary",
                  className: "mt-8 w-full",
                })}
              >
                Criar meu presente
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function planFeatures(slug: string): string[] {
  switch (slug) {
    case "momento":
      return ["7 dias no ar", "Até 5 fotos", "1 template romântico", "Nomes, mensagem e contador", "Link e WhatsApp"];
    case "para-sempre":
      return ["Sem data de expiração", "Até 30 fotos", "Linha do tempo com 12 momentos", "Música por embed", "Slug personalizado", "Edição posterior"];
    case "kit-coracao-nfc":
      return ["Tudo do Para Sempre", "Chaveiro coração com NFC", "Cartão com QR de contingência", "Embalagem protegida", "Acompanhamento do pedido"];
    default:
      return [];
  }
}

function PrivacySection() {
  return (
    <section className="border-y border-border bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-serif text-2xl md:text-3xl">Segurança e privacidade</h2>
        <p className="mt-4 text-muted-foreground">
          Sua página é pública apenas por link e não aparece em buscas internas. As fotos são
          protegidas e você, como proprietário, pode solicitar a exclusão a qualquer momento.
        </p>
      </div>
    </section>
  );
}

function FaqSection() {
  const faqs = [
    { q: "Precisa saber criar site?", a: "Não. O assistente guia você passo a passo, sem conhecimento técnico." },
    { q: "Funciona em qualquer celular?", a: "Sim, em qualquer celular com navegador moderno. O link abre normalmente." },
    { q: "E se o celular não tiver NFC?", a: "Sem problema: o cartão acompanha um QR Code de contingência que abre a mesma página." },
    { q: "Posso editar depois?", a: "Nos planos Para Sempre e Kit Coração NFC, sim. O plano Momento permite fazer upgrade." },
    { q: "Quanto tempo a página fica no ar?", a: "O plano Momento fica 7 dias após a ativação. Os demais ficam disponíveis enquanto o serviço operar." },
    { q: "Posso usar qualquer música?", a: "Apenas músicas por link permitido do Spotify ou YouTube, respeitando os direitos autorais." },
    { q: "Quanto demora o envio do chaveiro?", a: "O prazo estimado é informado no checkout e você acompanha o status do pedido." },
  ];
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h2 className="text-center font-serif text-3xl md:text-4xl">Perguntas frequentes</h2>
      <div className="mt-10 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-border bg-white p-5">
            <summary className="cursor-pointer list-none font-medium text-foreground">
              {f.q}
            </summary>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
