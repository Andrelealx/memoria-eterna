"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminDeleteTestimonial, adminToggleTestimonial } from "@/app/actions/testimonials";
import { Badge } from "@/components/ui/badge";

export interface TestimonialAdminRow {
  id: string;
  authorName: string;
  occasion: string | null;
  quote: string | null;
  mediaType: "NONE" | "PHOTO" | "VIDEO";
  mediaUrl: string | null;
  active: boolean;
}

export function TestimonialCard({ t }: { t: TestimonialAdminRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle() {
    setBusy("toggle");
    try {
      await adminToggleTestimonial(t.id, !t.active);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm(`Excluir o depoimento de "${t.authorName}"?`)) return;
    setBusy("delete");
    try {
      await adminDeleteTestimonial(t.id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{t.authorName}</p>
          {t.occasion && <p className="text-xs text-muted-foreground">{t.occasion}</p>}
        </div>
        <Badge variant={t.active ? "success" : "muted"}>{t.active ? "Ativo" : "Oculto"}</Badge>
      </div>
      {t.quote && <p className="mt-2 text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>}
      {t.mediaType === "PHOTO" && t.mediaUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.mediaUrl} alt={t.authorName} className="mt-3 h-32 w-full rounded-xl object-cover" />
      )}
      {t.mediaType === "VIDEO" && t.mediaUrl && (
        <p className="mt-3 truncate text-xs text-primary underline">
          <a href={t.mediaUrl} target="_blank" rel="noreferrer">
            {t.mediaUrl}
          </a>
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={busy !== null}
          className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
        >
          {t.active ? "Ocultar" : "Ativar"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy !== null}
          className="rounded-full border border-border px-3 py-1 text-xs font-medium text-error hover:bg-secondary disabled:opacity-50"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
