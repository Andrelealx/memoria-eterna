"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { startUpgrade } from "@/app/actions/upgrade";
import { Button } from "@/components/ui/button";

export function UpgradeButton({ projectId, newPlanSlug }: { projectId: string; newPlanSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function upgrade() {
    setBusy(true);
    try {
      const res = await startUpgrade({ projectId, newPlanSlug });
      router.push(`/pagamento/${res.redirect}?order=${res.orderId}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro no upgrade");
      setBusy(false);
    }
  }

  return (
    <Button onClick={upgrade} disabled={busy}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Fazer upgrade para Para Sempre
    </Button>
  );
}
