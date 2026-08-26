import Link from "next/link";
import { Check, Heart, Link2, QrCode, Smartphone, Sparkles } from "lucide-react";
import { cn, formatBRL } from "@/lib/utils";
import { DEFAULT_PLANS } from "@/lib/domain/plans";
import { NICHE_LABELS } from "@/lib/domain/templates";
import { NICHES } from "@/lib/domain/enums";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { Marquee } from "@/components/ui/marquee";
import { Spotlight } from "@/components/ui/spotlight";
import { ShineBorder } from "@/components/ui/shine-border";
import { FloatingHearts } from "@/components/ui/floating-hearts";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { NumberTicker } from "@/components/ui/number-ticker";

// Landing page (seção 9). Layout em duas colunas no desktop, uma no mobile,
// com animações discretas de entrada e ambiência (padrões Origin UI / Cult UI).

export default function HomePage() {
  return (
    <>
      <Hero />
      <MarqueeStrip />
      <HowItWorks />
      <StatsStrip />
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
    <section className="relative overflow-hidden">
      <FloatingHearts count={16} className="opacity-70" />
      <Spotlight className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <BlurFade>
              <Badge variant="secondary" className="mb-5 gap-1.5 text-sm">
                <Sparkles className="h-3.5 w-3.5" /> Uma surpresa feita por você
              </Badge>
            </BlurFade>
            <BlurFade delay={0.08}>
              <h1 className="font-serif text-4xl leading-tight text-foreground md:text-6xl">
                Suas memórias em um{" "}
                <AnimatedGradientText>presente que pode ser tocado</AnimatedGradientText>.
              </h1>
            </BlurFade>
            <BlurFade delay={0.16}>
              <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">
                Crie uma página com fotos, mensagens e a história de vocês. Se quiser, conecte tudo a um
                coração com NFC.
              </p>
            </BlurFade>
            <BlurFade delay={0.24}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/criar" className={buttonVariants({ variant: "shiny", size: "lg" })}>
                  Criar meu presente
                </Link>
                <Link href="/como-funciona" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  Ver como funciona
                </Link>
              </div>
            </BlurFade>
            <BlurFade delay={0.3}>
              <p className="mt-5 text-sm text-muted-foreground">
                A partir de R$ 19,90 · Pronto em poucos minutos
              </p>
            </BlurFade>
          </div>

          <HeroVisual />
        </div>
      </Spotlight>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="relative">
        <div className="animate-float">
          <PhoneMockup />
        </div>
        <div className="absolute -right-4 -top-6 animate-float [animation-delay:1s] md:-right-10">
          <FloatingTag label="Fotos" />
        </div>
        <div className="absolute -left-4 top-16 animate-float [animation-delay:2s] md:-left-10">
          <FloatingTag label="Nossa história" />
        </div>
        <div className="absolute -bottom-4 left-6 animate-float [animation-delay:3s] md:left-10">
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

const MARQUEE_ITEMS = [
  "Fotos",
  "Mensagens",
  "Linha do tempo",
  "Música por embed",
  "Slug personalizado",
  "NFC no coração",
  "QR de contingência",
  "Privacidade",
];

function MarqueeStrip() {
  return (
    <section className="border-y border-border bg-white py-6">
      <Marquee pauseOnHover>
        {MARQUEE_ITEMS.map((item) => (
          <span key={item} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-primary/60" />
            {item}
          </span>
        ))}
      </Marquee>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "1", title: "Escolha o estilo", text: "Selecione um template que combine com a ocasião." },
    { n: "2", title: "Conte a história de vocês", text: "Adicione fotos, datas, mensagens e uma música." },
    { n: "3", title: "Envie o link ou presenteie com NFC", text: "Compartilhe pelo WhatsApp ou aproxime o coração do celular." },
  ];
  return (
    <section id="como-funciona" className="scroll-mt-20 border-y border-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <BlurFade>
          <h2 className="text-center font-serif text-3xl md:text-4xl">Como funciona</h2>
        </BlurFade>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <BlurFade key={s.n} delay={i * 0.1}>
              <div className="h-full rounded-3xl border border-border p-8 transition-shadow duration-300 hover:shadow-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-serif text-lg text-primary-foreground">
                  {s.n}
                </span>
                <h3 className="mt-5 font-serif text-xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.text}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { value: 9, label: "modelos" },
    { value: 7, label: "nichos para presentear" },
    { value: 30, label: "fotos no Para Sempre" },
    { value: 12, label: "momentos na linha do tempo" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((s, i) => (
          <BlurFade key={s.label} delay={i * 0.08} className="text-center">
            <p className="font-serif text-4xl text-primary md:text-5xl">
              <NumberTicker value={s.value} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </BlurFade>
        ))}
      </div>
    </section>
  );
}

const NICHE_DESCRIPTIONS: Record<string, string> = {
  romance: "Para quem você ama",
  amizade: "Para os melhores amigos",
  familia: "Para a família",
  pet: "Para o seu pet",
  aniversario: "Para a data especial",
  bebe: "Para a chegada",
  casamento: "Para o grande dia",
};

function TemplatesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <BlurFade>
        <h2 className="text-center font-serif text-3xl md:text-4xl">Modelos para cada ocasião</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
          Do romance ao seu pet: escolha um estilo e personalize com fotos, mensagens e música.
        </p>
      </BlurFade>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NICHES.map((niche, i) => (
          <BlurFade key={niche} delay={i * 0.06}>
            <Link
              href="/modelos"
              className="group block h-full rounded-3xl border border-border bg-white p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
            >
              <p className="font-serif text-xl">{NICHE_LABELS[niche]}</p>
              <p className="mt-2 text-sm text-muted-foreground">{NICHE_DESCRIPTIONS[niche]}</p>
            </Link>
          </BlurFade>
        ))}
      </div>
      <BlurFade className="mt-8 text-center">
        <Link href="/modelos" className="text-sm font-medium text-primary hover:underline">
          Ver todos os modelos
        </Link>
      </BlurFade>
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
        <BlurFade>
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
        </BlurFade>
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
    <section id="precos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <BlurFade>
        <h2 className="text-center font-serif text-3xl md:text-4xl">Escolha o seu presente</h2>
      </BlurFade>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((p, i) => {
          const featured = p.slug === "para-sempre";
          const inner = (
            <div className="flex h-full flex-col p-8">
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
                  variant: featured ? "shiny" : "secondary",
                  className: "mt-8 w-full",
                })}
              >
                Criar meu presente
              </Link>
            </div>
          );

          return (
            <BlurFade key={p.slug} delay={i * 0.08} className="h-full">
              {featured ? (
                <ShineBorder borderRadius={24} className="h-full">
                  {inner}
                </ShineBorder>
              ) : (
                <div className={cn("flex h-full flex-col rounded-3xl border border-border bg-white")}>{inner}</div>
              )}
            </BlurFade>
          );
        })}
      </div>
    </section>
  );
}

function planFeatures(slug: string): string[] {
  switch (slug) {
    case "momento":
      return ["7 dias no ar", "Até 5 fotos", "1 template à sua escolha", "Nomes, mensagem e contador", "Link e WhatsApp"];
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
        <BlurFade>
          <h2 className="font-serif text-2xl md:text-3xl">Segurança e privacidade</h2>
          <p className="mt-4 text-muted-foreground">
            Sua página é pública apenas por link e não aparece em buscas internas. As fotos são
            protegidas e você, como proprietário, pode solicitar a exclusão a qualquer momento.
          </p>
        </BlurFade>
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
      <BlurFade>
        <h2 className="text-center font-serif text-3xl md:text-4xl">Perguntas frequentes</h2>
      </BlurFade>
      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => (
          <BlurFade key={f.q} delay={i * 0.05}>
            <details className="group rounded-2xl border border-border bg-white p-5">
              <summary className="cursor-pointer list-none font-medium text-foreground">
                {f.q}
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.a}</p>
            </details>
          </BlurFade>
        ))}
      </div>
    </section>
  );
}
