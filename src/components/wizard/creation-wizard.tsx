"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { createDraft, loadDraft, saveDraft } from "@/app/actions/drafts";
import { uploadPhoto } from "@/app/actions/photos";
import { startCheckout } from "@/app/actions/checkout";
import { DEFAULT_TEMPLATES } from "@/lib/domain/templates";
import { DEFAULT_PLANS } from "@/lib/domain/plans";
import type { ProjectContent } from "@/lib/domain/projects";
import { parseMusicUrl } from "@/lib/domain/music";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TemplateRenderer } from "@/components/templates";
import { cn, formatBRL } from "@/lib/utils";

const STORAGE_KEY = "foryoupage:draftToken";
const STEPS = ["Modelo", "Informações", "Fotos", "Nossa história", "Música e detalhes", "Prévia e plano"];

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

export function CreationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draftToken, setDraftToken] = useState<string | null>(null);
  const [templateSlug, setTemplateSlug] = useState(DEFAULT_TEMPLATES[0].slug);
  const [content, setContent] = useState<ProjectContent>(EMPTY_CONTENT);
  const [photos, setPhotos] = useState<WizardPhoto[]>([]);
  const [planSlug, setPlanSlug] = useState("para-sempre");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(true);
  const [musicInput, setMusicInput] = useState("");
  const [email, setEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [method, setMethod] = useState<"PIX" | "CARD">("PIX");

  const set = useCallback(<K extends keyof ProjectContent>(key: K, value: ProjectContent[K]) => {
    setContent((c) => ({ ...c, [key]: value }));
  }, []);

  // Retoma rascunho do mesmo dispositivo (se existir).
  useEffect(() => {
    let cancelled = false;
    async function resume() {
      const token = localStorage.getItem(STORAGE_KEY);
      if (!token) return;
      const d = await loadDraft(token);
      if (cancelled) return;
      if (d) {
        setDraftToken(token);
        setTemplateSlug(d.templateSlug);
        setContent(d.content);
        setPhotos(d.photos);
        setMusicInput(musicInputHint(d.content));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    resume().finally(() => {
      if (!cancelled) setResuming(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function chooseTemplate(slug: string) {
    setBusy(true);
    setError(null);
    try {
      const { draftToken: token } = await createDraft(slug);
      localStorage.setItem(STORAGE_KEY, token);
      setDraftToken(token);
      setTemplateSlug(slug);
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível iniciar.");
    } finally {
      setBusy(false);
    }
  }

  const buildContent = useCallback((): ProjectContent => {
    return {
      ...content,
      photos: photos.map((p) => ({
        assetId: p.assetId,
        altText: p.altText,
        position: p.position,
        isCover: p.isCover,
      })),
    };
  }, [content, photos]);

  async function persist() {
    if (!draftToken) return;
    setSaving(true);
    try {
      await saveDraft({ draftToken, content: buildContent() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if (step === 0) return;
    await persist();
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleCheckout() {
    if (!draftToken) return;
    setBusy(true);
    setError(null);
    try {
      await persist();
      const res = await startCheckout({
        draftToken,
        planSlug,
        email,
        name: buyerName,
        method,
      });
      router.push(`/pagamento/${res.redirect}?order=${res.orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao iniciar o pagamento.");
      setBusy(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !draftToken) return;
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("draftToken", draftToken);
      fd.set("file", file);
      try {
        const res = await uploadPhoto(fd);
        setPhotos((prev) => [
          ...prev,
          { assetId: res.assetId, url: res.url, altText: "", position: prev.length, isCover: prev.length === 0 },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha no upload de uma foto.");
      }
    }
    setBusy(false);
    await persist();
  }

  function removePhoto(assetId: string) {
    setPhotos((prev) =>
      prev.filter((p) => p.assetId !== assetId).map((p, i) => ({ ...p, position: i })),
    );
  }

  function setCover(assetId: string) {
    setPhotos((prev) => prev.map((p) => ({ ...p, isCover: p.assetId === assetId })));
  }

  function updateAlt(assetId: string, altText: string) {
    setPhotos((prev) => prev.map((p) => (p.assetId === assetId ? { ...p, altText } : p)));
  }

  const template = DEFAULT_TEMPLATES.find((t) => t.slug === templateSlug) ?? DEFAULT_TEMPLATES[0];

  if (resuming) {
    return <p className="py-20 text-center text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Barra de progresso */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          Etapa {step + 1} de {STEPS.length} — {STEPS[step]}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
          {error}
        </p>
      )}

      {step === 0 && (
        <Step0 selected={templateSlug} onSelect={chooseTemplate} busy={busy} />
      )}

      {step === 1 && (
        <div className="space-y-5">
          <Field label="Seu nome (quem cria)">
            <Input value={content.creatorName} onChange={(e) => set("creatorName", e.target.value)} />
          </Field>
          <Field label="Nome de quem vai receber">
            <Input value={content.recipientName} onChange={(e) => set("recipientName", e.target.value)} />
          </Field>
          <Field label="Título da página">
            <Input value={content.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Início do relacionamento">
            <Input
              type="date"
              value={content.relationshipDate}
              onChange={(e) => set("relationshipDate", e.target.value)}
            />
          </Field>
          <Field label="Mensagem principal">
            <Textarea
              value={content.message}
              onChange={(e) => set("message", e.target.value)}
              rows={5}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={content.counterEnabled}
              onChange={(e) => set("counterEnabled", e.target.checked)}
              className="h-4 w-4"
            />
            Mostrar contador “Juntos há…”
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <Label>Fotos</Label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              disabled={busy || !draftToken}
              onChange={(e) => handleFiles(e.target.files)}
              className="mt-2 block w-full text-sm text-muted-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG, WebP ou HEIC · até 15 MB por foto.
            </p>
          </div>
          {photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-3">
              {photos.map((p) => (
                <li key={p.assetId} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.altText} className="aspect-[3/4] w-full rounded-xl object-cover" />
                  {p.isCover && <Badge className="absolute left-1 top-1">Capa</Badge>}
                  <div className="absolute right-1 top-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setCover(p.assetId)}
                      className="rounded-full bg-white/90 p-1 text-xs"
                      title="Definir como capa"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(p.assetId)}
                      className="rounded-full bg-white/90 p-1"
                      title="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    value={p.altText}
                    onChange={(e) => updateAlt(p.assetId, e.target.value)}
                    placeholder="Descrição da foto"
                    className="mt-1 w-full rounded-md border border-border px-2 py-1 text-xs"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          {content.moments.map((m, i) => (
            <div key={m.id} className="rounded-2xl border border-border p-4">
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
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 space-y-3">
                <Input
                  placeholder="Data (ex.: 14 de junho)"
                  value={m.date ?? ""}
                  onChange={(e) =>
                    set(
                      "moments",
                      content.moments.map((x) => (x.id === m.id ? { ...x, date: e.target.value } : x)),
                    )
                  }
                />
                <Input
                  placeholder="Título"
                  value={m.title}
                  onChange={(e) =>
                    set(
                      "moments",
                      content.moments.map((x) => (x.id === m.id ? { ...x, title: e.target.value } : x)),
                    )
                  }
                />
                <Textarea
                  placeholder="Texto"
                  value={m.text}
                  onChange={(e) =>
                    set(
                      "moments",
                      content.moments.map((x) => (x.id === m.id ? { ...x, text: e.target.value } : x)),
                    )
                  }
                  rows={2}
                />
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            onClick={() =>
              set("moments", [
                ...content.moments,
                { id: crypto.randomUUID(), date: "", title: "", text: "" },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Adicionar momento
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <Field label="Música (link do Spotify ou YouTube)">
            <Input
              placeholder="https://open.spotify.com/track/…"
              value={musicInput}
              onChange={(e) => {
                setMusicInput(e.target.value);
                set("music", parseMusicUrl(e.target.value));
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {content.music ? "Música válida." : "Somente links do Spotify ou YouTube."}
            </p>
          </Field>
          <Field label="Frase final">
            <Input value={content.finalPhrase} onChange={(e) => set("finalPhrase", e.target.value)} />
          </Field>
          <Field label="Cores (presets do modelo)">
            <select
              value={content.colorScheme}
              onChange={(e) => set("colorScheme", e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-white px-3 text-base"
            >
              {template.presets.colorSchemes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-border">
            <div className="max-h-[60vh] overflow-y-auto">
              <TemplateRenderer
                slug={templateSlug}
                content={{
                  ...content,
                  creatorName: content.creatorName || "Seu nome",
                  recipientName: content.recipientName || "Quem recebe",
                }}
                photos={photos}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {DEFAULT_PLANS.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => setPlanSlug(p.slug)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-colors",
                  planSlug === p.slug ? "border-primary bg-white" : "border-border bg-white",
                )}
              >
                <p className="font-serif text-lg">{p.name}</p>
                <p className="text-sm text-muted-foreground">{formatBRL(p.priceCents)}</p>
              </button>
            ))}
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              Li e aceito os <Link href="/termos" className="underline">Termos</Link> e a{" "}
              <Link href="/privacidade" className="underline">Política de Privacidade</Link>, e
              confirmo que tenho autorização para usar as imagens e o conteúdo enviado.
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Seu e-mail (para receber o acesso)">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </Field>
            <Field label="Seu nome">
              <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
            </Field>
          </div>

          <div>
            <Label>Forma de pagamento</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              {(["PIX", "CARD"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-medium",
                    method === m ? "border-primary bg-white text-primary" : "border-border bg-white",
                  )}
                >
                  {m === "PIX" ? "Pix" : "Cartão"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navegação */}
      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={busy || saving || step === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Continuar <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleCheckout} disabled={!consent || !email || busy || saving}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Ir para pagamento
          </Button>
        )}
      </div>
    </div>
  );
}

function Step0({
  selected,
  onSelect,
  busy,
}: {
  selected: string;
  onSelect: (slug: string) => Promise<void>;
  busy: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {DEFAULT_TEMPLATES.map((t) => (
        <button
          key={t.slug}
          type="button"
          disabled={busy}
          onClick={() => onSelect(t.slug)}
          className={cn(
            "rounded-3xl border p-6 text-left transition-colors",
            selected === t.slug ? "border-primary bg-white" : "border-border bg-white hover:border-primary",
          )}
        >
          <div className="mb-3 flex h-24 items-center justify-center rounded-2xl bg-secondary">
            <span className="font-serif text-3xl text-primary">{t.name.slice(0, 1)}</span>
          </div>
          <p className="font-serif text-lg">{t.name}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{t.description}</p>
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function musicInputHint(content: ProjectContent): string {
  if (!content.music) return "";
  if (content.music.provider === "spotify") return `https://open.spotify.com/${content.music.kind}/${content.music.id}`;
  return `https://www.youtube.com/watch?v=${content.music.id}`;
}
