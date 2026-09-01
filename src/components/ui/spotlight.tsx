"use client";

import * as React from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// Glow que segue o mouse (padrão Cult UI "Spotlight"). Aplica um gradiente radial
// suave atrás do conteúdo. Respeita `prefers-reduced-motion` via CSS global.
interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  size?: number;
}

export function Spotlight({ children, className, color = "#C5A167", size = 420 }: SpotlightProps) {
  const x = useMotionValue(-size / 2);
  const y = useMotionValue(-size / 2);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - size / 2);
    y.set(e.clientY - rect.top - size / 2);
  };

  const background = useMotionTemplate`radial-gradient(${size}px circle at ${springX}px ${springY}px, ${color}26, transparent 70%)`;

  return (
    <div className={cn("relative overflow-hidden", className)} onMouseMove={handleMouseMove}>
      <motion.div className="pointer-events-none absolute inset-0" style={{ background }} aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
