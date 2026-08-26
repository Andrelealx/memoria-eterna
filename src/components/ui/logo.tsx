import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

// Wordmark textual configurável + símbolo SVG minimalista (duas curvas que
// formam um elo/coração abstrato). Logotipo provisório (seção 7).
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-8 w-8", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 9 C 16 5 22 5 25 10 C 28 15 22 21 16 24 C 10 21 4 15 9 9 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 17 C 5 19 5 21 7 23"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 text-primary", className)}>
      <LogoMark />
      {showText && <span className="font-serif text-xl leading-none">{brand.name}</span>}
    </Link>
  );
}
