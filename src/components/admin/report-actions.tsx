"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminResolveReport } from "@/app/actions/admin";

// Moderação de denúncias: resolver ou descartar.
export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(status: "RESOLVED" | "DISMISSED") {
    setBusy(status);
    try {
      await adminResolveReport(reportId, status);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => run("RESOLVED")}
        disabled={busy !== null}
        className="rounded-lg border border-primary px-2 py-1 text-xs font-medium text-primary hover:bg-secondary disabled:opacity-50"
      >
        Resolver
      </button>
      <button
        type="button"
        onClick={() => run("DISMISSED")}
        disabled={busy !== null}
        className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
      >
        Descartar
      </button>
    </div>
  );
}
