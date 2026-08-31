import type { ReactNode } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-auth";
import { isStaff } from "@/lib/auth/authorize";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/ui/logo";
import { ActiveNavLink } from "@/components/ui/active-nav-link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const links = [
    { href: "/painel", label: "Visão geral" },
    { href: "/painel/presentes", label: "Presentes" },
    { href: "/painel/pedidos", label: "Pedidos" },
    { href: "/painel/conta", label: "Conta" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
            <ThemeToggle />
            <form action={logout}>
              <button type="submit" className="text-sm text-muted-foreground hover:text-error">Sair</button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3 text-sm" aria-label="Área do cliente">
          {links.map((l) => (
              <ActiveNavLink
                key={l.href}
                href={l.href}
                className="shrink-0 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                activeClassName="bg-secondary font-medium text-primary"
              >
                {l.label}
              </ActiveNavLink>
          ))}
          {isStaff(user) && (
              <ActiveNavLink
                href="/admin"
                className="shrink-0 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                activeClassName="bg-secondary font-medium text-primary"
              >
                Admin
              </ActiveNavLink>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
