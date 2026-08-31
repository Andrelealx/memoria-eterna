import Link from "next/link";
import { Heart } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { brand } from "@/lib/brand";

const FOOTER_LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/modelos", label: "Modelos" },
  { href: "/#precos", label: "Preços" },
  { href: "/ajuda", label: "Ajuda" },
  { href: "/termos", label: "Termos" },
  { href: "/privacidade", label: "Privacidade" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">{brand.tagline}</p>
          </div>

          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-12 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            Feito com <Heart className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> para celebrar memórias
          </p>
          <p className="mt-2">
            © {year} {brand.name}. Todos os direitos reservados.
          </p>
          {brand.legal.companyName && (
            <p className="mt-1 text-xs">
              {brand.legal.companyName}
              {brand.legal.cnpj ? ` • CNPJ ${brand.legal.cnpj}` : ""}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
