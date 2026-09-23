import { EMA, MACD, RSI } from "technicalindicators";

import type {
  Candle,
  IndicatorSnapshot,
  RuleResult,
  SignalAction,
  SignalSummary,
} from "@/lib/types";

export const RSI_PERIOD = 14;
export const EMA_FAST_PERIOD = 20;
export const EMA_SLOW_PERIOD = 50;
export const MACD_FAST = 12;
export const MACD_SLOW = 26;
export const MACD_SIGNAL_PERIOD = 9;

function align(values: (number | undefined)[], length: number): (number | null)[] {
  const numbers: number[] = [];
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) numbers.push(v);
  }
  const padded: (number | null)[] = Array(Math.max(0, length - numbers.length)).fill(null);
  for (const v of numbers) {
    padded.push(v);
  }
  return padded;
}

function lastValid(series: (number | null)[]): number | null {
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i] !== null) return series[i];
  }
  return null;
}

function prevValid(series: (number | null)[]): number | null {
  let seen = 0;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i] === null) continue;
    seen += 1;
    if (seen === 2) return series[i];
  }
  return null;
}

export interface ComputedIndicators {
  ema20: (number | null)[];
  ema50: (number | null)[];
  rsi: (number | null)[];
  macd: (number | null)[];
  macdSignal: (number | null)[];
  macdHistogram: (number | null)[];
  snapshot: IndicatorSnapshot;
}

