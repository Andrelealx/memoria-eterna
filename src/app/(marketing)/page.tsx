import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Baby,
  Check,
  Gem,
  Gift,
  Heart,
  Home,
  Link2,
  PawPrint,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Niche } from "@/lib/domain/enums";
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
      <ColorBlobs />
      <FloatingHearts count={16} className="opacity-70" />
      <Spotlight className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <BlurFade duration={0.35}>
              <Badge variant="secondary" className="mb-5 gap-1.5 text-sm">
                <Sparkles className="h-3.5 w-3.5" /> Presente digital personalizado
              </Badge>
            </BlurFade>
            <BlurFade delay={0.04} duration={0.35}>
              <h1 className="font-serif text-4xl leading-tight text-foreground md:text-6xl">
                Crie um presente que vai fazer{" "}
                <AnimatedGradientText>quem você ama se emocionar</AnimatedGradientText>.
              </h1>
            </BlurFade>
            <BlurFade delay={0.08} duration={0.35}>
              <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">
                Você envia as fotos e conta a história de vocês. A gente transforma tudo em um
                presente pronto para emocionar quem você ama.
              </p>
            </BlurFade>
            <BlurFade delay={0.1} duration={0.35}>
              <HeroExplainer />
            </BlurFade>
            <BlurFade delay={0.12} duration={0.35}>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="font-serif text-2xl text-primary">
                  {startingPrice === null ? "Escolha o plano no final" : `Por apenas ${formatBRL(startingPrice)}`}
                </p>
                <Badge className="gap-1 border-accent/40 bg-accent/15 text-accent">
                  🔥 Preço de lançamento
                </Badge>
              </div>
            </BlurFade>
            <BlurFade delay={0.14} duration={0.35}>
              <CourtesyBanner />
            </BlurFade>
            <BlurFade delay={0.16} duration={0.35}>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/criar" data-analytics="cta_click" data-analytics-label="hero_criar" className={buttonVariants({ variant: "shiny", size: "lg" })}>
                  Garantir meu presente agora
                </Link>
                <Link
                  href="/presente/manuelly-andre"
                  data-analytics="cta_click"
                  data-analytics-label="hero_exemplo"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  Ver um exemplo real
                </Link>
              </div>
            </BlurFade>
            <BlurFade delay={0.2} duration={0.35}>
              <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span>Pronto em poucos minutos</span>
                <span aria-hidden className="hidden sm:inline">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  Pagamento seguro pelo Mercado Pago
                </span>
              </p>
            </BlurFade>
          </div>

          <HeroVisual />
        </div>
      </Spotlight>
    </section>
  );
}

// A promoção "leve 2, pague 1" já existe no sistema desde ontem (cupom de
// cortesia emitido automaticamente após a compra), mas não estava escrita em
// lugar nenhum do site — nenhum visitante sabia que ela existia. É a oferta
// mais forte que temos hoje, então aparece no hero, no checkout e na tela de
// espera do Pix.
function CourtesyBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3",
        className,
      )}
    >
      <span className="text-xl leading-none" aria-hidden>
        🎁
      </span>
      <p className="text-sm leading-6">
        <strong className="font-semibold">Compre 1 presente e ganhe outro de cortesia.</strong>{" "}
        <span className="text-muted-foreground">
          Você recebe um cupom para criar um segundo presente sem pagar nada.
        </span>
      </p>
    </div>
  );
}

const HERO_EXPLAINER_STEPS = [
  { emoji: "📸", label: "Fotos", color: "#ff6ea8" },
  { emoji: "💌", label: "Mensagem", color: "#ffb648" },
  { emoji: "🎵", label: "Música", color: "#8b5cf6" },
  { emoji: "🎁", label: "Presente!", color: "#722b45" },
];

