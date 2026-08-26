"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Link de navegação que destaca o item ativo (por pathname). Permite usar em
// layouts server components (que não podem chamar `usePathname` diretamente).
interface ActiveNavLinkProps {
  href: string;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

export function ActiveNavLink({ href, className, activeClassName, children }: ActiveNavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={cn(className, active && activeClassName)}>
      {children}
    </Link>
  );
}
