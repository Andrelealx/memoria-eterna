import * as React from "react";
import { cn } from "@/lib/utils";

// Borda com brilho giratório (padrão Magic UI "ShineBorder"). CSS puro, sem JS.
interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  borderRadius?: number;
  color?: string;
  borderWidth?: number;
}

export function ShineBorder({
  children,
  className,
  borderRadius = 24,
  color = "#C6A15B",
  borderWidth = 1,
}: ShineBorderProps) {
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ borderRadius }}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-100%] animate-spin [animation-duration:6s]"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 330deg, ${color} 355deg, transparent 360deg)`,
        }}
      />
      <div
        className="relative h-full w-full bg-card"
        style={{ margin: borderWidth, borderRadius: Math.max(borderRadius - borderWidth, 0) }}
      >
        {children}
      </div>
    </div>
  );
}
