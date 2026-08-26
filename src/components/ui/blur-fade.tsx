"use client";

import * as React from "react";
import { motion } from "framer-motion";
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
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: yOffset, filter: `blur(${blur})` }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
