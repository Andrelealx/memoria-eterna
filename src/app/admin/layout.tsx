import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/require-auth";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/ui/logo";
import { ActiveNavLink } from "@/components/ui/active-nav-link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/falhas", label: "Falhas" },
  { href: "/admin/nfc", label: "NFC" },
  { href: "/admin/planos", label: "Planos" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/depoimentos", label: "Depoimentos" },
  { href: "/admin/cupons", label: "Cupons" },
  { href: "/admin/denuncias", label: "Denúncias" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/auditoria", label: "Auditoria" },
];

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(["ADMIN", "OPERATOR"]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className="text-sm text-muted-foreground hover:text-error">
                Sair
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {LINKS.map((l) => (
            <ActiveNavLink
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
              activeClassName="bg-secondary font-medium text-primary"
            >
              {l.label}
            </ActiveNavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
