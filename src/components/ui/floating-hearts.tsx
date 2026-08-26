"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Corações flutuando suavemente (ambientação romântica). Decorativo e acessível:
// `aria-hidden` + `pointer-events-none`, sem impacto no fluxo.
interface FloatingHeartsProps {
  className?: string;
  count?: number;
  color?: string;
}

export function FloatingHearts({ className, count = 12, color = "#D99AAA" }: FloatingHeartsProps) {
  const hearts = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: `${(i * 8 + 4) % 100}%`,
        top: `${(i * 13 + 2) % 100}%`,
        size: 10 + ((i * 7) % 18),
        delay: (i * 0.6) % 6,
        duration: 5 + (i % 5),
        opacity: 0.12 + ((i * 13) % 30) / 100,
      })),
    [count],
  );

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {hearts.map((h) => (
        <motion.span
          key={h.id}
          className="absolute select-none"
          style={{ left: h.left, top: h.top, fontSize: h.size, opacity: h.opacity, color }}
          animate={{ y: [0, -16, 0], opacity: [h.opacity, h.opacity + 0.08, h.opacity] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          ♥
        </motion.span>
      ))}
    </div>
  );
}