// Resposta visual e imediata para "o que exatamente eu estou comprando" — o
// principal ponto fraco identificado na análise de conversão do site: a
// pessoa via uma frase bonita, mas não entendia o produto em 3 segundos.
function HeroExplainer() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-1.5" aria-hidden>
      {HERO_EXPLAINER_STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center gap-1">
            <span
              className="animate-pop-in flex h-11 w-11 items-center justify-center rounded-full text-xl shadow-sm"
              style={{
                backgroundColor: `${step.color}1f`,
                animationDelay: `${0.4 + i * 0.12}s`,
              }}
            >
              {step.emoji}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">{step.label}</span>
          </div>
          {i < HERO_EXPLAINER_STEPS.length - 1 && (
            <span className="mb-4 text-lg text-border">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Manchas de cor grandes e borradas atrás do conteúdo — o "mais colorido e
// vivo" pedido, sem nenhuma imagem nova e sem competir com o texto (opacidade
// baixa, atrás de tudo, aria-hidden). `pointer-events-none` deixa os cliques
// passarem direto para o conteúdo por cima.
function ColorBlobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="animate-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#ff6ea8] opacity-30 blur-3xl" />
      <div className="animate-blob absolute -right-16 top-10 h-[26rem] w-[26rem] rounded-full bg-[#ffb648] opacity-25 blur-3xl [animation-delay:4s]" />
      <div className="animate-blob absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#8b5cf6] opacity-20 blur-3xl [animation-delay:8s]" />
    </div>
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
          <FloatingTag label="Toque e revele" />
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
          src="/marketing/hero-preview.webp"
          alt="Prévia de um presente real publicado: Manuelly &amp; André."
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
      src="/marketing/product/chaveiro-i-love-you.webp"
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
  "Endereço com o nome de vocês",
  "Chaveiro que abre com um toque",
  "Sempre acessível",
  "Privacidade",
];

const MARQUEE_COLORS = ["#ff6ea8", "#ffb648", "#8b5cf6", "#22c1a3", "#722b45"];

function MarqueeStrip() {
  return (
    <section className="border-y border-border bg-card py-6">
      <Marquee pauseOnHover>
        {MARQUEE_ITEMS.map((item, i) => (
          <span key={item} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Heart
              className="h-3.5 w-3.5"
              style={{ color: MARQUEE_COLORS[i % MARQUEE_COLORS.length] }}
              fill={MARQUEE_COLORS[i % MARQUEE_COLORS.length]}
              fillOpacity={0.25}
            />
            {item}
          </span>
        ))}
      </Marquee>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "1",
      icon: "🎨",
      color: "#ff6ea8",
      title: "Escolha um estilo",
      text: "Um modelo que combine com a ocasião e com a história de vocês.",
    },
    {
      n: "2",
      icon: "💬",
      color: "#ffb648",
      title: "Conte a história de vocês",
      text: "Adicione fotos, datas, mensagens e uma música.",
    },
    {
      n: "3",
      icon: "🎁",
      color: "#8b5cf6",
      title: "Entregue e emocione",
      text: "Mande pelo WhatsApp, ou entregue o coração físico — é só aproximar do celular para abrir.",
    },
  ];
  return (
    <section id="como-funciona" className="scroll-mt-20 border-y border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <BlurFade>
          <h2 className="text-center font-serif text-3xl md:text-4xl">Como funciona</h2>
        </BlurFade>
        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          {/* Linha pontilhada ligando os 3 passos — só no desktop, onde os
              cards ficam lado a lado e a sequência fica visualmente óbvia. */}
          <div
            aria-hidden
            className="absolute top-[3.25rem] right-0 left-0 hidden border-t-2 border-dashed border-border md:block"
          />
          {steps.map((s, i) => (
            <BlurFade key={s.n} delay={i * 0.1}>
              <div className="bg-card relative h-full rounded-3xl border border-border p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-sm"
                  style={{ backgroundColor: `${s.color}26` }}
                >
                  {s.icon}
                </span>
                <span
                  className="absolute top-6 right-6 font-serif text-3xl"
                  style={{ color: s.color }}
                  aria-hidden
                >
                  {s.n}
                </span>
                <h3 className="mt-5 font-serif text-xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.text}</p>
              </div>
            </BlurFade>
          ))}
        </div>
        <BlurFade delay={0.15} className="mt-16">
          <p className="text-center font-serif text-2xl md:text-3xl">Vários estilos para cada história</p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Prévias reais dos modelos — é exatamente isso que seu presente vai parecer.
          </p>
          {/* Rola na horizontal no celular: a borda esvanecida à direita avisa
              que há mais modelos além do que cabe na tela. */}
          <div className="relative mt-10">
            <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-4 sm:justify-center">
              {STYLE_PREVIEWS.map((s, i) => (
                <BlurFade key={s.slug} delay={0.2 + i * 0.08} className="shrink-0 snap-center">
                  <Link href={`/modelos/${s.slug}`} className="group block">
                    <StylePhoneMockup slug={s.slug} label={s.label} />
                    <p className="mt-3 text-center text-sm font-medium text-foreground group-hover:text-primary">
                      {s.label}
                    </p>
                  </Link>
                </BlurFade>
              ))}
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card to-transparent sm:hidden"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground sm:hidden">
            Arraste para o lado para ver todos
          </p>
        </BlurFade>
      </div>
    </section>
  );
}

const STYLE_PREVIEWS = [
  { slug: "romance-classico", label: "Romance" },
  { slug: "nossa-familia", label: "Família" },
  { slug: "melhor-amigo", label: "Pet" },
  { slug: "nosso-sim", label: "Casamento" },
];

function StylePhoneMockup({ slug, label }: { slug: string; label: string }) {
  return (
    <div className="h-[360px] w-[180px] rounded-[2rem] bg-[#1c1719] p-2 shadow-lg ring-1 ring-black/10 transition-transform duration-300 group-hover:-translate-y-1">
      <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/marketing/style-preview/${slug}.webp`}
          alt={`Prévia real do modelo ${label}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute left-1/2 top-1.5 h-3 w-14 -translate-x-1/2 rounded-full bg-black/80" />
      </div>
    </div>
  );
}

function StatsStrip({ templateCount }: { templateCount: number }) {
  const stats = [
    { value: templateCount, label: "modelos", color: "#ff6ea8" },
    { value: 7, label: "nichos para presentear", color: "#ffb648" },
    { value: 30, label: "fotos no Para Sempre", color: "#8b5cf6" },
    { value: 12, label: "momentos na linha do tempo", color: "#22c1a3" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((s, i) => (
          <BlurFade key={s.label} delay={i * 0.08} className="text-center">
            <p className="font-serif text-4xl md:text-5xl" style={{ color: s.color }}>
              <NumberTicker value={s.value} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </BlurFade>
        ))}
      </div>
    </section>
  );
}

const NICHE_DESCRIPTIONS: Record<Niche, string> = {
  romance: "Para celebrar o amor que nos conecta.",
  amizade: "Para amigos que tornam a vida mais leve.",
  familia: "Para guardar nossas raízes e memórias.",
  pet: "Porque eles também fazem parte da história.",
  aniversario: "Para celebrar conquistas e momentos especiais.",
  bebe: "Para eternizar os primeiros momentos de amor.",
  casamento: "Para celebrar o início de uma nova história.",
};

const NICHE_ICONS: Record<Niche, LucideIcon> = {
  romance: Heart,
  amizade: Users,
  familia: Home,
  pet: PawPrint,
  aniversario: Gift,
  bebe: Baby,
  casamento: Gem,
};

const NICHE_COLORS: Record<Niche, string> = {
  romance: "#ff6ea8",
  amizade: "#ffb648",
  familia: "#22c1a3",
  pet: "#f97316",
  aniversario: "#8b5cf6",
  bebe: "#38bdf8",
  casamento: "#722b45",
};

function TemplatesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <BlurFade>
        <h2 className="text-center font-serif text-3xl md:text-4xl">Modelos para cada ocasião</h2>
        <p className="mt-3 text-center text-muted-foreground">
          Escolha o tema que mais combina com a sua história.
        </p>
      </BlurFade>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NICHES.map((niche, i) => {
          const NicheIcon = NICHE_ICONS[niche];
          const color = NICHE_COLORS[niche];
          return (
            <BlurFade key={niche} delay={i * 0.06}>
              <Link
                href={`/modelos?nicho=${niche}`}
                className="group block h-full overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:-translate-y-1.5 hover:shadow-lg hover:[border-color:var(--niche-color)]"
                style={{ "--niche-color": color } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/marketing/niches/${niche}.webp`}
                  alt={NICHE_LABELS[niche]}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="flex items-start gap-3 p-5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    <NicheIcon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-serif text-xl">{NICHE_LABELS[niche]}</span>
                    <span className="text-muted-foreground mt-1 block text-sm leading-5">
                      {NICHE_DESCRIPTIONS[niche]}
                    </span>
                  </span>
                </div>
              </Link>
            </BlurFade>
          );
        })}
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
    { icon: Smartphone, title: "Discreto", text: "Por fora é só um coração. A tecnologia mora escondida dentro dele." },
    { icon: Link2, title: "Sempre atualizado", text: "Mudou algo na história? O coração continua abrindo a versão mais recente." },
    { icon: QrCode, title: "Nunca fica sem acesso", text: "Se o celular não ler o toque, um QR Code no cartão abre a mesma página." },
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
                src="/marketing/product/chaveiro-love.webp"
                alt="Chaveiro coração com NFC — modelo Love"
                loading="lazy"
                decoding="async"
                className="h-28 w-auto rotate-[-6deg] drop-shadow-xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marketing/product/chaveiro-i-love-you.webp"
                alt="Chaveiro coração com NFC — modelo I Love You"
                loading="lazy"
                decoding="async"
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
              Escolha o modelo, coloque as fotos, escreva a mensagem e escolha a música. Pronto para
              presentear no mesmo dia.
            </p>
            <CourtesyBanner className="w-full text-left" />
            <Link
              href="/criar"
              data-analytics="cta_click"
              data-analytics-label="pricing_momento"
              className={buttonVariants({ variant: "shiny", size: "lg" })}
            >
              Garantir agora por {formatBRL(momento.priceCents)}
            </Link>
            <p className="text-xs text-muted-foreground">Preço de lançamento por tempo limitado.</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
              Pagamento seguro processado pelo Mercado Pago
            </p>
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
        // Só entra na lista se o plano realmente permitir momentos — assim o
        // texto acompanha o limite configurado no painel em vez de prometer
        // uma linha do tempo que o plano não tem.
        ...(plan.limits.maxMoments > 0
          ? [`Linha do tempo com ${plan.limits.maxMoments} momentos`]
          : []),
        "1 modelo à sua escolha",
        "Mensagem personalizada e contador de dias",
        "Pronto para enviar no WhatsApp",
      ];
    case "para-sempre":
      return [
        "Sem data de expiração",
        `Até ${plan.limits.maxPhotos} fotos`,
        ...(plan.limits.maxMoments > 0
          ? [`Linha do tempo com ${plan.limits.maxMoments} momentos`]
          : []),
        "Música do Spotify ou YouTube",
        "Endereço com o nome de vocês",
        "Pode editar depois, sempre que quiser",
      ];
    case "kit-coracao-nfc":
      return ["Tudo do Para Sempre", "Chaveiro coração que abre com um toque", "Cartão com acesso garantido, mesmo sem NFC", "Embalagem protegida", "Acompanhamento do pedido"];
    default:
      return [];
  }
}

function PrivacySection() {
  const points = [
    {
      icon: ShieldCheck,
      title: "Pagamento seguro",
      text: "Processado pelo Mercado Pago, sem seus dados de cartão passando pelo nosso servidor.",
    },
    {
      icon: Link2,
      title: "Só quem tem o link vê",
      text: "Seu presente não aparece em buscas nem é indexado por ninguém.",
    },
    {
      icon: Check,
      title: "Você é o dono",
      text: "As fotos são protegidas e podem ser excluídas a qualquer momento, a seu pedido.",
    },
  ];
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <BlurFade>
          <h2 className="text-center font-serif text-2xl md:text-3xl">Segurança e privacidade</h2>
        </BlurFade>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {points.map((p, i) => (
            <BlurFade key={p.title} delay={i * 0.08} className="text-center">
              <p.icon className="mx-auto h-6 w-6 text-success" aria-hidden />
              <p className="mt-3 font-medium">{p.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </BlurFade>
          ))}
        </div>
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
    { q: "E se o celular não tiver NFC?", a: "Sem problema: o cartão acompanha um QR Code reserva que abre o mesmo presente." },
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
