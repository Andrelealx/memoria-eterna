import { prisma } from "@/lib/db";

// Funil de conversão (seção de métricas do admin). Os eventos já eram
// gravados pelo AnalyticsTracker (page_view, cta_click, template_select,
// checkout_start), mas não existia nenhum painel para consultá-los — só
// dava para ver rodando query direto no banco.

const FUNNEL_STAGES = ["page_view", "cta_click", "template_select", "checkout_start"] as const;
type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  page_view: "Visitou o site",
  cta_click: "Clicou em algum CTA",
  template_select: "Escolheu um modelo",
  checkout_start: "Iniciou o checkout",
};

export interface FunnelRow {
  stage: FunnelStage;
  label: string;
  sessions: number;
  pctOfTotal: number;
  pctOfPrevious: number | null;
}

export interface SourceBreakdown {
  source: string;
  sessions: number;
}

export interface MetricsSummary {
  since: Date | null;
  totalSessions: number;
  paid: { totalSessions: number; funnel: FunnelRow[] };
  organic: { totalSessions: number; funnel: FunnelRow[] };
  paidSources: SourceBreakdown[];
  ordersPaid: number;
}

function buildFunnel(sessionEvents: Map<string, Set<string>>, sessionIds: Set<string>): FunnelRow[] {
  const rows: FunnelRow[] = [];
  const total = sessionIds.size;
  let previous: number | null = null;

  for (const stage of FUNNEL_STAGES) {
    let count = 0;
    for (const sid of sessionIds) {
      if (sessionEvents.get(sid)?.has(stage)) count++;
    }
    rows.push({
      stage,
      label: FUNNEL_STAGE_LABELS[stage],
      sessions: count,
      pctOfTotal: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      pctOfPrevious: previous !== null && previous > 0 ? Math.round((count / previous) * 1000) / 10 : null,
    });
    previous = count;
  }
  return rows;
}

export async function getMetricsSummary(days: number | null): Promise<MetricsSummary> {
  const since = days === null ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [events, ordersPaid] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: since ? { createdAt: { gte: since } } : undefined,
      select: { event: true, session: true, campaign: true, utm: true },
    }),
    prisma.order.count({
      where: { status: "PAID", ...(since ? { createdAt: { gte: since } } : {}) },
    }),
  ]);

  const sessionEvents = new Map<string, Set<string>>();
  const paidSessions = new Set<string>();
  const organicSessions = new Set<string>();
  const sourceCounts = new Map<string, Set<string>>();

  for (const e of events) {
    if (!e.session) continue;
    if (!sessionEvents.has(e.session)) sessionEvents.set(e.session, new Set());
    sessionEvents.get(e.session)!.add(e.event);

    if (e.campaign) {
      paidSessions.add(e.session);
      const utm = e.utm as { utm_source?: string } | null;
      const source = utm?.utm_source ?? "desconhecido";
      if (!sourceCounts.has(source)) sourceCounts.set(source, new Set());
      sourceCounts.get(source)!.add(e.session);
    } else {
      organicSessions.add(e.session);
    }
  }

  const paidSources: SourceBreakdown[] = [...sourceCounts.entries()]
    .map(([source, sessions]) => ({ source, sessions: sessions.size }))
    .sort((a, b) => b.sessions - a.sessions);

  return {
    since,
    totalSessions: sessionEvents.size,
    paid: { totalSessions: paidSessions.size, funnel: buildFunnel(sessionEvents, paidSessions) },
    organic: { totalSessions: organicSessions.size, funnel: buildFunnel(sessionEvents, organicSessions) },
    paidSources,
    ordersPaid,
  };
}
