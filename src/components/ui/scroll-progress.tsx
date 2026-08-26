"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// Barra fina de progresso de rolagem no topo (padrão Cult UI "ScrollProgress").
interface ScrollProgressProps {
  className?: string;
}

export function ScrollProgress({ className }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-primary via-accent to-primary",
        className,
      )}
      style={{ scaleX }}
    />
  );
}
