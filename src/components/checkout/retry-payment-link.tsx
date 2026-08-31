"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const DRAFT_STORAGE_KEY = "foryoupage:draftToken";

export function RetryPaymentLink({ draftToken, orderId }: { draftToken: string; orderId: string }) {
  return (
    <Link
      href="/criar"
      className={buttonVariants({ className: "w-full sm:w-auto" })}
      onClick={() => {
        localStorage.setItem(DRAFT_STORAGE_KEY, draftToken);
        sessionStorage.removeItem(`presente-vivo:pix:${orderId}`);
      }}
    >
      <RotateCcw aria-hidden />
      Revisar e tentar novamente
    </Link>
  );
}
