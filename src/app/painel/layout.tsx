import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-auth";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/ui/logo";

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  const links = [
    { href: "/painel", label: "Visão geral" },
    { href: "/painel/presentes", label: "Presentes" },
    { href: "/painel/conta", label: "Conta" },
  ];

  return (
    <div className="min-h-screen bg-creme">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-4 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
            <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
            <form action={logout}>
              <button type="submit" className="text-muted-foreground hover:text-error">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
