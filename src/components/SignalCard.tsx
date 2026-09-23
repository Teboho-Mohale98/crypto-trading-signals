"use client";

import {
  formatCompact,
  formatPercent,
  formatPrice,
} from "@/lib/format";
import { getSymbolConfig } from "@/lib/symbols";
import type { SymbolSummary } from "@/lib/types";

import { SignalBadge, TONE } from "@/components/SignalBadge";
import { Sparkline } from "@/components/Sparkline";

interface SignalCardProps {
  analysis: SymbolSummary;
  active: boolean;
  onSelect: (symbol: string, interval: string) => void;
}

export function SignalCard({ analysis, active, onSelect }: SignalCardProps) {
  const config = getSymbolConfig(analysis.symbol);
  const up = analysis.market.changePercent24h >= 0;
  const action = analysis.signal.action;
  const accent = TONE(action);

  return (
    <button
      type="button"
      onClick={() => onSelect(analysis.symbol, analysis.interval)}
      aria-pressed={active}
      className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
        active
          ? "border-slate-500/70 bg-slate-900 shadow-lg shadow-black/40 ring-1 ring-slate-400/30"
          : "border-slate-800 bg-slate-900/60 hover:border-slate-600/70 hover:bg-slate-900"
      }`}
    >
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: active ? 1 : 0.5,
        }}
      />
      <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(8rem 4rem at 50% 0%, ${accent}10, transparent 70%)` }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black text-slate-950"
            style={{ background: config.accent }}
            aria-hidden="true"
          >
            {config.base.slice(0, 1)}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-100">{config.label}</p>
            <p className="text-[11px] text-slate-500">{config.description}</p>
          </div>
        </div>
        <SignalBadge signal={action} size="md" />
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-50">
          {formatPrice(analysis.market.price)}
        </span>
        <span
          className={`text-xs font-semibold tabular-nums ${
            up ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {up ? "▲" : "▼"} {formatPercent(analysis.market.changePercent24h)}
        </span>
      </div>

      <div className="mt-3">
        <Sparkline
          values={analysis.sparkline}
          color={up ? "#34d399" : "#fb7185"}
          height={44}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          24h vol{" "}
          <span className="tabular-nums text-slate-400">
            {formatCompact(analysis.market.quoteVolume24h)}
          </span>{" "}
          USDT
        </span>
        <span
          className={`text-xs font-bold uppercase tabular-nums ${
            analysis.signal.confidence >= 60 ? "text-slate-200" : "text-slate-500"
          }`}
        >
          {analysis.signal.confidence}% conf
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
          <span
            className="block h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(
                0,
                ((analysis.signal.score + analysis.signal.maxScore) /
                  (2 * analysis.signal.maxScore)) *
                  100,
              )}%`,
              background: accent,
            }}
          />
        </span>
      </div>
    </button>
  );
}