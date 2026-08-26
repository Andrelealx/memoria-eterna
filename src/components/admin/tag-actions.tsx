"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminTransitionTag } from "@/app/actions/admin";
import { NFC_TAG_LABELS } from "@/lib/labels";

export function TagActions({ tagId, allowed }: { tagId: string; allowed: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(to: string) {
    setBusy(true);
    try {
      await adminTransitionTag(tagId, to as never);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  if (allowed.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {allowed.map((to) => (
        <button
          key={to}
          type="button"
          disabled={busy}
          onClick={() => run(to)}
          className="rounded-lg border border-primary px-2 py-1 text-xs font-medium text-primary hover:bg-secondary disabled:opacity-50"
        >
          {NFC_TAG_LABELS[to] ?? to}
        </button>
      ))}
    </div>
  );
}
