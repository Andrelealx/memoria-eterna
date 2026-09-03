"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateTestimonial } from "@/app/actions/testimonials";

export function TestimonialForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mediaType, setMediaType] = useState<"NONE" | "PHOTO" | "VIDEO">("NONE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await adminCreateTestimonial(new FormData(e.currentTarget));
      formRef.current?.reset();
      setMediaType("NONE");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <h3 className="font-serif text-lg">Novo depoimento</h3>
      </div>
      <label className="text-sm">
        Nome do cliente
        <input
          name="authorName"
          required
          className="border-border bg-background mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Ex.: Ana Paula"
        />
      </label>
      <label className="text-sm">
        Ocasião (opcional)
        <input
          name="occasion"
          className="border-border bg-background mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="Ex.: Presente de aniversário para o Léo"
        />
      </label>
      <label className="text-sm sm:col-span-2">
        Depoimento (opcional)
        <textarea
          name="quote"
          rows={3}
          className="border-border bg-background mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="O que a pessoa disse sobre o presente"
        />
      </label>
      <label className="text-sm">
        Mídia
        <select
          name="mediaType"
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value as typeof mediaType)}
          className="border-border bg-background mt-1 w-full rounded-xl border px-3 py-2 text-sm"
        >
          <option value="NONE">Só texto</option>
          <option value="PHOTO">Foto</option>
          <option value="VIDEO">Vídeo</option>
        </select>
      </label>
      {mediaType === "PHOTO" && (
        <label className="text-sm">
          Arquivo da foto (até 15MB)
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            className="border-border bg-background mt-1 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </label>
      )}
      {mediaType === "VIDEO" && (
        <>
          <label className="text-sm">
            Link do YouTube (recomendado)
            <input
              name="externalUrl"
              className="border-border bg-background mt-1 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="https://youtube.com/watch?v=..."
            />
          </label>
          <label className="text-sm">
            Ou arquivo de vídeo (até 15MB)
            <input
              type="file"
              name="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="border-border bg-background mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </label>
        </>
      )}
      {error && <p className="text-sm text-error sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Salvando..." : "Adicionar depoimento"}
        </button>
      </div>
    </form>
  );
}
