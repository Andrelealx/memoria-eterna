import Link from "next/link";
import { getMetricsSummary, type FunnelRow } from "@/lib/server/analytics-metrics";

export const metadata = { title: "Métricas" };

const PERIODS = { "7": "7 dias", "30": "30 dias", "90": "90 dias", all: "Tudo" } as const;

function FunnelBars({ title, totalSessions, funnel }: { title: string; totalSessions: number; funnel: FunnelRow[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-serif text-lg">{title}</h3>
        <span className="text-sm text-muted-foreground">{totalSessions} sessões</span>
      </div>
      {totalSessions === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Sem sessões nesse período.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {funnel.map((row) => (
            <div key={row.stage}>
              <div className="flex items-center justify-between text-sm">
                <span>{row.label}</span>
                <span className="text-muted-foreground">
                  {row.sessions} · {row.pctOfTotal}%
                  {row.pctOfPrevious !== null && (
                    <span className="ml-1 text-xs">(≈{row.pctOfPrevious}% da etapa anterior)</span>
                  )}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${row.pctOfTotal}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function AdminMetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const period = periodo && periodo in PERIODS ? periodo : "30";
  const days = period === "all" ? null : Number(period);

  const summary = await getMetricsSummary(days);

  return (
    <div>
      <h1 className="font-serif text-3xl">Métricas</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Funil real de visitantes até o início do checkout, separado por tráfego pago (Meta Ads) e
        orgânico — para achar onde as pessoas estão parando antes de comprar.
      </p>

      <form method="get" className="mt-6 flex flex-wrap gap-3">
        <select
          name="periodo"
          defaultValue={period}
          className="border-border bg-card rounded-xl border px-3 py-2 text-sm"
        >
          {Object.entries(PERIODS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Sessões no período</p>
          <p className="mt-1 font-serif text-3xl">{summary.totalSessions}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Pedidos pagos</p>
          <p className="mt-1 font-serif text-3xl">{summary.ordersPaid}</p>
        </div>
        <Link
          href="/admin/falhas"
          className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
        >
          <p className="text-sm text-muted-foreground">Pagamentos com falha</p>
          <p className="mt-1 text-sm text-primary underline">Ver painel de falhas →</p>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <FunnelBars title="Tráfego pago (Meta Ads)" totalSessions={summary.paid.totalSessions} funnel={summary.paid.funnel} />
        <FunnelBars title="Tráfego orgânico" totalSessions={summary.organic.totalSessions} funnel={summary.organic.funnel} />
      </div>

      {summary.paidSources.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-serif text-lg">Origem do tráfego pago</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            fb = Feed do Facebook · ig = Instagram · an = Audience Network (apps de terceiros, costuma
            ser clique de baixa qualidade) · msg = Messenger
          </p>
          <ul className="mt-4 space-y-2">
            {summary.paidSources.map((s) => (
              <li key={s.source} className="flex items-center justify-between text-sm">
                <span className="font-mono">{s.source}</span>
                <span className="text-muted-foreground">{s.sessions} sessões</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
