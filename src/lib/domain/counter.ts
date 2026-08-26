// Cálculo de tempo juntos ("Juntos há...") a partir da data do relacionamento.

export interface TimeTogether {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/** Calcula anos/meses/dias completos entre a data inicial e a data de referência. */
export function timeTogether(fromIso: string, now: Date = new Date()): TimeTogether | null {
  const start = new Date(fromIso);
  if (Number.isNaN(start.getTime())) return null;
  if (start.getTime() > now.getTime()) return null;

  const totalDays = Math.max(0, daysBetween(start, now));

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days), totalDays };
}

/** Rótulo em pt-BR. Ex.: "3 anos, 2 meses e 5 dias". */
export function timeTogetherLabel(fromIso: string, now: Date = new Date()): string {
  const t = timeTogether(fromIso, now);
  if (!t) return "";
  const parts: string[] = [];
  if (t.years > 0) parts.push(`${t.years} ${t.years === 1 ? "ano" : "anos"}`);
  if (t.months > 0) parts.push(`${t.months} ${t.months === 1 ? "mês" : "meses"}`);
  if (t.days > 0 || parts.length === 0) parts.push(`${t.days} ${t.days === 1 ? "dia" : "dias"}`);
  return parts.join(", ");
}
