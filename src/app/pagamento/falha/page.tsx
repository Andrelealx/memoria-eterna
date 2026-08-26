import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pagamento recusado" };

export default function FalhaPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-error/15">
        <X className="h-8 w-8 text-error" />
      </span>
      <h1 className="mt-6 font-serif text-3xl">Pagamento não concluído</h1>
      <p className="mt-3 text-muted-foreground">
        Não foi possível concluir o pagamento. Tente novamente com outra forma de pagamento.
      </p>
      <Link href="/" className={buttonVariants({ variant: "secondary", className: "mt-8" })}>
        Voltar ao início
      </Link>
    </div>
  );
}
