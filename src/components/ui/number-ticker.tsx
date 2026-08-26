"use client";

import * as React from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// Número animado que "conta" até o valor ao entrar na tela (padrão Magic UI).
interface NumberTickerProps {
  value: number;
  className?: string;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  className,
  decimalPlaces = 0,
  prefix = "",
  suffix = "",
}: NumberTickerProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 30 });

  React.useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  React.useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest.toFixed(decimalPlaces)}${suffix}`;
      }
    });
  }, [spring, decimalPlaces, prefix, suffix]);

  return (
    <span ref={ref} className={cn(className)}>
      {`${prefix}${(0).toFixed(decimalPlaces)}${suffix}`}
    </span>
  );
}
