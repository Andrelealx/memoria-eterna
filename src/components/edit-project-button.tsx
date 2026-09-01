"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { startProjectEdit } from "@/app/actions/drafts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EditProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function edit() {
    setBusy(true);
    try {
      const { draftToken } = await startProjectEdit(projectId);
      router.push(`/criar?editar=${draftToken}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Não foi possível abrir a edição.");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={edit}
      disabled={busy}
      className={cn(buttonVariants({ variant: "secondary" }))}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
      Editar
    </button>
  );
}
