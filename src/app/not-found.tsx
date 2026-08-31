import Link from "next/link";
import { HeartCrack } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <HeartCrack className="h-8 w-8 text-primary" aria-hidden />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Erro 404</p>
      <h1 className="mt-2 font-serif text-4xl">Essa página não foi encontrada</h1>
      <p className="mt-4 leading-7 text-muted-foreground">
        O endereço pode ter mudado ou o presente pode não estar mais disponível.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants()}>Voltar ao início</Link>
        <Link href="/ajuda" className={buttonVariants({ variant: "secondary" })}>Preciso de ajuda</Link>
      </div>
    </main>
  );
}
