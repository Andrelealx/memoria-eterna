import type { CSSProperties } from "react";

export interface ExperiencePalette {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentSoft: string;
  contrast: string;
}

const PALETTES: Record<string, ExperiencePalette> = {
  vinho: { background: "#fff7f5", surface: "#ffffff", ink: "#2f1720", muted: "#755d65", accent: "#7a2438", accentSoft: "#f4dce2", contrast: "#fffaf8" },
  "rosa-queimado": { background: "#fff7f8", surface: "#ffffff", ink: "#342126", muted: "#80646c", accent: "#a84f68", accentSoft: "#f6dfe6", contrast: "#ffffff" },
  dourado: { background: "#fbf8f0", surface: "#ffffff", ink: "#29251d", muted: "#746b59", accent: "#92702f", accentSoft: "#eee3c8", contrast: "#ffffff" },
  grafite: { background: "#f6f4f3", surface: "#ffffff", ink: "#201d1e", muted: "#6b6567", accent: "#3e3739", accentSoft: "#e5e1e2", contrast: "#ffffff" },
  âmbar: { background: "#fff9ec", surface: "#ffffff", ink: "#332512", muted: "#776548", accent: "#a55d0a", accentSoft: "#f9e3b7", contrast: "#ffffff" },
  coral: { background: "#fff5f1", surface: "#ffffff", ink: "#38201c", muted: "#7d625c", accent: "#b84936", accentSoft: "#f7d9d1", contrast: "#ffffff" },
  areia: { background: "#faf6ed", surface: "#ffffff", ink: "#30291f", muted: "#756b5d", accent: "#8b6940", accentSoft: "#eadfcf", contrast: "#ffffff" },
  rosa: { background: "#fff6f8", surface: "#ffffff", ink: "#38232a", muted: "#80666f", accent: "#a94f70", accentSoft: "#f6dce6", contrast: "#ffffff" },
  oliva: { background: "#f7f8ef", surface: "#ffffff", ink: "#292d20", muted: "#68705a", accent: "#5d7137", accentSoft: "#e1e8cb", contrast: "#ffffff" },
  terracota: { background: "#fff6ef", surface: "#ffffff", ink: "#35241e", muted: "#7b655c", accent: "#a65336", accentSoft: "#f1d8ca", contrast: "#ffffff" },
  céu: { background: "#f1f9fc", surface: "#ffffff", ink: "#1e3038", muted: "#61747c", accent: "#287b9b", accentSoft: "#d5edf5", contrast: "#ffffff" },
  menta: { background: "#f1faf5", surface: "#ffffff", ink: "#1d3428", muted: "#60766a", accent: "#287855", accentSoft: "#d5eee1", contrast: "#ffffff" },
  violeta: { background: "#f9f6ff", surface: "#ffffff", ink: "#2d2340", muted: "#746783", accent: "#7250a5", accentSoft: "#e9def8", contrast: "#ffffff" },
  creme: { background: "#fffaf1", surface: "#ffffff", ink: "#302a21", muted: "#776f62", accent: "#967047", accentSoft: "#efe2cc", contrast: "#ffffff" },
  marfim: { background: "#fcfaf4", surface: "#ffffff", ink: "#292720", muted: "#716d61", accent: "#8b713f", accentSoft: "#eee4ce", contrast: "#ffffff" },
};

export function resolveExperiencePalette(scheme: string, fallback = "vinho") {
  return PALETTES[scheme] ?? PALETTES[fallback] ?? PALETTES.vinho;
}

export function experienceStyle(scheme: string, fallback: string): CSSProperties {
  const palette = resolveExperiencePalette(scheme, fallback);
  return {
    "--exp-bg": palette.background,
    "--exp-surface": palette.surface,
    "--exp-ink": palette.ink,
    "--exp-muted": palette.muted,
    "--exp-accent": palette.accent,
    "--exp-soft": palette.accentSoft,
    "--exp-contrast": palette.contrast,
  } as CSSProperties;
}