export function computeIndicators(candles: Candle[]): ComputedIndicators {
  const closes = candles.map((c) => c.c);
  const length = closes.length;

  const rsiSeries = align(
    RSI.calculate({ values: closes, period: RSI_PERIOD }),
    length,
  );
  const ema20Series = align(
    EMA.calculate({ values: closes, period: EMA_FAST_PERIOD }),
    length,
  );
  const ema50Series = align(
    EMA.calculate({ values: closes, period: EMA_SLOW_PERIOD }),
    length,
  );

  const macdResult = MACD.calculate({
    values: closes,
    fastPeriod: MACD_FAST,
    slowPeriod: MACD_SLOW,
    signalPeriod: MACD_SIGNAL_PERIOD,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const macdSeries = align(
    macdResult.map((p) => p.MACD),
    length,
  );
  const macdSignalSeries = align(
    macdResult.map((p) => p.signal),
    length,
  );
  const macdHistogramSeries = align(
    macdResult.map((p) => p.histogram),
    length,
  );

  const snapshot: IndicatorSnapshot = {
    rsi: lastValid(rsiSeries),
    ema20: lastValid(ema20Series),
    ema50: lastValid(ema50Series),
    macd: lastValid(macdSeries),
    macdSignal: lastValid(macdSignalSeries),
    macdHistogram: lastValid(macdHistogramSeries),
    macdHistogramPrev: prevValid(macdHistogramSeries),
  };

  return {
    ema20: ema20Series,
    ema50: ema50Series,
    rsi: rsiSeries,
    macd: macdSeries,
    macdSignal: macdSignalSeries,
    macdHistogram: macdHistogramSeries,
    snapshot,
  };
}

function crossedAbove(
  fast: (number | null)[],
  slow: (number | null)[],
  lookback = 3,
): boolean {
  const end = Math.min(fast.length, slow.length);
  const start = Math.max(1, end - lookback);
  for (let i = end - 1; i >= start; i--) {
    const f0 = fast[i - 1];
    const s0 = slow[i - 1];
    const f1 = fast[i];
    const s1 = slow[i];
    if (f0 === null || s0 === null || f1 === null || s1 === null) continue;
    return f0 <= s0 && f1 > s1;
  }
  return false;
}

export function evaluateSignal(
  candles: Candle[],
  indicators: ComputedIndicators,
): SignalSummary {
  const { snapshot } = indicators;
  const price = candles[candles.length - 1]?.c ?? null;
  const rules: RuleResult[] = [];

  // --- RSI (weight 2) ---
  const rsi = snapshot.rsi;
  if (rsi !== null && price !== null) {
    if (rsi <= 30) {
      rules.push({
        indicator: "RSI",
        vote: "BUY",
        weight: 2,
        title: "RSI Oversold",
        detail: `RSI(14) is ${rsi.toFixed(1)} — below the 30 oversold threshold, indicating selling exhaustion.`,
      });
    } else if (rsi >= 70) {
      rules.push({
        indicator: "RSI",
        vote: "SELL",
        weight: 2,
        title: "RSI Overbought",
        detail: `RSI(14) is ${rsi.toFixed(1)} — above the 70 overbought threshold, indicating buying exhaustion.`,
      });
    } else if (rsi < 45) {
      rules.push({
        indicator: "RSI",
        vote: "BUY",
        weight: 1,
        title: "RSI Weak Zone",
        detail: `RSI(14) is ${rsi.toFixed(1)} — in the lower half of the range with room to recover.`,
      });
    } else if (rsi > 55) {
      rules.push({
        indicator: "RSI",
        vote: "SELL",
        weight: 1,
        title: "RSI Strong Zone",
        detail: `RSI(14) is ${rsi.toFixed(1)} — in the upper half of the range with room to cool off.`,
      });
    } else {
      rules.push({
        indicator: "RSI",
        vote: "NEUTRAL",
        weight: 1,
        title: "RSI Neutral",
        detail: `RSI(14) is ${rsi.toFixed(1)} — sitting mid-range with no extreme momentum.`,
      });
    }
  }

  // --- EMA trend (weight 1) ---
  const ema20 = snapshot.ema20;
  const ema50 = snapshot.ema50;
  const goldenCross = crossedAbove(indicators.ema20, indicators.ema50);
  const deathCross = crossedAbove(indicators.ema50, indicators.ema20);

  if (ema20 !== null && ema50 !== null) {
    if (ema20 > ema50) {
      rules.push({
        indicator: "EMA",
        vote: "BUY",
        weight: 1,
        title: goldenCross ? "EMA Golden Cross" : "EMA Bullish Alignment",
        detail: goldenCross
          ? `EMA20 crossed above EMA50 within the last few candles — classic golden cross signal.`
          : `EMA20 (${ema20.toFixed(2)}) is above EMA50 (${ema50.toFixed(2)}) — short-term trend is up.`,
      });
    } else if (ema20 < ema50) {
      rules.push({
        indicator: "EMA",
        vote: "SELL",
        weight: 1,
        title: deathCross ? "EMA Death Cross" : "EMA Bearish Alignment",
        detail: deathCross
          ? `EMA20 crossed below EMA50 within the last few candles — classic death cross signal.`
          : `EMA20 (${ema20.toFixed(2)}) is below EMA50 (${ema50.toFixed(2)}) — short-term trend is down.`,
      });
    } else {
      rules.push({
        indicator: "EMA",
        vote: "NEUTRAL",
        weight: 1,
        title: "EMA Flat",
        detail: "EMA20 and EMA50 are effectively converged — no clear trend.",
      });
    }
  }

  // --- Price vs EMA50 trend filter (weight 1) ---
  if (price !== null && ema50 !== null) {
    const distance = ((price - ema50) / ema50) * 100;
    if (distance > 0) {
      rules.push({
        indicator: "TREND",
        vote: "BUY",
        weight: 1,
        title: "Price Above EMA50",
        detail: `Price is ${distance.toFixed(2)}% above the 50-period EMA — trading in an uptrend.`,
      });
    } else if (distance < 0) {
      rules.push({
        indicator: "TREND",
        vote: "SELL",
        weight: 1,
        title: "Price Below EMA50",
        detail: `Price is ${Math.abs(distance).toFixed(2)}% below the 50-period EMA — trading in a downtrend.`,
      });
    }
  }

  // --- MACD (weight 1) ---
  const { macd, macdSignal, macdHistogram, macdHistogramPrev } = snapshot;
  if (macd !== null && macdSignal !== null && macdHistogram !== null) {
    const accelerating =
      macdHistogramPrev !== null &&
      Math.abs(macdHistogram) > Math.abs(macdHistogramPrev);

    if (macd > macdSignal && macdHistogram > 0) {
      rules.push({
        indicator: "MACD",
        vote: "BUY",
        weight: 1,
        title: accelerating ? "MACD Bullish (Accelerating)" : "MACD Bullish",
        detail: `MACD (${macd.toFixed(2)}) is above its signal line (${macdSignal.toFixed(2)}) with a positive histogram of ${macdHistogram.toFixed(2)}${
          accelerating ? ", and momentum is accelerating." : "."
        }`,
      });
    } else if (macd < macdSignal && macdHistogram < 0) {
      rules.push({
        indicator: "MACD",
        vote: "SELL",
        weight: 1,
        title: accelerating ? "MACD Bearish (Accelerating)" : "MACD Bearish",
        detail: `MACD (${macd.toFixed(2)}) is below its signal line (${macdSignal.toFixed(2)}) with a negative histogram of ${macdHistogram.toFixed(2)}${
          accelerating ? ", and downside momentum is accelerating." : "."
        }`,
      });
    } else {
      rules.push({
        indicator: "MACD",
        vote: "NEUTRAL",
        weight: 1,
        title: "MACD Mixed",
        detail: `MACD (${macd.toFixed(2)}) and its signal line (${macdSignal.toFixed(
          2,
        )}) are converging — momentum is indecisive.`,
      });
    }
  }

  let score = 0;
  let maxScore = 0;
  for (const rule of rules) {
    maxScore += rule.weight;
    if (rule.vote === "BUY") score += rule.weight;
    else if (rule.vote === "SELL") score -= rule.weight;
  }

  let action: SignalAction = "NEUTRAL";
  const normalized = maxScore > 0 ? score / maxScore : 0;
  if (normalized >= 0.5) action = "BUY";
  else if (normalized <= -0.5) action = "SELL";

  const confidence =
    maxScore > 0 ? Math.round(Math.abs(normalized) * 100) : 0;

  return { action, confidence, score, maxScore, rules };
}
