import * as React from "react";
import { cn } from "@/lib/utils";

// Reveal ao rolar (padrão Magic UI / Origin UI). Usado para suavizar a entrada
// de seções e cards na landing e nos templates.
interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  duration?: number;
  blur?: string;
}

export function BlurFade({
  children,
  className,
  delay = 0,
  yOffset = 16,
  duration = 0.5,
  blur = "8px",
}: BlurFadeProps) {
  const style = {
    "--blur-fade-delay": `${delay}s`,
    "--blur-fade-duration": `${duration}s`,
    "--blur-fade-y": `${yOffset}px`,
    "--blur-fade-blur": blur,
  } as React.CSSProperties;
  return (
    <div className={cn("blur-fade", className)} style={style}>
      {children}
    </div>
  );
}
