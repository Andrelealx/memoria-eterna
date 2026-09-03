"use client";

import * as React from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// Número animado que "conta" até o valor ao entrar na tela (padrão Magic UI).
//
// O valor real é renderizado no HTML do servidor — nunca "0". Se o JavaScript
// não rodar (robô de busca, prévia de link, aparelho lento, movimento
// reduzido), o número correto continua aparecendo; a contagem é só um enfeite
// que acontece por cima quando dá.
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
  // Ref em vez de estado: só libera a escrita no DOM, não precisa re-renderizar.
  const animating = React.useRef(false);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 30 });

  React.useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animating.current = true;
    motionValue.set(value);
  }, [inView, value, motionValue]);

  React.useEffect(() => {
    return spring.on("change", (latest) => {
      if (!animating.current) return;
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest.toFixed(decimalPlaces)}${suffix}`;
      }
    });
  }, [spring, decimalPlaces, prefix, suffix]);

  return (
    <span ref={ref} className={cn(className)}>
      {`${prefix}${value.toFixed(decimalPlaces)}${suffix}`}
    </span>
  );
}
