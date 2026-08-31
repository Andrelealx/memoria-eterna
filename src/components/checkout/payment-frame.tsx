import type { ReactNode } from "react";
import Link from "next/link";
import { CircleHelp, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export function PaymentFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="bg-background relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="bg-primary/5 pointer-events-none absolute -top-28 -right-24 h-80 w-80 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="bg-accent/10 pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full blur-3xl"
      />

      <header className="border-border/70 relative z-10 border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link
            href="/ajuda"
            className="text-muted-foreground hover:text-primary inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors"
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            Ajuda
          </Link>
        </div>
      </header>

      <main
        id="conteudo-pagamento"
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-8 sm:px-6 sm:py-12",
          className,
        )}
      >
        {children}
      </main>

      <footer className="text-muted-foreground relative z-10 mx-auto flex w-full max-w-3xl items-start justify-center gap-2 px-4 pb-6 text-center text-xs leading-5 sm:px-6">
        <ShieldCheck className="text-success mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Em pagamentos Pix, use somente o aplicativo do seu banco. Nunca pedimos sua senha
          bancária.
        </p>
      </footer>
    </div>
  );
}
