import * as React from "react";
import { cn } from "@/lib/utils";

// Faixa deslizante (padrão Magic UI). Sem dependência de JS: animação CSS pura.
interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
}

export function Marquee({ children, className, reverse = false, pauseOnHover = false }: MarqueeProps) {
  return (
    <div className={cn("group flex w-full overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-max animate-marquee",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
      >
        {[0, 1].map((i) => (
          <div key={i} aria-hidden={i === 1} className="flex shrink-0 items-center gap-8 pr-8">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
