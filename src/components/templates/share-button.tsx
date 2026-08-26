"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

// Botão de compartilhamento (seção 11): Web Share API com fallback para copiar link.
export function ShareButton({ title }: { title?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // usuário cancelou ou share falhou → fallback para copiar
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
    >
      {copied ? <Check className="h-4 w-4 text-success" /> : <Share2 className="h-4 w-4" />}
      {copied ? "Link copiado" : "Compartilhar"}
    </button>
  );
}
