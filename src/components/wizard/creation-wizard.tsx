"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  ImagePlus,
  Lightbulb,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Plus,
  Sparkles,
  ShieldCheck,
  Star,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import {
  applyGeneratedDraft,
  createDraft,
  loadDraft,
  saveDraft,
  updateDraftTemplate,
  type LoadedDraft,
} from "@/app/actions/drafts";
import { finalizePhotoUpload, preparePhotoUpload, uploadPhoto } from "@/app/actions/photos";
import { quoteCoupon, quoteShipping, startCheckout } from "@/app/actions/checkout";
import {
  CardPaymentForm,
  type CardPaymentFormHandle,
  type CardTokenData,
} from "@/components/checkout/card-payment-form";
import {
  DEFAULT_TEMPLATES,
  NICHE_LABELS,
  groupTemplatesByNiche,
  type TemplateDefinition,
} from "@/lib/domain/templates";
import { NICHES } from "@/lib/domain/enums";
import {
  ABSOLUTE_MAX_PROJECT_PHOTOS,
  DEFAULT_PLANS,
  type PlanDefinition,
} from "@/lib/domain/plans";
import type { ProjectContent } from "@/lib/domain/projects";
import { shippingAddressSchema } from "@/lib/domain/checkout";
import type { AiDetailLevel, AiTone, GeneratedGiftDraft } from "@/lib/ai/gift-draft";
import { parseMusicUrl } from "@/lib/domain/music";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TemplateRenderer } from "@/components/templates";
import { TemplateThumbnail } from "@/components/templates/template-thumbnail";
import { resolveExperiencePalette } from "@/components/templates/experience-palette";
import {
  checkoutStorageKey,
  listDraftMemories,
  removeDraftMemory,
  upsertDraftMemory,
  type DraftStep,
} from "@/lib/client/draft-memory";
import { uploadPhotoToSignedUrl } from "@/lib/client/photo-upload";
import { cn, formatBRL } from "@/lib/utils";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const STEPS = [
  "Modelo",
  "Informações",
  "Fotos",
  "Nossa história",
  "Música e detalhes",
  "Prévia e plano",
];

const STEP_DESCRIPTIONS = [
  "Escolha a ocasião e o estilo que mais combinam com essa história.",
  "Dê personalidade ao presente com nomes, título e uma mensagem especial.",
  "Adicione os registros que fazem essa lembrança ganhar vida.",
  "Organize os capítulos mais importantes em uma linha do tempo afetiva.",
  "Escolha a trilha, a frase final e as cores que fecham a experiência.",
  "Revise o resultado, escolha o plano e deixe tudo pronto para presentear.",
];

const AI_PROGRESS_STEPS = [
  "Entendendo a sua história",
  "Escolhendo o melhor estilo",
  "Escrevendo cada detalhe",
  "Preparando a prévia",
];

const AI_BRIEFING_HINTS = [
  { label: "Para quem é", test: /(?:para|minha|meu)\s+/i },
  { label: "Seu nome", test: /(?:meu nome [ée]|eu (?:sou|me chamo)|assinado por)\s+/i },
  { label: "A ocasião", test: /anivers|casamento|bodas|homenage|presente|nascimento|surpresa/i },
  {
    label: "Uma lembrança",
    test: /lembran|viagem|quando|conhec|momento|hist[oó]ria|desde|chegou/i,
  },
] as const;

const RECIPIENT_LABELS: Record<string, string> = {
  romance: "Nome de quem vai receber",
  amizade: "Nome do(a) amigo(a)",
  familia: "Nome de quem recebe",
  pet: "Nome do pet",
  aniversario: "Nome do(a) aniversariante",
  bebe: "Nome do bebê",
  casamento: "Nome de quem recebe",
};

const ADDRESS_FIELD_IDS: Record<keyof CheckoutAddress, string> = {
  recipient: "shipping-recipient",
  cep: "shipping-cep",
  street: "shipping-street",
  number: "shipping-number",
  complement: "shipping-complement",
  neighborhood: "shipping-neighborhood",
  city: "shipping-city",
  state: "shipping-state",
};

const STORY_LABELS: Record<string, string> = {
  romance: "Nossa história",
  amizade: "Nossos momentos",
  familia: "Nossa história",
  pet: "Marcos da vida",
  aniversario: "Momentos especiais",
  bebe: "Primeiros momentos",
  casamento: "Nossa história",
};

const MOMENT_SUGGESTIONS: Record<string, string[]> = {
  romance: ["Como tudo começou", "Nosso primeiro encontro", "Um dia inesquecível"],
  amizade: ["Como a amizade começou", "Aquela viagem", "Uma história que só a gente entende"],
  familia: ["Uma tradição da família", "Um domingo especial", "Uma conquista que celebramos"],
  pet: ["O dia em que chegou", "A primeira aventura", "Uma mania inesquecível"],
  aniversario: ["Uma lembrança da infância", "Uma grande conquista", "Um momento para celebrar"],
  bebe: ["A descoberta", "A chegada", "O primeiro sorriso"],
  casamento: ["Quando nos conhecemos", "O pedido", "O grande dia"],
};

const TITLE_SUGGESTIONS: Record<string, (recipient: string) => string> = {
  romance: (recipient) => `Nossa história, ${recipient}`,
  amizade: (recipient) => `Para ${recipient}, com todas as nossas histórias`,
  familia: (recipient) => `${recipient}, nosso lugar no mundo`,
  pet: (recipient) => `${recipient}, amor de quatro patas`,
  aniversario: (recipient) => `Celebrando a vida de ${recipient}`,
  bebe: (recipient) => `Bem-vindo(a), ${recipient}`,
  casamento: (recipient) => `Uma vida inteira com ${recipient}`,
};

const EMPTY_CONTENT: ProjectContent = {
  schemaVersion: 1,
  niche: "romance",
  creatorName: "",
  recipientName: "",
  title: "",
  relationshipDate: "",
  message: "",
  counterEnabled: true,
  photos: [],
  moments: [],
  music: null,
  finalPhrase: "",
  colorScheme: "vinho",
};

interface WizardPhoto {
  assetId: string;
  url: string;
  altText: string;
  position: number;
  isCover: boolean;
}

interface CheckoutAddress {
  recipient: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

type StoredCheckout = Partial<{
  email: string;
  buyerName: string;
  planSlug: string;
  address: Partial<CheckoutAddress>;
}>;

interface ResumeCandidate {
  token: string;
  draft: LoadedDraft;
  lastStep: DraftStep;
  updatedAt: string;
}

const EMPTY_ADDRESS: CheckoutAddress = {
  recipient: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const CONTENT_FIELD_IDS: Partial<Record<keyof ProjectContent, string>> = {
  creatorName: "creator-name",
  recipientName: "recipient-name",
  title: "page-title",
  music: "music-url",
};

interface CreationWizardProps {
  templates: TemplateDefinition[];
  plans: PlanDefinition[];
  initialTemplateSlug?: string;
  aiEnabled: boolean;
  /** Presente-token de um presente já publicado, reaberto para edição. */
  editDraftToken?: string;
}

export function CreationWizard({
  templates,
  plans,
  initialTemplateSlug,
  aiEnabled,
  editDraftToken,
}: CreationWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draftToken, setDraftToken] = useState<string | null>(null);
  const initialTemplateDefinition =
    templates.find((template) => template.slug === initialTemplateSlug) ??
    templates[0] ??
    DEFAULT_TEMPLATES[0];
  const initialTemplate = initialTemplateDefinition.slug;
  const [templateSlug, setTemplateSlug] = useState(initialTemplate);
  const [content, setContent] = useState<ProjectContent>({
    ...EMPTY_CONTENT,
    niche: initialTemplateDefinition.niche,
    colorScheme: initialTemplateDefinition.presets.defaultScheme,
  });
  const [photos, setPhotos] = useState<WizardPhoto[]>([]);
  const [planSlug, setPlanSlug] = useState(
    plans.find((plan) => plan.slug === "para-sempre")?.slug ?? plans[0]?.slug ?? "para-sempre",
  );
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Só bloqueia a tela quando já se sabe que existe algo para carregar: um
  // link de edição. Quem chega em /criar pela primeira vez — a esmagadora
  // maioria, e todo mundo que vem de anúncio — não tem rascunho nenhum neste
  // aparelho. Se isso começasse sempre em `true`, o HTML do servidor seria
  // uma tela de "procurando suas criações" e o formulário só apareceria
  // depois da hidratação (medido: ~5s em rede boa, ~9s em 4G lento).
  const [resuming, setResuming] = useState(Boolean(editDraftToken));
  const [resumed, setResumed] = useState(false);
  const [resumeCandidates, setResumeCandidates] = useState<ResumeCandidate[]>([]);
  const [resumeLoadFailed, setResumeLoadFailed] = useState(false);
  const [resumeAttempt, setResumeAttempt] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // Edição pós-compra: reabre um presente publicado (Para Sempre / Kit NFC).
  // Pula plano/pagamento no passo final — salva direto, sem nova cobrança.
  const [editMode, setEditMode] = useState(false);
  const [editProjectSlug, setEditProjectSlug] = useState<string | null>(null);
  const saveRequest = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const checkoutToken = useRef<string | null>(null);
  const shippingRequest = useRef(0);
  const wizardTopRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const [musicInput, setMusicInput] = useState("");
  const [email, setEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [checkoutRecovered, setCheckoutRecovered] = useState(false);
  const [method, setMethod] = useState<"PIX" | "CARD" | "CHECKOUT_PRO">("PIX");
  const cardFormRef = useRef<CardPaymentFormHandle>(null);
  const [address, setAddress] = useState<CheckoutAddress>(EMPTY_ADDRESS);
  const [shipping, setShipping] = useState<{
    shippingCents: number;
    estimatedDays: number | null;
    carrier: string | null;
  } | null>(null);
  const [quotingShipping, setQuotingShipping] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [photoDragActive, setPhotoDragActive] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [photoNotice, setPhotoNotice] = useState<{
    tone: "success" | "warning";
    message: string;
  } | null>(null);
  const [removedPhoto, setRemovedPhoto] = useState<{
    photo: WizardPhoto;
    index: number;
    linkedMomentIds: string[];
  } | null>(null);
  const photoRemovalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState<AiTone>("automatico");
  const [aiDetailLevel, setAiDetailLevel] = useState<AiDetailLevel>("equilibrado");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiDemoMode, setAiDemoMode] = useState(false);
  const [aiUndoSnapshot, setAiUndoSnapshot] = useState<{
    templateSlug: string;
    content: ProjectContent;
  } | null>(null);
  const aiRequest = useRef<AbortController | null>(null);
  const reduceMotion = useReducedMotion();
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    planSlug: string;
    email: string;
    discountCents: number;
  } | null>(null);
  const maxPhotos = Math.min(
    ABSOLUTE_MAX_PROJECT_PHOTOS,
    Math.max(...(plans.length > 0 ? plans : DEFAULT_PLANS).map((plan) => plan.limits.maxPhotos)),
  );
  const maxMoments = Math.max(
    ...(plans.length > 0 ? plans : DEFAULT_PLANS).map((plan) => plan.limits.maxMoments),
  );

  const set = useCallback(<K extends keyof ProjectContent>(key: K, value: ProjectContent[K]) => {
    setContent((c) => ({ ...c, [key]: value }));
    const fieldId = CONTENT_FIELD_IDS[key];
    if (fieldId) {
      setFieldErrors((current) => {
        if (!current[fieldId]) return current;
        const next = { ...current };
        delete next[fieldId];
        return next;
      });
    }
  }, []);

