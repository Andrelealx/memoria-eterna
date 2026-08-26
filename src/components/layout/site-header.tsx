"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/modelos", label: "Modelos" },
  { href: "/#precos", label: "Preços" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <ScrollProgress />
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-colors duration-200",
          scrolled
            ? "border-border bg-background/95 backdrop-blur"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />

          <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "hover:text-primary text-sm font-medium transition-colors",
                  isActive(l.href) ? "text-primary" : "text-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/entrar" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Entrar
            </Link>
            <Link href="/criar" className={buttonVariants({ variant: "shiny", size: "sm" })}>
              Criar meu presente
            </Link>
          </div>

          <button
            type="button"
            className="text-foreground inline-flex h-10 w-10 items-center justify-center rounded-xl md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <nav
            id="mobile-nav"
            aria-label="Navegação móvel"
            className="border-border bg-background border-t px-4 pt-2 pb-4 md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="hover:bg-secondary block rounded-xl px-3 py-2.5 text-base font-medium"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 flex flex-col gap-2">
                <Link
                  href="/entrar"
                  onClick={() => setOpen(false)}
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Entrar
                </Link>
                <Link href="/criar" onClick={() => setOpen(false)} className={buttonVariants({})}>
                  Criar meu presente
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}
