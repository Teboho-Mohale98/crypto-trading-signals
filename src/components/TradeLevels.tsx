import { formatPrice } from "@/lib/format";
import type { TradeLevels } from "@/lib/types";

export function TradeLevels({ levels }: { levels: TradeLevels }) {
  if (
    levels.stop === null ||
    levels.target === null ||
    levels.riskPercent === null ||
    levels.rewardPercent === null ||
    levels.riskReward === null
  ) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Trade levels
        </h3>
        <p className="mt-2 text-xs text-slate-500">
          Not enough data to compute ATR-based levels.
        </p>
      </section>
    );
  }

  const long = levels.target >= levels.stop;
  const stopColor = long ? "#fb7185" : "#10b981";
  const targetColor = long ? "#10b981" : "#fb7185";

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          ATR position map
        </h3>
        <span className="text-[10px] text-slate-600">
          ATR(14) {formatPrice(levels.atr)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: stopColor }} />
            Stop loss
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-100">
            {formatPrice(levels.stop)}
          </p>
          <p className="text-[11px] tabular-nums" style={{ color: stopColor }}>
            −{levels.riskPercent.toFixed(2)}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: targetColor }} />
            Take profit
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-100">
            {formatPrice(levels.target)}
          </p>
          <p className="text-[11px] tabular-nums" style={{ color: targetColor }}>
            +{levels.rewardPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
        <span className="text-[10px] uppercase tracking-wide text-slate-500">
          Risk / reward
        </span>
        <span className="text-sm font-black tabular-nums text-slate-100">
          1 : {levels.riskReward.toFixed(2)}
        </span>
        <span className="ml-auto text-[10px] text-slate-600">
          1.5× ATR stop · 2.5× ATR target
        </span>
      </div>
    </section>
  );
}