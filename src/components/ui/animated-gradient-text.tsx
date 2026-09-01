import * as React from "react";
import { cn } from "@/lib/utils";

// Texto com gradiente animado (padrão Magic UI "AnimatedGradientText"). CSS puro.
interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedGradientText({ children, className }: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        "bg-[linear-gradient(to_right,#722B45,#C5A167,#C86682,#722B45)] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient",
        className,
      )}
    >
      {children}
    </span>
  );
}