  // Edição pós-compra: carrega direto pelo token vindo da URL, sem passar
  // pela lista de rascunhos deste dispositivo (o presente pode ter sido
  // aberto em outro aparelho, via link do e-mail/painel).
  useEffect(() => {
    if (!editDraftToken) return;
    let cancelled = false;
    // O bloqueio já nasce ligado pelo estado inicial: o link de edição diz que
    // existe um presente para abrir, e não há o que mostrar antes dele chegar.
    (async () => {
      try {
        const draft = await loadDraft(editDraftToken);
        if (cancelled) return;
        if (!draft) {
          setError("Não foi possível carregar este presente para edição.");
          return;
        }
        setDraftToken(editDraftToken);
        setTemplateSlug(draft.templateSlug);
        setContent(draft.content);
        setPhotos(
          draft.photos.map((photo) => ({
            assetId: photo.assetId,
            url: photo.url,
            altText: photo.altText,
            position: photo.position,
            isCover: photo.isCover,
          })),
        );
        setEditMode(draft.projectStatus === "PUBLISHED");
        setEditProjectSlug(draft.slug);
        setResumed(true);
        setStep(1);
      } catch {
        if (!cancelled) setError("Não foi possível carregar este presente para edição.");
      } finally {
        if (!cancelled) setResuming(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editDraftToken]);

  // Retoma os rascunhos recentes deste dispositivo sem perder referências anteriores.
  // Em modo de edição (token vindo da URL), o efeito acima já cuida de tudo.
  useEffect(() => {
    if (editDraftToken) return;
    let cancelled = false;
    async function resume() {
      const memories = listDraftMemories(localStorage);
      // Visitante novo: nada para retomar, então nunca segura a tela.
      if (memories.length === 0) return;
      setResuming(true);

      const results = await Promise.all(
        memories.map(async (memory) => {
          try {
            const draft = await withTimeout(loadDraft(memory.token), 7_000);
            return { memory, draft, failed: false as const };
          } catch {
            return { memory, draft: null, failed: true as const };
          }
        }),
      );
      if (cancelled) return;

      const candidates: ResumeCandidate[] = [];
      let failed = false;
      for (const result of results) {
        if (result.failed) {
          failed = true;
          continue;
        }
        if (!result.draft) {
          removeDraftMemory(localStorage, result.memory.token);
          continue;
        }
        const lastStep = result.memory.lastStep === 0 ? 1 : result.memory.lastStep;
        const updatedAt = newestIsoDate(result.memory.updatedAt, result.draft.updatedAt);
        candidates.push({
          token: result.memory.token,
          draft: result.draft,
          lastStep,
          updatedAt,
        });
        upsertDraftMemory(localStorage, {
          token: result.memory.token,
          title: draftDisplayTitle(result.draft.content),
          templateSlug: result.draft.templateSlug,
          updatedAt,
          lastStep,
        });
      }
      candidates.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
      setResumeCandidates(candidates);
      setResumeLoadFailed(failed);
    }
    resume().finally(() => {
      if (!cancelled) setResuming(false);
    });
    return () => {
      cancelled = true;
    };
  }, [initialTemplateSlug, resumeAttempt, editDraftToken]);

  useEffect(() => {
    if (!previewExpanded) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewExpanded(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [previewExpanded]);

  useEffect(() => () => aiRequest.current?.abort(), []);

  useEffect(
    () => () => {
      if (photoRemovalTimer.current) clearTimeout(photoRemovalTimer.current);
    },
    [],
  );

  useEffect(() => {
    checkoutToken.current = null;
    if (!draftToken) return;

    const storageKey = checkoutStorageKey(draftToken);
    const raw = sessionStorage.getItem(storageKey);
    let stored: StoredCheckout | null = null;
    if (raw) {
      try {
        stored = JSON.parse(raw) as StoredCheckout;
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    }
    const defaultPlanSlug =
      plans.find((plan) => plan.slug === "para-sempre")?.slug ?? plans[0]?.slug ?? "para-sempre";
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setEmail(safeStoredText(stored?.email));
      setBuyerName(safeStoredText(stored?.buyerName));
      setPlanSlug(
        stored?.planSlug && plans.some((plan) => plan.slug === stored.planSlug)
          ? stored.planSlug
          : defaultPlanSlug,
      );
      setAddress({
        recipient: safeStoredText(stored?.address?.recipient),
        cep: safeStoredText(stored?.address?.cep),
        street: safeStoredText(stored?.address?.street),
        number: safeStoredText(stored?.address?.number),
        complement: safeStoredText(stored?.address?.complement),
        neighborhood: safeStoredText(stored?.address?.neighborhood),
        city: safeStoredText(stored?.address?.city),
        state: safeStoredText(stored?.address?.state),
      });
      setCouponCode("");
      setAppliedCoupon(null);
      setShipping(null);
      setConsent(false);
      setCheckoutRecovered(Boolean(stored));
      checkoutToken.current = draftToken;
    });
    return () => {
      cancelled = true;
    };
  }, [draftToken, plans]);

  useEffect(() => {
    if (!draftToken || checkoutToken.current !== draftToken) return;
    sessionStorage.setItem(
      checkoutStorageKey(draftToken),
      JSON.stringify({ email, buyerName, planSlug, address }),
    );
  }, [address, buyerName, draftToken, email, planSlug]);

  useEffect(() => {
    if (
      draftToken &&
      checkoutToken.current === draftToken &&
      step === STEPS.length - 1 &&
      !buyerName.trim() &&
      content.creatorName.trim()
    ) {
      queueMicrotask(() => setBuyerName(content.creatorName.trim()));
    }
  }, [buyerName, content.creatorName, draftToken, step]);

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const frame = window.requestAnimationFrame(() => {
      wizardTopRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
      stepHeadingRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [reduceMotion, step]);

  useEffect(() => {
    if (!draftToken || step === 0) return;
    upsertDraftMemory(localStorage, {
      token: draftToken,
      title:
        content.title.trim() ||
        `Presente para ${content.recipientName.trim() || "alguém especial"}`,
      templateSlug,
      lastStep: toDraftStep(step),
    });
  }, [content.recipientName, content.title, draftToken, step, templateSlug]);

  function applyLoadedDraft(candidate: ResumeCandidate) {
    setDraftToken(candidate.token);
    setTemplateSlug(candidate.draft.templateSlug);
    setContent(candidate.draft.content);
    setPhotos(candidate.draft.photos);
    setMusicInput(musicInputHint(candidate.draft.content));
    setResumed(true);
    setAiUndoSnapshot(null);
    setResumeCandidates([]);
    setResumeLoadFailed(false);
    setStep(candidate.lastStep);
  }

  function startFreshDraft() {
    setResumeCandidates([]);
    setResumeLoadFailed(false);
    setResumed(false);
    setError(null);
  }

  function retryResume() {
    setResuming(true);
    setResumeLoadFailed(false);
    setResumeAttempt((current) => current + 1);
  }

  function chooseTemplate(slug: string) {
    setTemplateSlug(slug);
    const template = templates.find((item) => item.slug === slug);
    if (template) {
      setContent((current) => ({
        ...current,
        niche: template.niche,
        colorScheme: template.presets.defaultScheme,
      }));
    }
  }

  async function beginCreation() {
    if (aiBusy) return;
    setBusy(true);
    setError(null);
    setAiGenerated(false);
    setAiDemoMode(false);
    setAiUndoSnapshot(null);
    try {
      if (draftToken) {
        await updateDraftTemplate(draftToken, templateSlug);
      } else {
        const { draftToken: token } = await createDraft(templateSlug);
        upsertDraftMemory(localStorage, {
          token,
          title: draftDisplayTitle(content),
          templateSlug,
          lastStep: 1,
        });
        setDraftToken(token);
      }
      setStep(1);
    } catch (e) {
      setError(friendlyError(e, "Não foi possível iniciar."));
    } finally {
      setBusy(false);
    }
  }

  async function generateWithAi() {
    if (!aiEnabled || aiBusy || busy || aiPrompt.trim().length < 40) return;
    const controller = new AbortController();
    aiRequest.current = controller;
    setAiBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/gift-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          tone: aiTone,
          detailLevel: aiDetailLevel,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as {
        ok: boolean;
        message?: string;
        draft?: GeneratedGiftDraft;
        mode?: "demo" | "deepseek";
      } | null;
      if (!response.ok || !payload?.ok || !payload.draft) {
        throw new Error(payload?.message ?? "Não conseguimos criar o rascunho agora.");
      }

      const generated = payload.draft;
      const generatedTemplate =
        templates.find(
          (candidate) =>
            candidate.slug === generated.templateSlug && candidate.niche === generated.niche,
        ) ??
        templates.find((candidate) => candidate.niche === generated.niche) ??
        templates[0];
      if (!generatedTemplate) throw new Error("Nenhum modelo está disponível no momento.");

      const nextContent: ProjectContent = {
        ...content,
        niche: generatedTemplate.niche,
        creatorName: generated.creatorName,
        recipientName: generated.recipientName,
        title: generated.title,
        relationshipDate: generated.relationshipDate,
        message: generated.message,
        counterEnabled: generatedTemplate.niche === "romance",
        moments: generated.moments.map((moment) => ({
          id: crypto.randomUUID(),
          date: moment.date,
          title: moment.title,
          text: moment.text,
        })),
        finalPhrase: generated.finalPhrase,
        colorScheme: generatedTemplate.presets.colorSchemes.includes(generated.colorScheme)
          ? generated.colorScheme
          : generatedTemplate.presets.defaultScheme,
        photos: photos.map((photo) => ({
          assetId: photo.assetId,
          altText: photo.altText,
          position: photo.position,
          isCover: photo.isCover,
        })),
      };
      await saveQueue.current;
      setAiUndoSnapshot({ templateSlug, content });
      const applied = await applyGeneratedDraft({
        draftToken,
        templateSlug: generatedTemplate.slug,
        content: nextContent,
      });
      const token = applied.draftToken;

      upsertDraftMemory(localStorage, {
        token,
        title: draftDisplayTitle(nextContent),
        templateSlug: generatedTemplate.slug,
        lastStep: 1,
      });
      setDraftToken(token);
      setTemplateSlug(generatedTemplate.slug);
      setContent(nextContent);
      setAiGenerated(true);
      setAiDemoMode(payload.mode === "demo");
      setResumed(false);
      setSaveStatus("saved");
      setStep(1);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(friendlyError(cause, "Não conseguimos criar o rascunho agora."));
    } finally {
      if (aiRequest.current === controller) {
        aiRequest.current = null;
        setAiBusy(false);
      }
    }
  }

  function cancelAiGeneration() {
    aiRequest.current?.abort();
    aiRequest.current = null;
    setAiBusy(false);
  }

  async function undoAiGeneration() {
    if (!aiUndoSnapshot || !draftToken) return;
    setBusy(true);
    setError(null);
    try {
      await applyGeneratedDraft({
        draftToken,
        templateSlug: aiUndoSnapshot.templateSlug,
        content: aiUndoSnapshot.content,
      });
      setTemplateSlug(aiUndoSnapshot.templateSlug);
      setContent(aiUndoSnapshot.content);
      setAiGenerated(false);
      setAiUndoSnapshot(null);
      setSaveStatus("saved");
    } catch (cause) {
      setError(friendlyError(cause, "Não conseguimos desfazer a geração agora."));
    } finally {
      setBusy(false);
    }
  }

  const persist = useCallback(
    (
      nextContent: ProjectContent = content,
      nextPhotos: WizardPhoto[] = photos,
    ): Promise<boolean> => {
      if (!draftToken) return Promise.resolve(false);
      const request = ++saveRequest.current;
      setSaving(true);
      setSaveStatus("saving");
      const task = saveQueue.current.then(async () => {
        try {
          await saveDraft({
            draftToken,
            content: {
              ...nextContent,
              photos: nextPhotos.map((photo) => ({
                assetId: photo.assetId,
                altText: photo.altText,
                position: photo.position,
                isCover: photo.isCover,
              })),
            },
          });
          if (request === saveRequest.current) setSaveStatus("saved");
          return true;
        } catch (e) {
          if (request === saveRequest.current) setSaveStatus("error");
          setError(friendlyError(e, "Falha ao salvar."));
          window.requestAnimationFrame(() => {
            const alert = document.getElementById("wizard-error");
            alert?.scrollIntoView({ behavior: "smooth", block: "center" });
            alert?.focus({ preventScroll: true });
          });
          return false;
        } finally {
          if (request === saveRequest.current) setSaving(false);
        }
      });
      saveQueue.current = task.then(
        () => undefined,
        () => undefined,
      );
      return task;
    },
    [content, draftToken, photos],
  );

  function showValidationError(message: string, elementId: string) {
    if (elementId === "wizard-error") {
      setError(message);
      setFieldErrors({});
    } else {
      setError(null);
      setFieldErrors({ [elementId]: message });
    }
    window.requestAnimationFrame(() => {
      const element = document.getElementById(elementId);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      element?.focus({ preventScroll: true });
    });
  }

  function clearFieldError(elementId: string) {
    setFieldErrors((current) => {
      if (!current[elementId]) return current;
      const next = { ...current };
      delete next[elementId];
      return next;
    });
  }

  function essentialFieldId(): string {
    if (!content.creatorName.trim()) return "creator-name";
    if (!content.recipientName.trim()) return "recipient-name";
    return "page-title";
  }

  useEffect(() => {
    if (!draftToken || resuming || step === 0) return;
    const timer = window.setTimeout(() => {
      setSaveStatus("idle");
      void persist();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [content, draftToken, persist, photos, resuming, step]);

  async function next() {
    if (step === 0) return;
    const validationError = stepValidationMessage(step, content, musicInput);
    if (validationError) {
      showValidationError(validationError, step === 1 ? essentialFieldId() : "music-url");
      return;
    }
    const saved = await persist();
    if (!saved) return;
    setError(null);
    setFieldErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function goToFinalReview() {
    const validationError = stepValidationMessage(1, content, musicInput);
    if (validationError) {
      showValidationError(validationError, essentialFieldId());
      return;
    }
    const saved = await persist();
    if (!saved) return;
    setError(null);
    setFieldErrors({});
    setStep(STEPS.length - 1);
  }

  function back() {
    setError(null);
    setFieldErrors({});
    setCheckoutError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function checkoutActionErrorFocus() {
    window.requestAnimationFrame(() => {
      const alert = document.getElementById("checkout-action-error");
      alert?.scrollIntoView({ behavior: "smooth", block: "center" });
      alert?.focus({ preventScroll: true });
    });
  }

  /** Validações comuns a Pix e cartão, antes de criar a cobrança. */
  function checkoutIsValid(): boolean {
    const validationError = stepValidationMessage(1, content, musicInput);
    if (validationError) {
      showValidationError(validationError, essentialFieldId());
      return false;
    }
    const planIssue = planCompatibilityMessage(selectedPlan, content, photos.length);
    if (planIssue) {
      showValidationError(planIssue, "plan-options");
      return false;
    }
    if (selectedPlan.includesPhysical) {
      const addressIssue = shippingAddressIssue(address);
      if (addressIssue) {
        showValidationError(addressIssue.message, addressIssue.elementId);
        return false;
      }
      if (!shipping) {
        showValidationError(
          "Calcule o frete para confirmar o prazo e o valor da entrega.",
          "shipping-calculate",
        );
        return false;
      }
    }
    if (!consent) {
      showValidationError(
        "Aceite os Termos e a Política de Privacidade para continuar.",
        "checkout-consent",
      );
      return false;
    }
    if (!EMAIL_RE.test(email.trim())) {
      showValidationError("Digite um e-mail válido para receber o acesso.", "checkout-email");
      return false;
    }
    if (buyerName.trim().length < 2) {
      showValidationError("Digite o seu nome com pelo menos 2 caracteres.", "buyer-name");
      return false;
    }
    return true;
  }

  async function handleCheckout() {
    if (!draftToken) return;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    setCheckoutError(null);
    try {
      if (!checkoutIsValid()) return;
      const saved = await persist();
      if (!saved) return;
      const res = await startCheckout({
        draftToken,
        planSlug,
        email,
        name: buyerName,
        method: "PIX",
        couponCode: activeCoupon?.code,
        acceptedTerms: consent,
        shippingAddress: selectedPlan.includesPhysical ? address : undefined,
      });
      if (res.pix) {
        sessionStorage.setItem(`presente-vivo:pix:${res.orderId}`, JSON.stringify(res.pix));
      }
      router.push(`/pagamento/${res.redirect}?order=${res.orderId}`);
    } catch (e) {
      setCheckoutError(friendlyError(e, "Falha ao iniciar o pagamento."));
      checkoutActionErrorFocus();
    } finally {
      setBusy(false);
    }
  }

  /** Roda as validações e persiste o rascunho; o token do cartão chega depois,
   * de forma assíncrona, via `onTokenized` do Card Form do Mercado Pago. */
  async function handleCardSubmit() {
    if (!draftToken) return;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    setCheckoutError(null);
    if (!checkoutIsValid()) {
      setBusy(false);
      return;
    }
    const saved = await persist();
    if (!saved) {
      setBusy(false);
      return;
    }
    cardFormRef.current?.submit();
  }

  async function handleCardTokenized(card: CardTokenData) {
    if (!draftToken) {
      setBusy(false);
      return;
    }
    try {
      const res = await startCheckout({
        draftToken,
        planSlug,
        email,
        name: buyerName,
        method: "CARD",
        card,
        couponCode: activeCoupon?.code,
        acceptedTerms: consent,
        shippingAddress: selectedPlan.includesPhysical ? address : undefined,
      });
      router.push(`/pagamento/${res.redirect}?order=${res.orderId}`);
    } catch (e) {
      setCheckoutError(friendlyError(e, "Falha ao processar o pagamento com cartão."));
      checkoutActionErrorFocus();
    } finally {
      setBusy(false);
    }
  }

  function handleCardError(message: string) {
    setCheckoutError(message);
    checkoutActionErrorFocus();
    setBusy(false);
  }

  /** Checkout Pro: cria a preferência e leva a pessoa para a página de
   * pagamento hospedada pelo Mercado Pago (Pix, cartão, boleto, saldo...). */
  async function handleCheckoutProSubmit() {
    if (!draftToken) return;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    setCheckoutError(null);
    try {
      if (!checkoutIsValid()) return;
      const saved = await persist();
      if (!saved) return;
      const res = await startCheckout({
        draftToken,
        planSlug,
        email,
        name: buyerName,
        method: "CHECKOUT_PRO",
        couponCode: activeCoupon?.code,
        acceptedTerms: consent,
        shippingAddress: selectedPlan.includesPhysical ? address : undefined,
      });
      if (res.redirectUrl) {
        window.location.assign(res.redirectUrl);
        return;
      }
      router.push(`/pagamento/${res.redirect}?order=${res.orderId}`);
    } catch (e) {
      setCheckoutError(friendlyError(e, "Falha ao iniciar o pagamento pelo Mercado Pago."));
      checkoutActionErrorFocus();
    } finally {
      setBusy(false);
    }
  }

  /** Edição pós-compra: salva o conteúdo já publicado, sem gerar nova cobrança. */
  async function handleSaveEdits() {
    if (!draftToken) return;
    setBusy(true);
    setError(null);
    setCheckoutError(null);
    try {
      const saved = await persist();
      if (!saved) return;
      router.push(editProjectSlug ? `/presente/${editProjectSlug}` : "/painel/presentes");
    } catch (e) {
      setCheckoutError(friendlyError(e, "Falha ao salvar as alterações."));
      checkoutActionErrorFocus();
    } finally {
      setBusy(false);
    }
  }

  async function calculateShipping() {
    const request = ++shippingRequest.current;
    setQuotingShipping(true);
    setShippingError(null);
    clearFieldError("shipping-calculate");
    try {
      const result = await quoteShipping(address.cep);
      if (request !== shippingRequest.current) return;
      setShipping(result);
    } catch (e) {
      if (request === shippingRequest.current) {
        setShipping(null);
        setShippingError(friendlyError(e, "Não foi possível calcular o frete."));
      }
    } finally {
      if (request === shippingRequest.current) setQuotingShipping(false);
    }
  }

  async function applyCoupon() {
    setCouponBusy(true);
    setCouponError(null);
    try {
      const result = await quoteCoupon({ code: couponCode, planSlug, email });
      setCouponCode(result.code);
      setAppliedCoupon({
        code: result.code,
        planSlug,
        email: email.trim().toLowerCase(),
        discountCents: result.discountCents,
      });
    } catch (e) {
      setAppliedCoupon(null);
      setCouponError(friendlyError(e, "Não foi possível aplicar o cupom."));
    } finally {
      setCouponBusy(false);
    }
  }

  function updateAddress<K extends keyof CheckoutAddress>(key: K, value: CheckoutAddress[K]) {
    setAddress((current) => ({ ...current, [key]: value }));
    clearFieldError(ADDRESS_FIELD_IDS[key]);
    if (key === "cep") {
      shippingRequest.current += 1;
      setShipping(null);
      setQuotingShipping(false);
      setShippingError(null);
      clearFieldError("shipping-calculate");
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !draftToken) return;
    const available = Math.max(0, maxPhotos - photos.length);
    if (available === 0) {
      setPhotoNotice({
        tone: "warning",
        message: `Você já adicionou o limite de ${maxPhotos} fotos.`,
      });
      return;
    }

    const chosenFiles = Array.from(files);
    const tooLarge = chosenFiles.filter((file) => file.size > MAX_PHOTO_BYTES);
    const unsupported = chosenFiles.filter(
      (file) => file.size <= MAX_PHOTO_BYTES && !isSupportedImageFile(file),
    );
    const validFiles = chosenFiles.filter(
      (file) => file.size <= MAX_PHOTO_BYTES && isSupportedImageFile(file),
    );
    const selectedFiles = validFiles.slice(0, available);
    const overLimit = Math.max(0, validFiles.length - selectedFiles.length);
    if (selectedFiles.length === 0) {
      const reason =
        tooLarge.length > 0
          ? `${tooLarge.length} foto(s) ultrapassam 15 MB.`
          : unsupported.length > 0
            ? "Use fotos JPEG, PNG, WebP ou HEIC."
            : "Nenhuma foto pôde ser adicionada.";
      setPhotoNotice({ tone: "warning", message: reason });
      return;
    }

    setError(null);
    setPhotoNotice(null);
    setBusy(true);
    setPhotoUploadProgress({ current: 1, total: selectedFiles.length });
    const added: WizardPhoto[] = [];
    let failed = 0;
    for (const [fileIndex, file] of selectedFiles.entries()) {
      setPhotoUploadProgress({ current: fileIndex + 1, total: selectedFiles.length });
      const fd = new FormData();
      fd.set("draftToken", draftToken);
      fd.set("file", file);
      try {
        const prepared = await preparePhotoUpload({
          draftToken,
          sizeBytes: file.size,
          mimeType: file.type,
        });
        const res =
          prepared.mode === "direct"
            ? await (async () => {
                await uploadPhotoToSignedUrl(prepared.uploadUrl, file, prepared.bodyMode);
                return finalizePhotoUpload({ draftToken, assetId: prepared.assetId });
              })()
            : await uploadPhoto(fd);
        added.push({
          assetId: res.assetId,
          url: res.url,
          altText: "",
          position: photos.length + added.length,
          isCover: photos.every((photo) => !photo.isCover) && added.length === 0,
        });
      } catch {
        failed += 1;
      }
    }
    const nextPhotos = [...photos, ...added];
    setPhotos(nextPhotos);
    setBusy(false);
    setPhotoUploadProgress(null);
    const saved = added.length === 0 || (await persist(content, nextPhotos));

    const notes: string[] = [];
    if (added.length > 0) {
      notes.push(
        `${added.length} ${added.length === 1 ? "foto adicionada" : "fotos adicionadas"}.`,
      );
    }
    if (tooLarge.length > 0) notes.push(`${tooLarge.length} acima de 15 MB.`);
    if (unsupported.length > 0) notes.push(`${unsupported.length} em formato não aceito.`);
    if (overLimit > 0) notes.push(`${overLimit} além do limite deste presente.`);
    if (failed > 0) notes.push(`${failed} não puderam ser processadas.`);
    if (!saved) notes.push("Vamos tentar salvar a galeria novamente em instantes.");
    setPhotoNotice({
      tone:
        tooLarge.length + unsupported.length + overLimit + failed > 0 || !saved
          ? "warning"
          : "success",
      message: notes.join(" "),
    });
  }

  function removePhoto(assetId: string) {
    const index = photos.findIndex((photo) => photo.assetId === assetId);
    const photo = photos[index];
    if (!photo) return;
    const linkedMomentIds = content.moments
      .filter((moment) => moment.assetId === assetId)
      .map((moment) => moment.id);
    if (photoRemovalTimer.current) clearTimeout(photoRemovalTimer.current);
    setRemovedPhoto({ photo, index, linkedMomentIds });
    setPhotos((previous) => {
      const removedWasCover = previous.find((photo) => photo.assetId === assetId)?.isCover;
      const remaining = previous
        .filter((photo) => photo.assetId !== assetId)
        .map((photo, index) => ({ ...photo, position: index }));
      if (remaining.length > 0 && (removedWasCover || remaining.every((photo) => !photo.isCover))) {
        remaining[0] = { ...remaining[0], isCover: true };
      }
      return remaining;
    });
    if (linkedMomentIds.length > 0) {
      set(
        "moments",
        content.moments.map((moment) =>
          moment.assetId === assetId ? { ...moment, assetId: undefined } : moment,
        ),
      );
    }
    setPhotoNotice({
      tone: "warning",
      message:
        linkedMomentIds.length > 0
          ? `Foto removida e desvinculada de ${linkedMomentIds.length} ${linkedMomentIds.length === 1 ? "momento" : "momentos"}.`
          : "Foto removida.",
    });
    photoRemovalTimer.current = setTimeout(() => {
      setRemovedPhoto(null);
      photoRemovalTimer.current = null;
    }, 10_000);
  }

  function undoPhotoRemoval() {
    if (!removedPhoto) return;
    const { photo, index, linkedMomentIds } = removedPhoto;
    setPhotos((previous) => {
      const next = [...previous];
      next.splice(Math.min(index, next.length), 0, photo);
      return next.map((item, position) => ({
        ...item,
        position,
        isCover: photo.isCover ? item.assetId === photo.assetId : item.isCover,
      }));
    });
    if (linkedMomentIds.length > 0) {
      set(
        "moments",
        content.moments.map((moment) =>
          linkedMomentIds.includes(moment.id) && !moment.assetId
            ? { ...moment, assetId: photo.assetId }
            : moment,
        ),
      );
    }
    if (photoRemovalTimer.current) clearTimeout(photoRemovalTimer.current);
    photoRemovalTimer.current = null;
    setRemovedPhoto(null);
    setPhotoNotice({ tone: "success", message: "Foto restaurada na galeria." });
  }

  function setCover(assetId: string) {
    setPhotos((prev) => prev.map((p) => ({ ...p, isCover: p.assetId === assetId })));
    setPhotoNotice({ tone: "success", message: "Nova foto de capa escolhida." });
  }

  function movePhoto(assetId: string, dir: "up" | "down") {
    const index = photos.findIndex((photo) => photo.assetId === assetId);
    if (index === -1) return;
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    setPhotos(next.map((photo, position) => ({ ...photo, position })));
    setPhotoNotice({
      tone: "success",
      message: `Foto movida para a posição ${target + 1}.`,
    });
  }

  function updateAlt(assetId: string, altText: string) {
    setPhotos((prev) => prev.map((p) => (p.assetId === assetId ? { ...p, altText } : p)));
  }

  function addMoment(title = "") {
    if (content.moments.length >= maxMoments) return;
    set("moments", [...content.moments, { id: crypto.randomUUID(), date: "", title, text: "" }]);
  }

  const template =
    templates.find((t) => t.slug === templateSlug) ?? templates[0] ?? DEFAULT_TEMPLATES[0];
  const selectedPlan = plans.find((plan) => plan.slug === planSlug) ?? plans[0] ?? DEFAULT_PLANS[0];
  const activeCoupon =
    appliedCoupon?.planSlug === planSlug &&
    appliedCoupon.email === email.trim().toLowerCase() &&
    appliedCoupon.code === couponCode.trim().toUpperCase()
      ? appliedCoupon
      : null;
  const checkoutTotalCents =
    selectedPlan.priceCents -
    (activeCoupon?.discountCents ?? 0) +
    (selectedPlan.includesPhysical ? (shipping?.shippingCents ?? 0) : 0);
  const previewContent: ProjectContent = {
    ...content,
    creatorName: content.creatorName || "Seu nome",
    recipientName: content.recipientName || "Pessoa especial",
    title: content.title || "Uma história inesquecível",
  };
  const requiredFieldsCompleted = [
    content.creatorName,
    content.recipientName,
    content.title,
  ].filter((value) => value.trim().length > 0).length;
  const missingEssentialFields = [
    !content.creatorName.trim() ? "seu nome" : null,
    !content.recipientName.trim() ? "o nome de quem recebe" : null,
    !content.title.trim() ? "o título" : null,
  ].filter((value): value is string => Boolean(value));
  const titleSuggestion = (TITLE_SUGGESTIONS[template.niche] ?? TITLE_SUGGESTIONS.romance)(
    content.recipientName.trim() || "alguém especial",
  );
  const continueLabel =
    step === 2 && photos.length === 0
      ? "Continuar sem fotos"
      : step === 3 && content.moments.length === 0
        ? "Continuar sem momentos"
        : step === 4 && !content.music && !content.finalPhrase
          ? "Revisar sem música"
          : `Continuar para ${STEPS[step + 1] ?? "revisão"}`;
  const interactionBusy = busy || aiBusy || saving;

  if (resuming) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16" role="status">
        <div className="border-border bg-card overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-9">
          <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          </div>
          <p className="text-primary mt-6 text-xs font-semibold tracking-[0.18em] uppercase">
            Procurando suas criações
          </p>
          <h1 className="mt-2 font-serif text-3xl">Só um instante…</h1>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Estamos buscando seus presentes salvos com segurança neste dispositivo.
          </p>
          <div className="mt-7 space-y-3" aria-hidden>
            <div className="bg-secondary h-20 animate-pulse rounded-2xl" />
            <div className="bg-secondary/70 h-20 animate-pulse rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (resumeLoadFailed && resumeCandidates.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="border-primary/20 from-primary/10 via-card to-accent/10 overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-lg sm:p-9">
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
            Seus rascunhos continuam seguros
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">
            Não conseguimos buscar suas criações agora
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6 sm:text-base">
            A referência foi preservada. Tente novamente ou comece outro presente sem apagar os
            anteriores.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button type="button" size="lg" onClick={retryResume}>
              Tentar novamente
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={startFreshDraft}
              data-analytics="cta_click"
              data-analytics-label="draft_start_new_after_error"
            >
              <Plus className="h-4 w-4" /> Criar outro presente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (resumeCandidates.length > 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="border-primary/20 from-primary/10 via-card to-accent/10 overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-lg sm:p-9">
          <div className="bg-primary/15 text-primary flex h-12 w-12 items-center justify-center rounded-2xl">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-primary mt-6 text-xs font-semibold tracking-[0.18em] uppercase">
            {resumeCandidates.length === 1
              ? "Encontramos sua criação"
              : `Encontramos ${resumeCandidates.length} criações`}
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Quer continuar de onde parou?</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-6 sm:text-base">
            Escolha um presente para voltar exatamente à etapa em que parou, ou comece uma nova
            história.
          </p>

          <div className="mt-7 space-y-3">
            {resumeCandidates.map((candidate, index) => {
              const savedContent = candidate.draft.content;
              const savedTemplate =
                templates.find((item) => item.slug === candidate.draft.templateSlug)?.name ??
                "Presente personalizado";
              return (
                <div
                  key={candidate.token}
                  className="border-border bg-background/70 rounded-2xl border p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-serif text-xl">
                        {draftDisplayTitle(savedContent)}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {savedTemplate}
                        {savedContent.recipientName ? ` · Para ${savedContent.recipientName}` : ""}
                      </p>
                      <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <span>{STEPS[candidate.lastStep]}</span>
                        <span aria-hidden>·</span>
                        <span>{formatDraftAge(candidate.updatedAt)}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {candidate.draft.photos.length} fotos · {savedContent.moments.length}{" "}
                          momentos
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={index === 0 ? "default" : "secondary"}
                      className="shrink-0"
                      data-analytics="cta_click"
                      data-analytics-label={`draft_resume_step_${candidate.lastStep + 1}`}
                      onClick={() => applyLoadedDraft(candidate)}
                    >
                      {resumeActionLabel(candidate.lastStep)} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {resumeLoadFailed && (
            <div className="border-border bg-background/60 text-muted-foreground mt-4 flex flex-col gap-3 rounded-xl border px-4 py-3 text-xs leading-5 sm:flex-row sm:items-center sm:justify-between">
              <p>Uma criação não pôde ser carregada agora, mas sua referência foi mantida.</p>
              <Button type="button" variant="ghost" size="sm" onClick={retryResume}>
                Tentar buscar agora
              </Button>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={startFreshDraft}
              data-analytics="cta_click"
              data-analytics-label="draft_start_new"
            >
              <Plus className="h-4 w-4" /> Começar uma nova criação
            </Button>
            <p className="text-muted-foreground max-w-sm text-xs leading-5">
              Seus outros rascunhos continuarão disponíveis neste dispositivo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStepLabel =
    step === 5 && editMode
      ? "Revisar e salvar"
      : step === 0 && aiEnabled
        ? "Vamos criar algo inesquecível"
        : step === 3
          ? (STORY_LABELS[template.niche] ?? STEPS[step])
          : STEPS[step];
  const currentStepDescription =
    step === 5 && editMode
      ? "Edite o que quiser e salve — seu presente já está pago e publicado."
      : step === 0 && aiEnabled
        ? "Conte sua história para a IA ou escolha cada detalhe manualmente."
        : STEP_DESCRIPTIONS[step];

  return (
    <div
      ref={wizardTopRef}
      className="mx-auto w-full max-w-[1500px] scroll-mt-20 px-4 py-6 sm:px-6 sm:py-10 lg:px-8"
    >
      {/* Contexto e progresso */}
      <header className="border-border bg-card/70 mb-6 overflow-hidden rounded-3xl border p-4 shadow-sm backdrop-blur sm:p-6">
        <div className="flex items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-primary flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Seu presente, do seu jeito
            </p>
            <h1
              ref={stepHeadingRef}
              tabIndex={-1}
              className="text-foreground mt-2 font-serif text-2xl outline-none sm:text-3xl"
            >
              {currentStepLabel}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm leading-6">
              {currentStepDescription}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="border-border bg-background rounded-full border px-3 py-1.5 text-xs font-medium">
              {step + 1} de {STEPS.length}
            </p>
            {draftToken && step > 0 && (
              <p className="mt-2 text-xs" aria-live="polite">
                {saveStatus === "saving" && (
                  <span className="text-muted-foreground">Salvando…</span>
                )}
                {saveStatus === "saved" && <span className="text-success">Rascunho salvo</span>}
                {saveStatus === "error" && <span className="text-error">Falha ao salvar</span>}
              </p>
            )}
          </div>
        </div>

        <div
          className="mt-5 flex gap-1.5"
          role="progressbar"
          aria-label="Progresso da criação"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-valuetext={`${currentStepLabel}, etapa ${step + 1} de ${STEPS.length}`}
        >
          {STEPS.map((label, index) => (
            <div key={label} className="min-w-0 flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-300",
                  index <= step ? "from-primary to-accent bg-gradient-to-r" : "bg-secondary",
                )}
              />
              <p
                className={cn(
                  "mt-2 hidden truncate text-[11px] 2xl:block",
                  index === step ? "text-foreground font-medium" : "text-muted-foreground",
                )}
                aria-current={index === step ? "step" : undefined}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,720px)_minmax(480px,1fr)] xl:items-start xl:gap-8">
        <section className="min-w-0" aria-label={`Etapa atual: ${currentStepLabel}`}>
          {resumed && step > 0 && (
            <p
              className="bg-success/10 text-success mb-5 rounded-xl px-4 py-3 text-sm"
              role="status"
            >
              Rascunho retomado em {STEPS[step].toLocaleLowerCase()}. Suas alterações continuam
              salvas neste dispositivo.
            </p>
          )}

          {aiGenerated && step === 1 && (
            <div
              className="border-primary/20 from-primary/10 via-card to-accent/10 mb-5 rounded-2xl border bg-gradient-to-br p-4 sm:p-5"
              role="status"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/15 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Sparkles className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Seu rascunho ganhou vida.</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    A IA escolheu <strong className="text-foreground">{template.name}</strong>,
                    escreveu a base e ajustou o visual. Agora você dá o toque final.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2" aria-label="O que a IA preparou">
                    {["Modelo escolhido", "Texto criado", "Cores combinadas"].map((item) => (
                      <span
                        key={item}
                        className="border-primary/15 bg-background/70 text-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
                      >
                        <Check className="text-success h-3 w-3" aria-hidden /> {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-primary/15 mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-xs leading-5">
                  {missingEssentialFields.length > 0
                    ? `Para continuar, falta apenas ${missingEssentialFields.join(" e ")}.`
                    : "Os dados essenciais já estão preenchidos. Revise e continue quando quiser."}
                  {aiDemoMode ? " Esta prévia usa a simulação local da IA." : ""}
                </p>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {aiUndoSnapshot && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={undoAiGeneration}
                    >
                      Desfazer IA
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => setStep(0)}
                  >
                    <WandSparkles className="h-3.5 w-3.5" aria-hidden /> Criar outra versão
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p
              id="wizard-error"
              className="border-error/30 bg-error/10 text-error mb-4 rounded-xl border px-4 py-2 text-sm"
              role="alert"
              tabIndex={-1}
            >
              {error}
            </p>
          )}

          {step === 0 && aiEnabled && (
            <AiDraftComposer
              value={aiPrompt}
              tone={aiTone}
              detailLevel={aiDetailLevel}
              busy={interactionBusy}
              generating={aiBusy}
              onChange={setAiPrompt}
              onToneChange={setAiTone}
              onDetailLevelChange={setAiDetailLevel}
              onGenerate={generateWithAi}
              onCancel={cancelAiGeneration}
            />
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              // A barra de ação fica fixa no rodapé no celular e flutua por
              // cima do conteúdo. Esta folga garante que o fim do passo sempre
              // consiga rolar para fora de baixo dela — sem isso, o campo de
              // texto do passo 1 nascia com mais da metade escondido.
              // O scroll-mb faz o navegador parar o campo focado acima da
              // barra de ação quando o teclado do celular abre — sem ele o
              // campo em foco pode nascer escondido atrás dela.
              className="[&_input]:scroll-mb-28 [&_textarea]:scroll-mb-28 sm:[&_input]:scroll-mb-0 sm:[&_textarea]:scroll-mb-0"
              initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduceMotion ? 0 : -24 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
            >
              {step === 0 && (
                <>
                  {aiEnabled ? (
                    <details className="border-border bg-card group rounded-2xl border">
                      <summary className="hover:text-primary flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-medium transition-colors sm:p-5 [&::-webkit-details-marker]:hidden">
                        <span>
                          Prefiro escolher o modelo manualmente
                          <span className="text-muted-foreground mt-1 block text-xs font-normal">
                            Selecionado agora: {template.name}
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="border-border border-t p-4 sm:p-5">
                        <Step0
                          selected={templateSlug}
                          onSelect={chooseTemplate}
                          busy={interactionBusy}
                          templates={templates}
                        />
                      </div>
                    </details>
                  ) : (
                    <Step0
                      selected={templateSlug}
                      onSelect={chooseTemplate}
                      busy={interactionBusy}
                      templates={templates}
                    />
                  )}
                </>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div className="border-border bg-card flex items-center justify-between gap-4 rounded-2xl border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Informações essenciais</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Os outros detalhes podem ser adicionados depois.
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{requiredFieldsCompleted}/3</p>
                      <p className="text-muted-foreground text-[11px]">preenchidas</p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Seu nome (quem cria)" htmlFor="creator-name" required>
                      <Input
                        id="creator-name"
                        autoComplete="name"
                        maxLength={120}
                        required
                        aria-invalid={Boolean(fieldErrors["creator-name"])}
                        aria-describedby={
                          fieldErrors["creator-name"] ? "creator-name-error" : undefined
                        }
                        placeholder="Ex.: Ana"
                        value={content.creatorName}
                        onChange={(e) => set("creatorName", e.target.value)}
                      />
                      <FieldError id="creator-name-error" message={fieldErrors["creator-name"]} />
                    </Field>
                    <Field
                      label={RECIPIENT_LABELS[template.niche] ?? "Nome de quem vai receber"}
                      htmlFor="recipient-name"
                      required
                    >
                      <Input
                        id="recipient-name"
                        maxLength={120}
                        required
                        aria-invalid={Boolean(fieldErrors["recipient-name"])}
                        aria-describedby={
                          fieldErrors["recipient-name"] ? "recipient-name-error" : undefined
                        }
                        placeholder="Ex.: Lucas"
                        value={content.recipientName}
                        onChange={(e) => set("recipientName", e.target.value)}
                      />
                      <FieldError
                        id="recipient-name-error"
                        message={fieldErrors["recipient-name"]}
                      />
                    </Field>
                  </div>

                  <Field label="Título da página" htmlFor="page-title" required>
                    <Input
                      id="page-title"
                      maxLength={120}
                      required
                      aria-invalid={Boolean(fieldErrors["page-title"])}
                      aria-describedby={fieldErrors["page-title"] ? "page-title-error" : undefined}
                      placeholder="Ex.: A nossa melhor história"
                      value={content.title}
                      onChange={(e) => set("title", e.target.value)}
                    />
                    <FieldError id="page-title-error" message={fieldErrors["page-title"]} />
                    <button
                      type="button"
                      onClick={() => set("title", titleSuggestion)}
                      className="text-primary mt-2 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                    >
                      <WandSparkles className="h-3.5 w-3.5" aria-hidden /> Usar sugestão: “
                      {titleSuggestion}”
                    </button>
                  </Field>
                  {template.niche === "romance" && (
                    <Field label="Início do relacionamento" htmlFor="relationship-date">
                      <Input
                        id="relationship-date"
                        type="date"
                        value={content.relationshipDate}
                        onChange={(e) => set("relationshipDate", e.target.value)}
                      />
                    </Field>
                  )}
                  <Field label="Mensagem principal" htmlFor="main-message">
                    <Textarea
                      id="main-message"
                      maxLength={5000}
                      placeholder="Escreva como você falaria com essa pessoa. Uma lembrança, um agradecimento ou algo que sempre quis dizer…"
                      value={content.message}
                      onChange={(e) => set("message", e.target.value)}
                      rows={5}
                    />
                    <p className="text-muted-foreground mt-1 text-right text-[11px]">
                      {content.message.length.toLocaleString("pt-BR")}/5.000
                    </p>
                  </Field>
                  {template.niche === "romance" && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={content.counterEnabled}
                        onChange={(e) => set("counterEnabled", e.target.checked)}
                        className="h-4 w-4"
                      />
                      Mostrar contador “Juntos há…”
                    </label>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="border-border bg-card rounded-3xl border p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">Sua galeria</p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Escolha a capa e organize as fotos na ordem da história.
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {photos.length}/{maxPhotos} fotos
                      </Badge>
                    </div>
                    <input
                      id="gift-photos"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                      multiple
                      disabled={interactionBusy || !draftToken || photos.length >= maxPhotos}
                      aria-describedby="photo-upload-help photo-upload-status"
                      onChange={(event) => {
                        const files = event.currentTarget.files;
                        void handleFiles(files);
                        event.currentTarget.value = "";
                      }}
                      className="sr-only"
                    />
                    <label
                      htmlFor="gift-photos"
                      aria-disabled={interactionBusy || !draftToken || photos.length >= maxPhotos}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        if (!interactionBusy && photos.length < maxPhotos) setPhotoDragActive(true);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDragLeave={(event) => {
                        if (
                          !(event.relatedTarget instanceof Node) ||
                          !event.currentTarget.contains(event.relatedTarget)
                        ) {
                          setPhotoDragActive(false);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setPhotoDragActive(false);
                        if (!interactionBusy && photos.length < maxPhotos) {
                          void handleFiles(event.dataTransfer.files);
                        }
                      }}
                      className={cn(
                        "border-primary/25 bg-primary/5 hover:border-primary hover:bg-primary/10 mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-8 text-center transition-colors",
                        photoDragActive && "border-primary bg-primary/10 ring-primary/15 ring-4",
                        (interactionBusy || !draftToken || photos.length >= maxPhotos) &&
                          "pointer-events-none opacity-55",
                      )}
                    >
                      {photoUploadProgress ? (
                        <Loader2 className="text-primary h-7 w-7 animate-spin" aria-hidden />
                      ) : (
                        <ImagePlus className="text-primary h-7 w-7" aria-hidden />
                      )}
                      <span className="mt-3 text-sm font-semibold">
                        {photoUploadProgress
                          ? `Enviando ${photoUploadProgress.current} de ${photoUploadProgress.total}…`
                          : photoDragActive
                            ? "Solte as fotos aqui"
                            : photos.length >= maxPhotos
                              ? "Limite de fotos alcançado"
                              : photos.length > 0
                                ? "Adicionar mais fotos"
                                : "Escolher ou arrastar fotos"}
                      </span>
                      <span id="photo-upload-help" className="text-muted-foreground mt-1 text-xs">
                        JPEG, PNG, WebP ou HEIC · até 15 MB cada
                      </span>
                    </label>
                    <div id="photo-upload-status" aria-live="polite">
                      {photoNotice && (
                        <div
                          className={cn(
                            "mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs leading-5",
                            photoNotice.tone === "success"
                              ? "bg-success/10 text-success"
                              : "bg-accent/10 text-foreground",
                          )}
                        >
                          <p>{photoNotice.message}</p>
                          {removedPhoto && (
                            <button
                              type="button"
                              onClick={undoPhotoRemoval}
                              className="font-semibold underline underline-offset-4"
                            >
                              Desfazer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {photos.length > 0 && (
                    <ul
                      className="grid grid-cols-2 gap-4 sm:grid-cols-3"
                      aria-label="Fotos adicionadas"
                    >
                      {photos.map((p, i) => (
                        <li key={p.assetId} className="group min-w-0">
                          <div className="relative overflow-hidden rounded-2xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.url}
                              alt={p.altText}
                              className="aspect-[3/4] w-full object-cover"
                            />
                            {p.isCover && <Badge className="absolute top-2 left-2">Capa</Badge>}
                            <div className="absolute bottom-2 left-2 flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => movePhoto(p.assetId, "up")}
                                disabled={i === 0}
                                className="bg-card/90 inline-flex h-11 w-11 items-center justify-center rounded-full shadow-sm disabled:opacity-40"
                                title="Mover antes"
                                aria-label={`Mover foto ${i + 1} para antes`}
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => movePhoto(p.assetId, "down")}
                                disabled={i === photos.length - 1}
                                className="bg-card/90 inline-flex h-11 w-11 items-center justify-center rounded-full shadow-sm disabled:opacity-40"
                                title="Mover depois"
                                aria-label={`Mover foto ${i + 1} para depois`}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setCover(p.assetId)}
                                disabled={p.isCover}
                                aria-pressed={p.isCover}
                                className={cn(
                                  "inline-flex h-11 w-11 items-center justify-center rounded-full text-xs shadow-sm transition-colors",
                                  p.isCover
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card/90 hover:text-primary",
                                )}
                                title={p.isCover ? "Esta é a capa" : "Usar como capa"}
                                aria-label={
                                  p.isCover
                                    ? `Foto ${i + 1} é a capa`
                                    : `Definir foto ${i + 1} como capa`
                                }
                              >
                                <Star
                                  className="h-3.5 w-3.5"
                                  fill={p.isCover ? "currentColor" : "none"}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => removePhoto(p.assetId)}
                                className="bg-card/90 hover:text-error inline-flex h-11 w-11 items-center justify-center rounded-full shadow-sm"
                                title="Remover"
                                aria-label={`Remover foto ${i + 1}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <input
                            value={p.altText}
                            aria-label={`Descrição da foto ${i + 1}`}
                            maxLength={200}
                            onChange={(e) => updateAlt(p.assetId, e.target.value)}
                            placeholder="Descrição da foto (opcional)"
                            className="border-border bg-card mt-2 h-9 w-full rounded-lg border px-2.5 text-xs"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  {content.moments.length === 0 && (
                    <div className="border-primary/20 bg-primary/5 rounded-3xl border p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                          <Lightbulb className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                          <p className="font-medium">Não sabe por onde começar?</p>
                          <p className="text-muted-foreground mt-1 text-sm leading-6">
                            Escolha uma ideia abaixo. Você pode mudar o título e escrever do seu
                            jeito.
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {(MOMENT_SUGGESTIONS[template.niche] ?? MOMENT_SUGGESTIONS.romance).map(
                          (suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => addMoment(suggestion)}
                              className="border-border bg-card hover:border-primary hover:text-primary rounded-full border px-3.5 py-2 text-xs font-medium transition-colors"
                            >
                              <Plus className="mr-1 inline h-3.5 w-3.5" aria-hidden /> {suggestion}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {content.moments.map((m, i) => (
                    <div key={m.id} className="border-border rounded-2xl border p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Momento {i + 1}</p>
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "moments",
                              content.moments.filter((x) => x.id !== m.id),
                            )
                          }
                          className="text-muted-foreground hover:text-error"
                          aria-label={`Remover momento ${i + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 space-y-3">
                        <Input
                          aria-label={`Data do momento ${i + 1}`}
                          placeholder="Data (ex.: 14 de junho)"
                          value={m.date ?? ""}
                          onChange={(e) =>
                            set(
                              "moments",
                              content.moments.map((x) =>
                                x.id === m.id ? { ...x, date: e.target.value } : x,
                              ),
                            )
                          }
                        />
                        <Input
                          aria-label={`Título do momento ${i + 1}`}
                          maxLength={120}
                          placeholder="Título"
                          value={m.title}
                          onChange={(e) =>
                            set(
                              "moments",
                              content.moments.map((x) =>
                                x.id === m.id ? { ...x, title: e.target.value } : x,
                              ),
                            )
                          }
                        />
                        {photos.length > 0 && (
                          <select
                            aria-label={`Foto do momento ${i + 1}`}
                            value={m.assetId ?? ""}
                            onChange={(event) =>
                              set(
                                "moments",
                                content.moments.map((item) =>
                                  item.id === m.id
                                    ? { ...item, assetId: event.target.value || undefined }
                                    : item,
                                ),
                              )
                            }
                            className="border-border bg-card h-11 w-full rounded-xl border px-3 text-sm"
                          >
                            <option value="">Sem foto ligada a este momento</option>
                            {photos.map((photo, photoIndex) => (
                              <option key={photo.assetId} value={photo.assetId}>
                                {photo.altText || `Foto ${photoIndex + 1}`}
                              </option>
                            ))}
                          </select>
                        )}
                        <Textarea
                          aria-label={`Texto do momento ${i + 1}`}
                          maxLength={2000}
                          placeholder="Texto"
                          value={m.text}
                          onChange={(e) =>
                            set(
                              "moments",
                              content.moments.map((x) =>
                                x.id === m.id ? { ...x, text: e.target.value } : x,
                              ),
                            )
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    disabled={content.moments.length >= maxMoments}
                    onClick={() => addMoment()}
                  >
                    <Plus className="h-4 w-4" /> Adicionar momento
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    {content.moments.length}/{maxMoments} momentos · esta etapa é opcional
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <Field label="Música do Spotify ou YouTube (opcional)" htmlFor="music-url">
                    <Input
                      id="music-url"
                      aria-invalid={Boolean(fieldErrors["music-url"])}
                      aria-describedby={fieldErrors["music-url"] ? "music-url-error" : undefined}
                      placeholder="https://open.spotify.com/track/…"
                      value={musicInput}
                      onChange={(e) => {
                        setMusicInput(e.target.value);
                        set("music", parseMusicUrl(e.target.value));
                      }}
                    />
                    <FieldError id="music-url-error" message={fieldErrors["music-url"]} />
                    <p
                      className={cn(
                        "mt-1.5 flex items-center gap-1.5 text-xs",
                        content.music ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {content.music && <Check className="h-3.5 w-3.5" aria-hidden />}
                      {content.music
                        ? "Música reconhecida e pronta para aparecer no presente."
                        : "Cole o link de uma música do Spotify ou de um vídeo do YouTube."}
                    </p>
                  </Field>
                  <Field label="Frase final (opcional)" htmlFor="final-phrase">
                    <Input
                      id="final-phrase"
                      maxLength={300}
                      placeholder="Ex.: Que a nossa história continue para sempre."
                      value={content.finalPhrase}
                      onChange={(e) => set("finalPhrase", e.target.value)}
                    />
                    <p className="text-muted-foreground mt-1 text-right text-[11px]">
                      {content.finalPhrase.length}/300
                    </p>
                  </Field>
                  <div>
                    <Label id="color-scheme-label">Paleta de cores</Label>
                    <div
                      className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3"
                      role="group"
                      aria-labelledby="color-scheme-label"
                    >
                      {template.presets.colorSchemes.map((scheme) => {
                        const palette = resolveExperiencePalette(
                          scheme,
                          template.presets.defaultScheme,
                        );
                        return (
                          <button
                            key={scheme}
                            type="button"
                            aria-pressed={content.colorScheme === scheme}
                            onClick={() => set("colorScheme", scheme)}
                            className={cn(
                              "bg-card flex items-center gap-3 rounded-xl border p-3 text-left text-sm capitalize transition-all",
                              content.colorScheme === scheme
                                ? "border-primary ring-primary/15 ring-2"
                                : "border-border hover:border-primary/50",
                            )}
                          >
                            <span className="flex -space-x-2" aria-hidden>
                              <span
                                className="h-7 w-7 rounded-full border-2 border-white"
                                style={{ background: palette.background }}
                              />
                              <span
                                className="h-7 w-7 rounded-full border-2 border-white"
                                style={{ background: palette.accent }}
                              />
                            </span>
                            <span className="min-w-0 flex-1 truncate">{scheme}</span>
                            {content.colorScheme === scheme && (
                              <Check className="text-primary h-4 w-4 shrink-0" aria-hidden />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && editMode && (
                <div className="space-y-6">
                  <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-2xl border p-4">
                    <Eye className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                    <div>
                      <p className="text-sm font-medium">Revise as alterações</p>
                      <p className="text-muted-foreground mt-1 text-xs leading-5">
                        Confira a prévia ao lado e salve quando estiver tudo certo. Isso não gera
                        uma nova cobrança — seu presente já está pago.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && !editMode && (
                <div className="space-y-6">
                  <div className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-2xl border p-4">
                    <Eye className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                    <div>
                      <p className="text-sm font-medium">
                        Sua experiência está pronta para a revisão
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs leading-5">
                        Confira a prévia ao lado, escolha como deseja presentear e finalize com
                        segurança.
                      </p>
                      {checkoutRecovered && (
                        <p
                          className="text-success mt-2 flex items-center gap-1.5 text-xs"
                          role="status"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden /> Seus dados desta compra
                          foram recuperados.
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    id="plan-options"
                    tabIndex={-1}
                    className="grid gap-3 outline-none sm:grid-cols-3"
                    aria-describedby={
                      fieldErrors["plan-options"] ? "plan-options-error" : undefined
                    }
                  >
                    {plans.map((plan) => {
                      const issue = planCompatibilityMessage(plan, content, photos.length);
                      const selected = planSlug === plan.slug;
                      const benefits = [
                        `Até ${plan.limits.maxPhotos} fotos`,
                        plan.limits.maxMoments > 0
                          ? `Até ${plan.limits.maxMoments} momentos`
                          : "Experiência essencial",
                        plan.includesPhysical
                          ? "Coração físico com NFC"
                          : plan.limits.musicEmbed
                            ? "Música e QR Code"
                            : plan.durationDays
                              ? `${plan.durationDays} dias no ar`
                              : "Sem expiração",
                      ];
                      return (
                        <button
                          key={plan.slug}
                          type="button"
                          onClick={() => {
                            if (!issue) {
                              setPlanSlug(plan.slug);
                              clearFieldError("plan-options");
                              setCheckoutError(null);
                            }
                          }}
                          aria-disabled={Boolean(issue)}
                          aria-pressed={selected}
                          className={cn(
                            "bg-card rounded-2xl border p-4 text-left transition-colors",
                            selected ? "border-primary" : "border-border hover:border-primary/50",
                            issue && "cursor-not-allowed opacity-55",
                          )}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <span>
                              <span className="block font-serif text-lg">{plan.name}</span>
                              <span className="text-muted-foreground block text-sm">
                                {formatBRL(plan.priceCents)}
                              </span>
                            </span>
                            {selected ? (
                              <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium">
                                <Check className="h-3 w-3" aria-hidden /> Selecionado
                              </span>
                            ) : plan.slug === "para-sempre" ? (
                              <span className="bg-secondary rounded-full px-2 py-1 text-[10px] font-medium">
                                Mais escolhido
                              </span>
                            ) : null}
                          </span>
                          {issue ? (
                            <span className="text-error mt-3 block text-xs">{issue}</span>
                          ) : (
                            <span className="text-muted-foreground mt-3 block space-y-1 text-xs">
                              {benefits.map((benefit) => (
                                <span key={benefit} className="flex items-center gap-1.5">
                                  <Check className="text-success h-3 w-3" aria-hidden /> {benefit}
                                </span>
                              ))}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <FieldError id="plan-options-error" message={fieldErrors["plan-options"]} />

                  <div
                    className="border-border bg-card rounded-2xl border p-4"
                    aria-label="Resumo da compra"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{selectedPlan.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {selectedPlan.includesPhysical
                            ? "Presente digital + coração com NFC"
                            : "Presente digital personalizado"}
                        </p>
                      </div>
                      <p className="font-serif text-xl">{formatBRL(checkoutTotalCents)}</p>
                    </div>
                    {selectedPlan.includesPhysical && (
                      <div className="text-muted-foreground border-border mt-3 space-y-1 border-t pt-3 text-xs">
                        <p>Produto: {formatBRL(selectedPlan.priceCents)}</p>
                        <p>
                          Frete: {shipping ? formatBRL(shipping.shippingCents) : "calcule abaixo"}
                        </p>
                        {shipping?.estimatedDays && (
                          <p>Prazo estimado: {shipping.estimatedDays} dias úteis</p>
                        )}
                      </div>
                    )}
                    {activeCoupon && (
                      <p className="border-border text-success mt-3 border-t pt-3 text-sm font-medium">
                        Cupom {activeCoupon.code}: − {formatBRL(activeCoupon.discountCents)}
                      </p>
                    )}
                  </div>

                  {selectedPlan.includesPhysical && (
                    <fieldset className="border-border rounded-2xl border p-4">
                      <legend className="flex items-center gap-2 px-2 font-medium">
                        <MapPin className="text-primary h-4 w-4" /> Endereço de entrega
                      </legend>
                      <div className="mt-2 grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Field label="Nome de quem recebe" htmlFor="shipping-recipient" required>
                            <Input
                              id="shipping-recipient"
                              autoComplete="name"
                              minLength={2}
                              maxLength={120}
                              required
                              aria-invalid={Boolean(fieldErrors["shipping-recipient"])}
                              aria-describedby={
                                fieldErrors["shipping-recipient"]
                                  ? "shipping-recipient-error"
                                  : undefined
                              }
                              value={address.recipient}
                              onChange={(event) => updateAddress("recipient", event.target.value)}
                            />
                            <FieldError
                              id="shipping-recipient-error"
                              message={fieldErrors["shipping-recipient"]}
                            />
                          </Field>
                        </div>
                        <Field label="CEP" htmlFor="shipping-cep" required>
                          <Input
                            id="shipping-cep"
                            inputMode="numeric"
                            autoComplete="postal-code"
                            maxLength={9}
                            required
                            aria-invalid={Boolean(fieldErrors["shipping-cep"])}
                            aria-describedby={
                              fieldErrors["shipping-cep"] ? "shipping-cep-error" : undefined
                            }
                            value={address.cep}
                            onChange={(event) =>
                              updateAddress("cep", formatCep(event.target.value))
                            }
                          />
                          <FieldError
                            id="shipping-cep-error"
                            message={fieldErrors["shipping-cep"]}
                          />
                        </Field>
                        <div className="flex flex-col justify-end">
                          <Button
                            id="shipping-calculate"
                            type="button"
                            variant="secondary"
                            className="w-full"
                            aria-describedby={
                              fieldErrors["shipping-calculate"]
                                ? "shipping-calculate-error"
                                : shippingError
                                  ? "shipping-quote-error"
                                  : undefined
                            }
                            disabled={
                              quotingShipping || address.cep.replace(/\D/g, "").length !== 8
                            }
                            onClick={calculateShipping}
                          >
                            {quotingShipping ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Calcular frete
                          </Button>
                          <FieldError
                            id="shipping-calculate-error"
                            message={fieldErrors["shipping-calculate"]}
                          />
                          {shippingError && (
                            <p
                              id="shipping-quote-error"
                              className="text-error mt-2 text-xs leading-5"
                              role="alert"
                            >
                              {shippingError}
                            </p>
                          )}
                        </div>
                        <div className="sm:col-span-2">
                          <Field label="Rua ou avenida" htmlFor="shipping-street" required>
                            <Input
                              id="shipping-street"
                              autoComplete="street-address"
                              minLength={2}
                              maxLength={160}
                              required
                              aria-invalid={Boolean(fieldErrors["shipping-street"])}
                              aria-describedby={
                                fieldErrors["shipping-street"] ? "shipping-street-error" : undefined
                              }
                              value={address.street}
                              onChange={(event) => updateAddress("street", event.target.value)}
                            />
                            <FieldError
                              id="shipping-street-error"
                              message={fieldErrors["shipping-street"]}
                            />
                          </Field>
                        </div>
                        <Field label="Número" htmlFor="shipping-number" required>
                          <Input
                            id="shipping-number"
                            maxLength={20}
                            required
                            aria-invalid={Boolean(fieldErrors["shipping-number"])}
                            aria-describedby={
                              fieldErrors["shipping-number"] ? "shipping-number-error" : undefined
                            }
                            value={address.number}
                            onChange={(event) => updateAddress("number", event.target.value)}
                          />
                          <FieldError
                            id="shipping-number-error"
                            message={fieldErrors["shipping-number"]}
                          />
                        </Field>
                        <Field label="Complemento (opcional)" htmlFor="shipping-complement">
                          <Input
                            id="shipping-complement"
                            maxLength={80}
                            aria-invalid={Boolean(fieldErrors["shipping-complement"])}
                            aria-describedby={
                              fieldErrors["shipping-complement"]
                                ? "shipping-complement-error"
                                : undefined
                            }
                            value={address.complement}
                            onChange={(event) => updateAddress("complement", event.target.value)}
                          />
                          <FieldError
                            id="shipping-complement-error"
                            message={fieldErrors["shipping-complement"]}
                          />
                        </Field>
                        <Field label="Bairro" htmlFor="shipping-neighborhood" required>
                          <Input
                            id="shipping-neighborhood"
                            minLength={2}
                            maxLength={100}
                            required
                            aria-invalid={Boolean(fieldErrors["shipping-neighborhood"])}
                            aria-describedby={
                              fieldErrors["shipping-neighborhood"]
                                ? "shipping-neighborhood-error"
                                : undefined
                            }
                            value={address.neighborhood}
                            onChange={(event) => updateAddress("neighborhood", event.target.value)}
                          />
                          <FieldError
                            id="shipping-neighborhood-error"
                            message={fieldErrors["shipping-neighborhood"]}
                          />
                        </Field>
                        <Field label="Cidade" htmlFor="shipping-city" required>
                          <Input
                            id="shipping-city"
                            autoComplete="address-level2"
                            minLength={2}
                            maxLength={100}
                            required
                            aria-invalid={Boolean(fieldErrors["shipping-city"])}
                            aria-describedby={
                              fieldErrors["shipping-city"] ? "shipping-city-error" : undefined
                            }
                            value={address.city}
                            onChange={(event) => updateAddress("city", event.target.value)}
                          />
                          <FieldError
                            id="shipping-city-error"
                            message={fieldErrors["shipping-city"]}
                          />
                        </Field>
                        <Field label="Estado (UF)" htmlFor="shipping-state" required>
                          <Input
                            id="shipping-state"
                            autoComplete="address-level1"
                            minLength={2}
                            maxLength={2}
                            required
                            aria-invalid={Boolean(fieldErrors["shipping-state"])}
                            aria-describedby={
                              fieldErrors["shipping-state"] ? "shipping-state-error" : undefined
                            }
                            value={address.state}
                            onChange={(event) =>
                              updateAddress("state", event.target.value.toUpperCase())
                            }
                          />
                          <FieldError
                            id="shipping-state-error"
                            message={fieldErrors["shipping-state"]}
                          />
                        </Field>
                      </div>
                    </fieldset>
                  )}

                  <div>
                    <label className="text-muted-foreground flex items-start gap-2 text-sm">
                      <input
                        id="checkout-consent"
                        type="checkbox"
                        required
                        aria-invalid={Boolean(fieldErrors["checkout-consent"])}
                        aria-describedby={
                          fieldErrors["checkout-consent"] ? "checkout-consent-error" : undefined
                        }
                        checked={consent}
                        onChange={(event) => {
                          setConsent(event.target.checked);
                          clearFieldError("checkout-consent");
                          setCheckoutError(null);
                        }}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span>
                        Li e aceito os{" "}
                        <Link href="/termos" target="_blank" rel="noreferrer" className="underline">
                          Termos
                        </Link>{" "}
                        e a{" "}
                        <Link
                          href="/privacidade"
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          Política de Privacidade
                        </Link>
                        , e confirmo que tenho autorização para usar as imagens e o conteúdo
                        enviado.
                      </span>
                    </label>
                    <FieldError
                      id="checkout-consent-error"
                      message={fieldErrors["checkout-consent"]}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Seu e-mail (para receber o acesso)" htmlFor="checkout-email">
                      <Input
                        id="checkout-email"
                        type="email"
                        autoComplete="email"
                        maxLength={320}
                        required
                        aria-invalid={Boolean(fieldErrors["checkout-email"])}
                        aria-describedby={
                          fieldErrors["checkout-email"] ? "checkout-email-error" : undefined
                        }
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          clearFieldError("checkout-email");
                          setCouponError(null);
                          setCheckoutError(null);
                        }}
                        placeholder="voce@email.com"
                      />
                      <FieldError
                        id="checkout-email-error"
                        message={fieldErrors["checkout-email"]}
                      />
                    </Field>
                    <Field label="Seu nome" htmlFor="buyer-name">
                      <Input
                        id="buyer-name"
                        autoComplete="name"
                        minLength={2}
                        maxLength={120}
                        required
                        aria-invalid={Boolean(fieldErrors["buyer-name"])}
                        aria-describedby={
                          fieldErrors["buyer-name"] ? "buyer-name-error" : undefined
                        }
                        value={buyerName}
                        onChange={(event) => {
                          setBuyerName(event.target.value);
                          clearFieldError("buyer-name");
                          setCheckoutError(null);
                        }}
                      />
                      <FieldError id="buyer-name-error" message={fieldErrors["buyer-name"]} />
                    </Field>
                  </div>

                  <div>
                    <Label htmlFor="coupon-code">Cupom de desconto (opcional)</Label>
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        id="coupon-code"
                        autoComplete="off"
                        maxLength={40}
                        value={couponCode}
                        onChange={(event) => {
                          setCouponCode(event.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        placeholder="SEUCUPOM"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={couponBusy || !couponCode.trim() || !EMAIL_RE.test(email.trim())}
                        onClick={applyCoupon}
                      >
                        {couponBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Aplicar
                      </Button>
                    </div>
                    {activeCoupon && (
                      <p className="text-success mt-2 text-sm" role="status">
                        Cupom aplicado com sucesso.
                      </p>
                    )}
                    {couponError && (
                      <p className="text-error mt-2 text-sm" role="alert">
                        {couponError}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Forma de pagamento</Label>
                    <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMethod("PIX");
                          setCheckoutError(null);
                        }}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                          method === "PIX"
                            ? "border-primary bg-card text-primary"
                            : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        Pix{" "}
                        <span className="mt-1 block text-xs font-normal opacity-80">
                          Aprovação rápida
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMethod("CARD");
                          setCheckoutError(null);
                        }}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                          method === "CARD"
                            ? "border-primary bg-card text-primary"
                            : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        Cartão de crédito{" "}
                        <span className="mt-1 block text-xs font-normal opacity-80">
                          Em até 12x
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMethod("CHECKOUT_PRO");
                          setCheckoutError(null);
                        }}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                          method === "CHECKOUT_PRO"
                            ? "border-primary bg-card text-primary"
                            : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        Continuar pelo Mercado Pago{" "}
                        <span className="mt-1 block text-xs font-normal opacity-80">
                          Pix, cartão, boleto e mais
                        </span>
                      </button>
                    </div>

                    {method === "CHECKOUT_PRO" && (
                      <p className="border-border bg-secondary/40 text-muted-foreground mt-4 rounded-xl border px-4 py-3 text-sm">
                        Você vai continuar numa página segura do Mercado Pago, com todas as formas
                        de pagamento que a sua conta aceitar. Depois de pagar, volta pra cá
                        automaticamente.
                      </p>
                    )}

                    {method === "CARD" && (
                      <div className="border-border bg-card mt-4 rounded-2xl border p-4 sm:p-5">
                        {process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ? (
                          <CardPaymentForm
                            ref={cardFormRef}
                            publicKey={process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY}
                            amountCents={checkoutTotalCents}
                            payerEmail={email}
                            payerName={buyerName}
                            disabled={busy}
                            onTokenized={handleCardTokenized}
                            onError={handleCardError}
                          />
                        ) : (
                          <p className="text-error text-sm" role="alert">
                            Pagamento por cartão indisponível no momento. Use o Pix.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {step === STEPS.length - 1 && checkoutError && (
            <p
              id="checkout-action-error"
              className="border-error/30 bg-error/10 text-error mt-5 rounded-xl border px-4 py-3 text-sm"
              role="alert"
              tabIndex={-1}
            >
              {checkoutError} Seu presente continua salvo; tente novamente sem refazer tudo.
            </p>
          )}

          {/* Navegação */}
          <div
            className={cn(
              "mt-8 flex items-center justify-between rounded-2xl",
              // No primeiro passo a barra entra no fluxo normal: ali não há
              // formulário longo para navegar, e fixá-la no rodapé cobria
              // metade do campo de texto da IA e o botão de enviar dele.
              step === 0
                ? "justify-end"
                : "border-border bg-background/95 sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 border p-3 shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none",
            )}
          >
            <Button
              variant="ghost"
              onClick={back}
              disabled={step === 0 || (editMode && step === 1)}
              aria-label="Voltar"
              className={cn((step === 0 || (editMode && step === 1)) && "hidden", "px-3 sm:px-6")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span aria-hidden className="hidden sm:inline">
                Voltar
              </span>
            </Button>
            {step === 0 ? (
              <Button
                variant={aiEnabled ? "secondary" : "default"}
                onClick={beginCreation}
                disabled={interactionBusy || templates.length === 0}
                data-analytics="cta_click"
                data-analytics-label="wizard_manual_start"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {aiEnabled ? "Criar passo a passo" : "Começar com este modelo"}{" "}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : step === 1 && aiGenerated ? (
              <Button
                onClick={goToFinalReview}
                disabled={busy || saving}
                aria-label="Ver prévia e escolher plano"
                data-analytics="cta_click"
                data-analytics-label="wizard_ai_to_checkout"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span aria-hidden className="sm:hidden">
                  Ir para revisão
                </span>
                <span aria-hidden className="hidden sm:inline">
                  Ver prévia e escolher plano
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : step < STEPS.length - 1 ? (
              <Button
                onClick={next}
                disabled={busy || saving || step === 0}
                aria-label={continueLabel}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span aria-hidden className="sm:hidden">
                  Continuar
                </span>
                <span aria-hidden className="hidden sm:inline">
                  {continueLabel}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : editMode ? (
              <Button onClick={handleSaveEdits} disabled={busy || saving}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Salvar alterações
              </Button>
            ) : (
              <Button
                data-analytics="checkout_start"
                data-analytics-label={selectedPlan.slug}
                onClick={
                  method === "PIX"
                    ? handleCheckout
                    : method === "CARD"
                      ? handleCardSubmit
                      : handleCheckoutProSubmit
                }
                disabled={busy || saving}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {method === "PIX"
                  ? `Gerar Pix de ${formatBRL(checkoutTotalCents)}`
                  : method === "CARD"
                    ? `Pagar ${formatBRL(checkoutTotalCents)} no cartão`
                    : `Continuar pelo Mercado Pago`}
              </Button>
            )}
          </div>
        </section>

        <LivePreview
          slug={templateSlug}
          templateName={template.name}
          content={previewContent}
          photos={photos}
          compactOnMobile
          firstOnMobile={step > 0}
          expanded={previewExpanded}
          onToggle={() => setPreviewExpanded((current) => !current)}
        />
      </div>
    </div>
  );
}

function AiDraftComposer({
  value,
  tone,
  detailLevel,
  busy,
  generating,
  onChange,
  onToneChange,
  onDetailLevelChange,
  onGenerate,
  onCancel,
}: {
  value: string;
  tone: AiTone;
  detailLevel: AiDetailLevel;
  busy: boolean;
  generating: boolean;
  onChange: (value: string) => void;
  onToneChange: (tone: AiTone) => void;
  onDetailLevelChange: (detailLevel: AiDetailLevel) => void;
  onGenerate: () => void;
  onCancel: () => void;
}) {
  const examples = [
    "Quero criar um presente para minha esposa Marina. Estamos juntos há seis anos e nossa lembrança favorita é uma viagem para a praia.",
    "É um presente de aniversário para meu melhor amigo Rafael. Quero agradecer por todas as aventuras e pelo apoio nos momentos difíceis.",
    "Quero homenagear minha cachorra Mel, que chegou filhote e transformou a nossa casa com seu jeito brincalhão.",
  ];
  const [progressIndex, setProgressIndex] = useState(0);
  const [takingLong, setTakingLong] = useState(false);
  const toneOptions: { value: AiTone; label: string }[] = [
    { value: "automatico", label: "A IA decide" },
    { value: "emocionante", label: "Emocionante" },
    { value: "romantico", label: "Romântico" },
    { value: "leve", label: "Leve" },
    { value: "divertido", label: "Divertido" },
    { value: "elegante", label: "Elegante" },
  ];
  const detailOptions: { value: AiDetailLevel; label: string }[] = [
    { value: "curto", label: "Curto" },
    { value: "equilibrado", label: "Equilibrado" },
    { value: "detalhado", label: "Detalhado" },
  ];
  const promptLength = value.trim().length;
  const briefingHints = AI_BRIEFING_HINTS.map((hint) => ({
    ...hint,
    complete: hint.test.test(value),
  }));
  const briefingCompleted = briefingHints.filter((hint) => hint.complete).length;
  const firstMissingHint = briefingHints.find((hint) => !hint.complete)?.label.toLocaleLowerCase();
  const promptQuality =
    promptLength >= 120 && briefingCompleted >= 3
      ? 3
      : promptLength >= 70 && briefingCompleted >= 2
        ? 2
        : promptLength >= 40
          ? 1
          : 0;
  const promptFeedback =
    promptQuality === 3
      ? "Ótimo contexto — já dá para criar algo bem pessoal."
      : promptQuality === 2
        ? `Boa história. Se puder, acrescente ${firstMissingHint ?? "mais um detalhe"}.`
        : promptQuality === 1
          ? `Já podemos começar. Para ficar melhor, conte ${firstMissingHint ?? "mais um detalhe marcante"}.`
          : `Conte um pouco mais para a IA entender você · faltam ${Math.max(0, 40 - promptLength)} caracteres.`;

  useEffect(() => {
    if (!generating) return;
    const timer = window.setInterval(() => {
      setProgressIndex((current) => Math.min(current + 1, AI_PROGRESS_STEPS.length - 1));
    }, 1200);
    const longTimer = window.setTimeout(() => setTakingLong(true), 9000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(longTimer);
    };
  }, [generating]);

  function handleGenerate() {
    setProgressIndex(0);
    setTakingLong(false);
    onGenerate();
  }

  return (
    <div className="from-primary/10 via-card to-accent/10 border-primary/20 mb-7 overflow-hidden rounded-3xl border bg-gradient-to-br p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <div className="from-primary to-accent text-primary-foreground flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm">
          <Bot className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl sm:text-2xl">
              Conte a história. A IA monta o presente.
            </h2>
            <Badge variant="secondary">Novo · DeepSeek</Badge>
          </div>
          <p className="text-muted-foreground mt-1.5 text-sm leading-6">
            Escreva do seu jeito, sem formulário. A IA cria um rascunho completo e você revisa tudo
            com a prévia ao vivo.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Label htmlFor="ai-gift-prompt">O que você quer criar?</Label>
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Checklist da sua história">
          {briefingHints.map((hint) => (
            <span
              key={hint.label}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                hint.complete
                  ? "border-success/25 bg-success/10 text-success"
                  : "border-border bg-background/60 text-muted-foreground",
              )}
            >
              {hint.complete && <Check className="h-3 w-3" aria-hidden />}
              {hint.label}
            </span>
          ))}
        </div>
        <Textarea
          id="ai-gift-prompt"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={4000}
          rows={4}
          disabled={busy}
          placeholder="Ex.: Quero fazer um presente para minha esposa. Estamos juntos desde 2019, nos conhecemos na faculdade e nossa viagem favorita foi para…"
          className="bg-background/90 mt-1.5"
        />
        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex gap-1" aria-hidden>
              {[1, 2, 3].map((level) => (
                <span
                  key={level}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    level <= promptQuality ? "bg-success" : "bg-border",
                  )}
                />
              ))}
            </div>
            <p
              className={cn(
                "mt-1.5 text-xs leading-5",
                promptQuality > 0 ? "text-foreground" : "text-muted-foreground",
              )}
              aria-live="polite"
            >
              {promptFeedback}
            </p>
          </div>
          <p className="text-muted-foreground shrink-0 text-[11px]">{value.length}/4.000</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground flex max-w-md items-start gap-2 text-[11px] leading-5">
          <ShieldCheck className="text-success mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Ao gerar, este texto é enviado à DeepSeek. Não inclua senhas, documentos ou outros dados
          sensíveis.
        </p>
        <Button
          type="button"
          variant="shiny"
          onClick={handleGenerate}
          disabled={busy || value.trim().length < 40}
          className="shrink-0"
          data-analytics="cta_click"
          data-analytics-label="wizard_ai_generate"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <WandSparkles className="h-4 w-4" />
          )}
          {generating ? "Criando sua primeira versão…" : "Criar meu presente com IA"}
        </Button>
      </div>

      {generating && (
        <div
          className="border-primary/20 bg-background/75 mt-4 rounded-2xl border p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{AI_PROGRESS_STEPS[progressIndex]}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {takingLong
                  ? "Uma história especial pode levar mais alguns segundos. Seu texto está seguro."
                  : "Criando uma primeira versão que você poderá editar por completo."}
              </p>
            </div>
            <span className="text-primary text-xs font-semibold">{progressIndex + 1}/4</span>
          </div>
          <div className="bg-secondary mt-3 h-1.5 overflow-hidden rounded-full" aria-hidden>
            <div
              className="from-primary to-accent h-full rounded-full bg-gradient-to-r transition-all duration-500"
              style={{ width: `${(progressIndex + 1) * 25}%` }}
            />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground mt-3 text-xs underline underline-offset-4"
          >
            Cancelar geração
          </button>
        </div>
      )}

      <div className="mt-4">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          Ou comece com um exemplo
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {examples.map((example, index) => (
            <button
              key={example}
              type="button"
              onClick={() => onChange(example)}
              disabled={busy}
              className="border-border bg-background/80 hover:border-primary hover:text-primary rounded-full border px-3 py-2 text-xs transition-colors disabled:opacity-50"
            >
              {index === 0 ? "Para o amor" : index === 1 ? "Para um amigo" : "Para um pet"}
            </button>
          ))}
        </div>
      </div>

      <details className="border-border/80 bg-background/45 group mt-4 rounded-2xl border">
        <summary className="hover:text-primary flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-medium transition-colors [&::-webkit-details-marker]:hidden">
          <span>Personalizar estilo da escrita</span>
          <span className="text-muted-foreground font-normal">
            {toneOptions.find((option) => option.value === tone)?.label} ·{" "}
            {detailOptions.find((option) => option.value === detailLevel)?.label}
          </span>
        </summary>
        <div className="border-border/80 grid gap-5 border-t p-4 sm:grid-cols-[1.35fr_0.65fr]">
          <fieldset>
            <legend className="text-xs font-medium">Qual deve ser o clima do texto?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={tone === option.value}
                  onClick={() => onToneChange(option.value)}
                  disabled={busy}
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs transition-colors disabled:opacity-50",
                    tone === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background/80 hover:border-primary hover:text-primary",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium">Nível de detalhe</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {detailOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={detailLevel === option.value}
                  onClick={() => onDetailLevelChange(option.value)}
                  disabled={busy}
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs transition-colors disabled:opacity-50",
                    detailLevel === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background/80 hover:border-primary hover:text-primary",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </details>

      <div className="mt-6 flex items-center gap-3" aria-hidden>
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
          ou personalize passo a passo
        </span>
        <div className="bg-border h-px flex-1" />
      </div>
    </div>
  );
}

function LivePreview({
  slug,
  templateName,
  content,
  photos,
  compactOnMobile,
  firstOnMobile,
  expanded,
  onToggle,
}: {
  slug: string;
  templateName: string;
  content: ProjectContent;
  photos: WizardPhoto[];
  compactOnMobile: boolean;
  firstOnMobile: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => {
      previewContainerRef.current
        ?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        ?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
      returnFocusRef.current?.focus();
    };
  }, [expanded]);

  return (
    <div
      ref={previewContainerRef}
      className={cn(
        "border-border bg-card overflow-hidden rounded-3xl border shadow-[0_24px_80px_-48px_rgba(48,24,32,0.45)]",
        expanded
          ? "fixed inset-2 z-50 flex flex-col sm:inset-5"
          : cn("xl:sticky xl:top-24 xl:order-none", firstOnMobile ? "order-first" : "order-last"),
      )}
      aria-label="Prévia ao vivo do presente"
      role={expanded ? "dialog" : "complementary"}
      aria-modal={expanded ? true : undefined}
      onKeyDown={(event) => {
        if (!expanded || event.key !== "Tab") return;
        const focusable = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div className="border-border bg-card/95 flex items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur sm:px-5">
        <div className="min-w-0">
          <p className="text-primary flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase">
            <Eye className="h-3.5 w-3.5" aria-hidden /> Prévia ao vivo
          </p>
          <p className="mt-0.5 truncate text-sm font-medium">{templateName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-success hidden items-center gap-1.5 text-xs sm:flex">
            <span className="bg-success h-1.5 w-1.5 rounded-full" aria-hidden /> Atualiza enquanto
            você cria
          </span>
          <button
            type="button"
            onClick={onToggle}
            className="border-border hover:border-primary hover:text-primary inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
            aria-label={expanded ? "Fechar prévia em tela cheia" : "Abrir prévia em tela cheia"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "bg-secondary/40 focus-visible:ring-primary overscroll-contain focus-visible:ring-2 focus-visible:outline-none",
          expanded
            ? "min-h-0 flex-1 overflow-y-auto"
            : cn(
                "overflow-y-auto sm:max-h-[32rem] xl:max-h-[calc(100vh-13rem)]",
                compactOnMobile ? "max-h-40" : "max-h-[18rem]",
              ),
        )}
        tabIndex={0}
        aria-label="Conteúdo rolável da prévia"
      >
        <TemplateRenderer slug={slug} content={content} photos={photos} />
      </div>

      {!expanded && (
        <button
          type="button"
          onClick={onToggle}
          className="border-border text-muted-foreground hover:text-primary w-full border-t px-4 py-3 text-center text-xs transition-colors"
        >
          Toque para explorar a experiência completa
        </button>
      )}
    </div>
  );
}

function Step0({
  selected,
  onSelect,
  busy,
  templates,
}: {
  selected: string;
  onSelect: (slug: string) => void;
  busy: boolean;
  templates: TemplateDefinition[];
}) {
  const byNiche = useMemo(() => groupTemplatesByNiche(templates), [templates]);
  const selectedTemplate = templates.find((template) => template.slug === selected);
  const [activeNiche, setActiveNiche] = useState(selectedTemplate?.niche ?? NICHES[0]);
  const nicheTemplates = useMemo(
    () =>
      [...byNiche[activeNiche]].sort((left, right) => {
        if (left.slug === selected) return -1;
        if (right.slug === selected) return 1;
        return left.name.localeCompare(right.name, "pt-BR");
      }),
    [activeNiche, byNiche, selected],
  );

  return (
    <div>
      <p className="text-muted-foreground text-sm">
        Primeiro escolha a ocasião. Você poderá trocar o estilo antes de publicar.
      </p>
      <div className="mt-5 flex flex-wrap gap-2 pb-2" aria-label="Ocasiões">
        {NICHES.filter((niche) => byNiche[niche].length > 0).map((niche) => (
          <button
            key={niche}
            type="button"
            onClick={() => setActiveNiche(niche)}
            aria-pressed={activeNiche === niche}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium",
              activeNiche === niche
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary",
            )}
          >
            {NICHE_LABELS[niche]}
          </button>
        ))}
      </div>

      <h2 className="mt-7 mb-3 font-serif text-2xl">Modelos para {NICHE_LABELS[activeNiche]}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {nicheTemplates.map((template) => (
          <button
            key={template.slug}
            type="button"
            disabled={busy}
            onClick={() => onSelect(template.slug)}
            aria-pressed={selected === template.slug}
            data-analytics="template_select"
            data-analytics-label={template.slug}
            className={cn(
              "rounded-3xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm",
              selected === template.slug
                ? "border-primary bg-secondary ring-primary/20 ring-2"
                : "border-border hover:border-primary bg-card",
            )}
          >
            <TemplateThumbnail name={template.name} slug={template.slug} compact />
            <p className="mt-4 font-serif text-lg">{template.name}</p>
            <p className="text-muted-foreground mt-1 text-xs leading-5">{template.description}</p>
            {selected === template.slug && (
              <span className="text-primary mt-3 inline-flex items-center gap-1 text-xs font-medium">
                <Check className="h-3.5 w-3.5" /> Selecionado
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  required = false,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="text-primary ml-1" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-error mt-1.5 text-xs leading-5" role="alert">
      {message}
    </p>
  );
}

function musicInputHint(content: ProjectContent): string {
  if (!content.music) return "";
  if (content.music.provider === "spotify")
    return `https://open.spotify.com/${content.music.kind}/${content.music.id}`;
  return `https://www.youtube.com/watch?v=${content.music.id}`;
}

function stepValidationMessage(
  step: number,
  content: ProjectContent,
  musicInput: string,
): string | null {
  if (step === 1) {
    if (!content.creatorName.trim()) return "Digite o seu nome.";
    if (!content.recipientName.trim()) return "Digite o nome de quem vai receber.";
    if (!content.title.trim()) return "Dê um título para o presente.";
  }
  if (step === 4 && musicInput.trim() && !content.music) {
    return "Use um link válido do Spotify ou YouTube, ou deixe o campo vazio.";
  }
  return null;
}

function friendlyError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  return error.message.replace(/^\[[^\]]+\]\s*/, "") || fallback;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Tempo limite excedido.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function draftDisplayTitle(content: ProjectContent): string {
  return (
    content.title.trim() || `Presente para ${content.recipientName.trim() || "alguém especial"}`
  );
}

function newestIsoDate(left: string, right: string): string {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (Number.isNaN(leftTime)) return right;
  if (Number.isNaN(rightTime)) return left;
  return leftTime >= rightTime ? left : right;
}

function toDraftStep(step: number): DraftStep {
  return Math.max(0, Math.min(5, Math.round(step))) as DraftStep;
}

function resumeActionLabel(step: DraftStep): string {
  if (step === STEPS.length - 1) return "Continuar na revisão";
  return `Continuar na etapa ${step + 1}`;
}

function formatDraftAge(updatedAt: string): string {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - Date.parse(updatedAt)) / 60_000));
  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 1) return "Editado agora";
  if (elapsedMinutes < 60) return `Editado há ${elapsedMinutes} min`;
  const hours = Math.floor(elapsedMinutes / 60);
  if (hours < 24) return `Editado há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Editado há ${days} ${days === 1 ? "dia" : "dias"}`;
  return `Editado em ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(updatedAt))}`;
}

function safeStoredText(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 240) : "";
}

function isSupportedImageFile(file: File): boolean {
  if (["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type)) {
    return true;
  }
  return /\.(?:jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

function shippingAddressIssue(
  address: CheckoutAddress,
): { elementId: string; message: string } | null {
  const parsed = shippingAddressSchema.safeParse(address);
  if (parsed.success) return null;
  const issue = parsed.error.issues[0];
  const field = issue?.path[0];
  const elementId =
    typeof field === "string" && field in ADDRESS_FIELD_IDS
      ? ADDRESS_FIELD_IDS[field as keyof CheckoutAddress]
      : "shipping-recipient";
  return { elementId, message: issue?.message ?? "Revise o endereço de entrega." };
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function planCompatibilityMessage(
  plan: PlanDefinition,
  content: ProjectContent,
  photoCount: number,
) {
  if (photoCount > plan.limits.maxPhotos) {
    return `Seu presente tem mais de ${plan.limits.maxPhotos} fotos`;
  }
  if (content.moments.length > plan.limits.maxMoments) {
    return `Seu presente tem mais de ${plan.limits.maxMoments} momentos`;
  }
  if (content.music && !plan.limits.musicEmbed) {
    return "Este plano não inclui música";
  }
  return null;
}
