import Link from "next/link";
import Image from "next/image";
import { Check, Heart, Link2, QrCode, Smartphone, Sparkles } from "lucide-react";
import { cn, formatBRL } from "@/lib/utils";
import type { PlanDefinition } from "@/lib/domain/plans";
import { NICHE_LABELS } from "@/lib/domain/templates";
import { NICHES } from "@/lib/domain/enums";
import { listActivePlans } from "@/lib/server/plans";
import { listActiveTemplates } from "@/lib/server/templates";
import { listActiveTestimonials, type TestimonialView } from "@/lib/server/testimonials";
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

export default async function HomePage() {
  const [plans, templates, testimonials] = await Promise.all([
    listActivePlans(),
    listActiveTemplates(),
    listActiveTestimonials(),
  ]);
  return (
    <>
      <Hero startingPrice={plans.length > 0 ? Math.min(...plans.map((plan) => plan.priceCents)) : null} />
      <MarqueeStrip />
      <HowItWorks />
      <StatsStrip templateCount={templates.length} />
      <TemplatesSection />
      <TestimonialsSection testimonials={testimonials} />
      <PhysicalSection />
      <PricingSection plans={plans} />
      <PrivacySection />
      <FaqSection plans={plans} />
    </>
  );
}

function Hero({ startingPrice }: { startingPrice: number | null }) {
  return (
    <section className="relative overflow-hidden">
      <FloatingHearts count={16} className="opacity-70" />
      <Spotlight className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <BlurFade>
              <Badge variant="secondary" className="mb-5 gap-1.5 text-sm">
                <Sparkles className="h-3.5 w-3.5" /> Presente digital personalizado
              </Badge>
            </BlurFade>
            <BlurFade delay={0.08}>
              <h1 className="font-serif text-4xl leading-tight text-foreground md:text-6xl">
                Crie um presente que vai fazer{" "}
                <AnimatedGradientText>quem você ama se emocionar</AnimatedGradientText>.
              </h1>
            </BlurFade>
            <BlurFade delay={0.16}>
              <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">
                Uma página exclusiva com fotos, mensagens e a história de vocês — pronta em poucos
                minutos.
              </p>
            </BlurFade>
            <BlurFade delay={0.22}>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="font-serif text-2xl text-primary">
                  {startingPrice === null ? "Escolha o plano no final" : `A partir de ${formatBRL(startingPrice)}`}
                </p>
                <Badge className="gap-1 border-accent/40 bg-accent/15 text-accent">
                  🔥 Preço de lançamento
                </Badge>
              </div>
            </BlurFade>
            <BlurFade delay={0.28}>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/criar" data-analytics="cta_click" data-analytics-label="hero_criar" className={buttonVariants({ variant: "shiny", size: "lg" })}>
                  Garantir meu presente agora
                </Link>
                <Link
                  href="/presente/demo-alex-e-dani"
                  data-analytics="cta_click"
                  data-analytics-label="hero_exemplo"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  Ver um exemplo real
                </Link>
              </div>
            </BlurFade>
            <BlurFade delay={0.34}>
              <p className="mt-5 text-sm text-muted-foreground">
                Pronto em poucos minutos · preço de lançamento por tempo limitado
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
    <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm">
      {label}
    </span>
  );
}

function PhoneMockup() {
  return (
    <div className="h-[460px] w-[230px] rounded-[2.5rem] bg-[#1c1719] p-[10px] shadow-xl ring-1 ring-black/10">
      <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-background">
        <Image
          src="/marketing/hero-preview.png"
          alt="Prévia do modelo Romance Clássico: capa com Alex &amp; Dani."
          fill
          sizes="230px"
          priority
          className="object-cover object-top"
        />
        {/* Notch */}
        <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-black/80" />
        {/* Indicador de home */}
        <div className="absolute bottom-1.5 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-white/70" />
      </div>
    </div>
  );
}

