import type { BacktestMetrics, BacktestResult } from "@/lib/types";

function MetricRow({
  label,
  metrics,
  actionTone,
}: {
  label: string;
  metrics: BacktestMetrics;
  actionTone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="text-xs font-black tabular-nums" style={{ color: actionTone }}>
          {metrics.total > 0 ? `${metrics.winRate.toFixed(0)}%` : "—"}
        </p>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
        <span>{metrics.wins}W · {metrics.losses}L</span>
        <span className="tabular-nums">{metrics.total} setups</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${metrics.total > 0 ? metrics.winRate : 0}%`,
            background: actionTone,
          }}
        />
      </div>
    </div>
  );
}

export function BacktestPanel({ backtest }: { backtest: BacktestResult }) {
  const totalSetups =
    backtest.buy.total +
    backtest.sell.total +
    backtest.strongBuy.total +
    backtest.strongSell.total;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Strategy backtest
        </h3>
        <span className="text-[10px] text-slate-600">
          ±{backtest.thresholdPercent.toFixed(1)}% · {backtest.horizonCandles} candles ahead
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <MetricRow label="Strong buy" metrics={backtest.strongBuy} actionTone="#10b981" />
        <MetricRow label="Buy" metrics={backtest.buy} actionTone="#34d399" />
        <MetricRow label="Strong sell" metrics={backtest.strongSell} actionTone="#f43f5e" />
        <MetricRow label="Sell" metrics={backtest.sell} actionTone="#fb7185" />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-500">
        <span>
          Historic win-rate across {backtest.candlesCount} candles
        </span>
        <span className="font-bold text-slate-300">
          {totalSetups} setups
        </span>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
        Research-grade replay: an alert fires at candle close, a trade wins if
        price moves ±{backtest.thresholdPercent.toFixed(1)}% within the next{" "}
        {backtest.horizonCandles} candles. Past performance does not guarantee
        future results.
      </p>
    </section>
  );
}