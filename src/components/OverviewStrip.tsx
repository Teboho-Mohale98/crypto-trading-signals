import { formatCompact, formatPercent } from "@/lib/format";
import type { OverviewAggregate } from "@/lib/types";

export function OverviewStrip({ aggregates }: { aggregates: OverviewAggregate }) {
  const avg = aggregates.avgChangePercent24h;
  const avgUp = avg >= 0;

  const items: {
    label: string;
    value: string;
    tone?: string;
  }[] = [
    {
      label: "Tracked pairs",
      value: String(aggregates.trackedSymbols),
    },
    {
      label: "24h volume (Σ)",
      value: `${formatCompact(aggregates.totalQuoteVolume24h)} USDT`,
    },
    {
      label: "Avg 24h move",
      value: formatPercent(avg),
      tone: avgUp ? "text-emerald-400" : "text-rose-400",
    },
    {
      label: "Long signals",
      value: String(aggregates.longs),
      tone: "text-emerald-400",
    },
    {
      label: "Short signals",
      value: String(aggregates.shorts),
      tone: "text-rose-400",
    },
    {
      label: "Best 24h",
      value: aggregates.best
        ? `${aggregates.best.symbol} ${formatPercent(aggregates.best.changePercent24h)}`
        : "—",
      tone: "text-emerald-400",
    },
    {
      label: "Worst 24h",
      value: aggregates.worst
        ? `${aggregates.worst.symbol} ${formatPercent(aggregates.worst.changePercent24h)}`
        : "—",
      tone: "text-rose-400",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"
        >
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            {item.label}
          </p>
          <p
            className={`mt-1 truncate text-sm font-bold tabular-nums ${
              item.tone ?? "text-slate-100"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}