// Fotos reais dos chaveiros (produto físico do Kit Coração NFC), não um ícone
// ilustrativo — o cliente vê exatamente o que recebe.
function HeartKeychain() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/marketing/product/chaveiro-i-love-you.png"
      alt="Chaveiro coração com NFC — modelo I Love You"
      className="h-24 w-auto drop-shadow-xl"
    />
  );
}

const MARQUEE_ITEMS = [
  "Fotos",
  "Mensagens",
  "Linha do tempo",
  "Música do Spotify ou YouTube",
  "Link personalizado",
  "NFC no coração",
  "QR de contingência",
  "Privacidade",
];

function MarqueeStrip() {
  return (
    <section className="border-y border-border bg-card py-6">
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
    <section id="como-funciona" className="scroll-mt-20 border-y border-border bg-card">
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
        <BlurFade delay={0.15} className="mt-12">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border shadow-sm">
            <Image
              src="/marketing/escolha-o-estilo.png"
              alt="Escolha o estilo: vários templates para cada história, em telas de celular."
              width={1536}
              height={1024}
              className="h-auto w-full"
              sizes="(min-width: 768px) 768px, 100vw"
            />
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

function StatsStrip({ templateCount }: { templateCount: number }) {
  const stats = [
    { value: templateCount, label: "modelos" },
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
  romance: "Para celebrar o amor que nos conecta.",
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
      <h2 className="sr-only">Modelos para cada ocasião</h2>
      <BlurFade>
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border shadow-sm">
          <Image
            src="/marketing/modelos-para-cada-ocasiao.png"
            alt="Modelos para cada ocasião: escolha um estilo e personalize com fotos, mensagens e música."
            width={1536}
            height={1024}
            className="h-auto w-full"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </div>
      </BlurFade>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NICHES.map((niche, i) => (
          <BlurFade key={niche} delay={i * 0.06}>
            <Link
              href={`/modelos?nicho=${niche}`}
              className="group block h-full overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
            >
              <Image
                src={`/marketing/niches/${niche}.png`}
                alt={`${NICHE_LABELS[niche]} — ${NICHE_DESCRIPTIONS[niche]}`}
                width={356}
                height={388}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              />
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

function youtubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function TestimonialMedia({ testimonial }: { testimonial: TestimonialView }) {
  if (testimonial.mediaType === "PHOTO" && testimonial.mediaUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={testimonial.mediaUrl}
        alt={`Presente de ${testimonial.authorName}`}
        className="aspect-video w-full rounded-2xl object-cover"
      />
    );
  }
  if (testimonial.mediaType === "VIDEO" && testimonial.mediaUrl) {
    const embedUrl = youtubeEmbedUrl(testimonial.mediaUrl);
    if (embedUrl) {
      return (
        <iframe
          src={embedUrl}
          title={`Depoimento de ${testimonial.authorName}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-2xl"
        />
      );
    }
    return (
      <video src={testimonial.mediaUrl} controls className="aspect-video w-full rounded-2xl object-cover" />
    );
  }
  return null;
}

function TestimonialsSection({ testimonials }: { testimonials: TestimonialView[] }) {
  if (testimonials.length === 0) return null;
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <BlurFade>
          <h2 className="text-center font-serif text-3xl md:text-4xl">Quem já presenteou</h2>
        </BlurFade>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <BlurFade key={t.id} delay={i * 0.08}>
              <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background p-5">
                {t.mediaType !== "NONE" && t.mediaUrl && (
                  <div className="mb-4 -mx-5 -mt-5">
                    <TestimonialMedia testimonial={t} />
                  </div>
                )}
                {t.quote && (
                  <p className="flex-1 text-sm leading-6 text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                )}
                <div className="mt-4">
                  <p className="font-medium text-foreground">{t.authorName}</p>
                  {t.occasion && <p className="text-xs text-muted-foreground">{t.occasion}</p>}
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
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
        <BlurFade delay={0.1}>
          <div className="flex flex-col items-center">
            <div className="relative flex items-end justify-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marketing/product/chaveiro-love.png"
                alt="Chaveiro coração com NFC — modelo Love"
                className="h-28 w-auto rotate-[-6deg] drop-shadow-xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marketing/product/chaveiro-i-love-you.png"
                alt="Chaveiro coração com NFC — modelo I Love You"
                className="h-36 w-auto rotate-[4deg] drop-shadow-xl"
              />
            </div>
            <p className="mt-4 text-xs text-creme/70">Modelos sortidos — fotos reais do produto.</p>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

function PricingSection({ plans }: { plans: PlanDefinition[] }) {
  const momento = plans.find((p) => p.slug === "momento");
  return (
    <section id="precos" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      {momento && (
        <BlurFade>
          <div className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-4 rounded-3xl border border-accent/30 bg-primary/5 p-8 text-center shadow-[0_0_40px_-12px] shadow-accent/30">
            <Badge className="gap-1 border-accent/40 bg-accent/15 text-accent">
              🔥 Preço de lançamento
            </Badge>
            <h2 className="font-serif text-2xl md:text-3xl">
              Seu presente por apenas {formatBRL(momento.priceCents)}
            </h2>
            <p className="text-sm text-muted-foreground">
              Escolha o modelo, coloque as fotos, escreva a mensagem e escolha a música. Receba o link
              pronto para compartilhar.
            </p>
            <Link
              href="/criar"
              data-analytics="cta_click"
              data-analytics-label="pricing_momento"
              className={buttonVariants({ variant: "shiny", size: "lg" })}
            >
              Garantir agora por {formatBRL(momento.priceCents)}
            </Link>
            <p className="text-xs text-muted-foreground">Preço de lançamento por tempo limitado.</p>
          </div>
        </BlurFade>
      )}
      <BlurFade>
        <h2 className="text-center font-serif text-3xl md:text-4xl">Ou escolha um plano completo</h2>
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
                {planFeatures(p).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/criar"
                data-analytics="cta_click"
                data-analytics-label={`plano_${p.slug}`}
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
                <div className={cn("flex h-full flex-col rounded-3xl border border-border bg-card")}>{inner}</div>
              )}
            </BlurFade>
          );
        })}
      </div>
    </section>
  );
}

function planFeatures(plan: PlanDefinition): string[] {
  switch (plan.slug) {
    case "momento":
      return [
        `${plan.durationDays ?? 7} dias no ar`,
        `Até ${plan.limits.maxPhotos} fotos`,
        "1 modelo à sua escolha",
        "Nomes, mensagem e contador",
        "Link pronto para compartilhar",
      ];
    case "para-sempre":
      return [
        "Sem data de expiração",
        `Até ${plan.limits.maxPhotos} fotos`,
        `Linha do tempo com ${plan.limits.maxMoments} momentos`,
        "Música do Spotify ou YouTube",
        "Link personalizado",
        "Edição posterior",
      ];
    case "kit-coracao-nfc":
      return ["Tudo do Para Sempre", "Chaveiro coração com NFC", "Cartão com QR de contingência", "Embalagem protegida", "Acompanhamento do pedido"];
    default:
      return [];
  }
}

function PrivacySection() {
  return (
    <section className="border-y border-border bg-card">
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

function FaqSection({ plans }: { plans: PlanDefinition[] }) {
  const momento = plans.find((p) => p.slug === "momento");
  const momentoDays = momento?.durationDays ?? 7;
  const faqs = [
    { q: "Precisa saber criar site?", a: "Não. O assistente guia você passo a passo, sem conhecimento técnico." },
    { q: "Funciona em qualquer celular?", a: "Sim, em qualquer celular com navegador moderno. O link abre normalmente." },
    { q: "E se o celular não tiver NFC?", a: "Sem problema: o cartão acompanha um QR Code de contingência que abre a mesma página." },
    { q: "Posso editar depois?", a: "Nos planos Para Sempre e Kit Coração NFC, sim. O plano Momento permite fazer upgrade." },
    {
      q: "Quanto tempo a página fica no ar?",
      a: `O plano Momento fica ${momentoDays} dias após a ativação. Os demais ficam disponíveis enquanto o serviço operar.`,
    },
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
            <details className="group rounded-2xl border border-border bg-card p-5">
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
