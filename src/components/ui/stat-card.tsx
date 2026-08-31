import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Card de resumo (dashboard/painel). Opcionalmente clicável via `href`.
interface StatCardProps {
  label: string;
  value: React.ReactNode;
  href?: string;
  className?: string;
}

export function StatCard({ label, value, href, className }: StatCardProps) {
  const classes = cn(
    "rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
    className,
  );
  const content = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(classes, "block")}>
        {content}
      </Link>
    );
  }
  return <div className={classes}>{content}</div>;
}
