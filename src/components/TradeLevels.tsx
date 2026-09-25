import { formatPrice } from "@/lib/format";
import type { TradeLevels as TradeLevelsType } from "@/lib/types";

export function TradeLevels({ levels }: { levels: TradeLevelsType }) {
  if (
    levels.entry === null ||
    levels.stopLoss === null ||
    levels.tp1 === null ||
    levels.tp2 === null ||
    levels.tp3 === null ||
    levels.tp4 === null ||
    levels.riskPercent === null ||
    levels.tp1Percent === null ||
    levels.tp2Percent === null ||
    levels.tp3Percent === null ||
    levels.tp4Percent === null ||
    levels.riskReward === null
  ) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Trade plan
        </h3>
        <p className="mt-2 text-xs text-slate-500">
          The signal is neutral — no actionable entry, stop loss or take-profit
          levels. Levels are only published for BUY / SELL setups.
        </p>
      </section>
    );
  }

  const long = levels.tp1 >= levels.stopLoss;
  const lossColor = long ? "#fb7185" : "#34d399";
  const gainColor = long ? "#34d399" : "#fb7185";

  const cells: {
    label: string;
    value: number;
    pct: number;
    color?: string;
    hint?: string;
  }[] = [
    {
      label: "Entry",
      value: levels.entry,
      pct: 0,
      hint: "Market",
    },
    {
      label: "Stop Loss",
      value: levels.stopLoss,
      pct: -levels.riskPercent,
      color: lossColor,
      hint: "1.5× ATR",
    },
    {
      label: "Take Profit 1",
      value: levels.tp1,
      pct: levels.tp1Percent,
      color: gainColor,
      hint: "1× ATR",
    },
    {
      label: "Take Profit 2",
      value: levels.tp2,
      pct: levels.tp2Percent,
      color: gainColor,
      hint: "2× ATR",
    },
    {
      label: "Take Profit 3",
      value: levels.tp3,
      pct: levels.tp3Percent,
      color: gainColor,
      hint: "3× ATR",
    },
    {
      label: "Take Profit 4",
      value: levels.tp4,
      pct: levels.tp4Percent,
      color: gainColor,
      hint: "4.5× ATR",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Trade plan — entry · SL · TP1–4
        </h3>
        <span className="text-[10px] text-slate-600">
          ATR(14) {formatPrice(levels.atr)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cells.map((c) => {
          const showPct = c.pct !== 0;
          return (
            <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: c.color ?? "#94a3b8" }}
                />
                {c.label}
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-100">
                {formatPrice(c.value)}
              </p>
              <p className="text-[11px] tabular-nums" style={{ color: c.color ?? "#64748b" }}>
                {showPct
                  ? `${c.pct > 0 ? "+" : ""}${c.pct.toFixed(2)}%`
                  : "Market entry"}
              </p>
              {c.hint && (
                <p className="mt-0.5 text-[10px] text-slate-600">{c.hint}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
        <span className="text-[10px] uppercase tracking-wide text-slate-500">
          Risk / reward (final TP)
        </span>
        <span className="text-sm font-black tabular-nums text-slate-100">
          1 : {levels.riskReward.toFixed(2)}
        </span>
        <span className="ml-auto text-[10px] text-slate-600">
          {long ? "Long" : "Short"} · scale-out 1 / 2 / 3 / 4.5× ATR targets
        </span>
      </div>
    </section>
  );
}