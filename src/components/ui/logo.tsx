import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

// Símbolo oficial (Manual de Identidade Visual, seção 04 — Símbolo/Ícone):
// coração formado por duas curvas entrelaçadas com um brilho dourado.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 430"
      fill="none"
      aria-hidden="true"
      className={cn("h-8 w-8", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M400 320 C335 260 250 190 245 112 C240 40 320 12 382 55 C394 64 400 75 400 75 C400 75 406 64 418 55 C480 12 560 40 555 112 C550 190 465 260 400 320"
          stroke="#722B45"
          strokeWidth="18"
        />
        <path
          d="M400 318 C328 263 260 218 190 220 C116 222 77 268 90 315 C108 380 210 387 286 354 C334 333 370 304 400 282 C430 304 466 333 514 354 C590 387 692 380 710 315 C723 268 684 222 610 220 C540 218 472 263 400 318 Z"
          stroke="#722B45"
          strokeWidth="18"
        />
        <circle cx="570" cy="150" r="7" fill="#C5A167" stroke="none" />
        <path d="M592 160 C615 165 628 178 631 200" stroke="#C86682" strokeWidth="13" />
        <path d="M598 126 C642 136 668 164 670 205" stroke="#C86682" strokeWidth="13" />
        <path d="M606 91 C669 105 708 146 711 204" stroke="#C86682" strokeWidth="13" />
      </g>
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
