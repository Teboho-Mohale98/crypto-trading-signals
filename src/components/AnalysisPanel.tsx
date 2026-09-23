"use client";

import { formatPrice } from "@/lib/format";
import { getSymbolConfig } from "@/lib/symbols";
import type { SymbolAnalysis } from "@/lib/types";

import { RuleList } from "@/components/RuleList";
import { SignalBadge, TONE } from "@/components/SignalBadge";

export function rsiZone(rsi: number | null): {
  label: string;
  tone: string;
  color: string;
} {
  if (rsi === null)
    return { label: "—", tone: "text-slate-500", color: "#94a3b8" };
  if (rsi <= 30)
    return { label: "Oversold", tone: "text-emerald-400", color: "#34d399" };
  if (rsi >= 70)
    return { label: "Overbought", tone: "text-rose-400", color: "#fb7185" };
  if (rsi < 45)
    return { label: "Weak", tone: "text-cyan-400", color: "#22d3ee" };
  if (rsi > 55)
    return { label: "Strong", tone: "text-amber-400", color: "#fbbf24" };
  return { label: "Neutral", tone: "text-slate-400", color: "#94a3b8" };
}

function adxTone(adx: number | null, pdi: number | null, mdi: number | null): {
  label: string;
  tone: string;
} {
  if (adx === null) return { label: "—", tone: "text-slate-500" };
  if (adx >= 25 && pdi !== null && mdi !== null)
    return pdi > mdi
      ? { label: "Strong uptrend", tone: "text-emerald-400" }
      : { label: "Strong downtrend", tone: "text-rose-400" };
  if (adx < 20) return { label: "No trend / ranging", tone: "text-slate-500" };
  return { label: "Trend strengthening", tone: "text-amber-400" };
}

export function AnalysisPanel({
  analysis,
  interval,
}: {
  analysis: SymbolAnalysis;
  interval: string;
}) {
  const config = getSymbolConfig(analysis.symbol);
  const { indicators: ind, signal } = analysis;
  const accent = TONE(signal.action);
  const macdUp =
    ind.macdHistogram !== null &&
    ind.macdHistogramPrev !== null &&
    ind.macdHistogram > ind.macdHistogramPrev;
  const rsi = rsiZone(ind.rsi);
  const adx = adxTone(ind.adx, ind.pdi, ind.mdi);

  const emaBull = ind.ema20 !== null && ind.ema50 !== null && ind.ema20 > ind.ema50;

  const items: { label: string; value: string; sub?: string; tone?: string }[] = [
    {
      label: "RSI (14)",
      value: ind.rsi !== null ? ind.rsi.toFixed(1) : "—",
      sub: rsi.label,
      tone: rsi.tone,
    },
    {
      label: "Stoch RSI",
      value: ind.stochRsi !== null ? ind.stochRsi.toFixed(2) : "—",
      sub:
        ind.stochRsi !== null
          ? ind.stochRsi <= 0.2
            ? "Oversold"
            : ind.stochRsi >= 0.8
              ? "Overbought"
              : ind.stochRsi < 0.5
                ? "Momentum low"
                : "Momentum high"
          : "—",
      tone:
        ind.stochRsi !== null
          ? ind.stochRsi <= 0.2
            ? "text-emerald-400"
            : ind.stochRsi >= 0.8
              ? "text-rose-400"
              : "text-slate-400"
          : "text-slate-500",
    },
    {
      label: "MACD Histogram",
      value: ind.macdHistogram !== null ? formatPrice(ind.macdHistogram) : "—",
      sub:
        ind.macdHistogram !== null
          ? ind.macdHistogram >= 0
            ? macdUp
              ? "Bullish · rising"
              : "Bullish · fading"
            : macdUp
              ? "Bearish · easing"
              : "Bearish · deepening"
          : "—",
      tone: ind.macdHistogram !== null && ind.macdHistogram >= 0 ? "text-emerald-400" : "text-rose-400",
    },
    {
      label: "EMA 20",
      value: ind.ema20 !== null ? formatPrice(ind.ema20) : "—",
    },
    {
      label: "EMA 50",
      value: ind.ema50 !== null ? formatPrice(ind.ema50) : "—",
    },
    {
      label: "EMA Trend",
      value: emaBull ? "Bullish" : "Bearish",
      sub: ind.ema20 !== null && ind.ema50 !== null
        ? `Gap ${((Math.abs(ind.ema20 - ind.ema50) / ind.ema50) * 100).toFixed(2)}%`
        : "—",
      tone: emaBull ? "text-emerald-400" : "text-rose-400",
    },
    {
      label: "ADX (14)",
      value: ind.adx !== null ? ind.adx.toFixed(1) : "—",
      sub: adx.label,
      tone: adx.tone,
    },
    {
      label: "Bollinger",
      value:
        ind.bbUpper !== null && ind.bbLower !== null && ind.bbMiddle !== null
          ? `±${(((ind.bbUpper - ind.bbLower) / 2 / ind.bbMiddle) * 100).toFixed(2)}%`
          : "—",
      sub: ind.bbUpper !== null && ind.bbLower !== null && ind.bbMiddle !== null
        ? ((ind.bbUpper - ind.bbLower) / ind.bbMiddle) * 100 < 4
          ? "Squeeze"
          : "In range"
        : "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Active signal
            </p>
            {signal.tier === "STRONG" && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300"
              >
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
                </svg>
                Strong
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <SignalBadge signal={signal.action} size="lg" />
            <div>
              <p className="text-2xl font-black tabular-nums text-slate-50">
                {signal.confidence}%
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">
                confidence
              </p>
            </div>
          </div>
        </div>
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full border-2"
          style={{
            borderColor: accent,
            background: `radial-gradient(circle, ${accent}22, transparent 70%)`,
          }}
        >
          <span
            className="text-xl font-black tabular-nums"
            style={{ color: accent }}
          >
            {signal.confidence >= 60 ? signal.confidence : "—"}
          </span>
        </div>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-slate-800"
        title={`Score ${signal.score} / ${signal.maxScore}`}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.max(
              0,
              ((signal.score + signal.maxScore) / (2 * signal.maxScore)) * 100,
            )}%`,
            background: `linear-gradient(90deg, ${accent}66, ${accent})`,
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"
          >
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-100">
              {item.value}
            </p>
            {item.sub && (
              <p className={`text-[11px] font-semibold ${item.tone ?? "text-slate-500"}`}>
                {item.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {analysis.divergence.rsi && (
        <div
          className={`rounded-xl border p-3 ${
            analysis.divergence.rsi === "bullish"
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-rose-500/30 bg-rose-500/10"
          }`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-widest ${
              analysis.divergence.rsi === "bullish"
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            {analysis.divergence.rsi === "bullish"
              ? "Bullish divergence"
              : "Bearish divergence"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
            {analysis.divergence.note}
          </p>
        </div>
      )}

      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Rule breakdown
          <span className="text-slate-700">· {config.symbol} on {interval}</span>
        </p>
        <RuleList rules={signal.rules} />
      </div>
    </div>
  );
}