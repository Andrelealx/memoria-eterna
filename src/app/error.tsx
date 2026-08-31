"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
        <AlertTriangle className="h-8 w-8 text-error" aria-hidden />
      </span>
      <h1 className="mt-6 font-serif text-4xl">Algo não saiu como esperado</h1>
      <p className="mt-4 leading-7 text-muted-foreground">
        Seus dados salvos continuam seguros. Tente novamente ou volte para a página inicial.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>Voltar ao início</Link>
      </div>
      {error.digest && <p className="mt-5 text-xs text-muted-foreground">Código: {error.digest}</p>}
    </main>
  );
}
