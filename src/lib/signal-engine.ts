import { ADX, ATR, BollingerBands, EMA, MACD, RSI, StochasticRSI } from "technicalindicators";

import type {
  Candle,
  DivergenceInfo,
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
export const BB_PERIOD = 20;
export const BB_STDDEV = 2;
export const STOCH_RSI_PERIOD = 14;
export const ADX_PERIOD = 14;
export const ATR_PERIOD = 14;

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

export interface ComputedIndicators {
  ema20: (number | null)[];
  ema50: (number | null)[];
  rsi: (number | null)[];
  macd: (number | null)[];
  macdSignal: (number | null)[];
  macdHistogram: (number | null)[];
  bbUpper: (number | null)[];
  bbMiddle: (number | null)[];
  bbLower: (number | null)[];
  stochRsi: (number | null)[];
  adx: (number | null)[];
  pdi: (number | null)[];
  mdi: (number | null)[];
  atr: (number | null)[];
  snapshots: Record<number, IndicatorSnapshot>;
}

export function computeIndicators(candles: Candle[]): ComputedIndicators {
  const closes = candles.map((c) => c.c);
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
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

  const bbResult = BollingerBands.calculate({
    period: BB_PERIOD,
    stdDev: BB_STDDEV,
    values: closes,
  });
  const bbUpperSeries = align(
    bbResult.map((b) => b.upper),
    length,
  );
  const bbMiddleSeries = align(
    bbResult.map((b) => b.middle),
    length,
  );
  const bbLowerSeries = align(
    bbResult.map((b) => b.lower),
    length,
  );

  const stochResult = StochasticRSI.calculate({
    values: closes,
    rsiPeriod: RSI_PERIOD,
    stochasticPeriod: STOCH_RSI_PERIOD,
    kPeriod: 3,
    dPeriod: 3,
  });
  const stochSeries = align(
    stochResult.map((s) => s.k),
    length,
  );

  const adxResult = ADX.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: ADX_PERIOD,
  });
  const adxSeries = align(
    adxResult.map((a) => a.adx),
    length,
  );
  const pdiSeries = align(
    adxResult.map((a) => a.pdi),
    length,
  );
  const mdiSeries = align(
    adxResult.map((a) => a.mdi),
    length,
  );

  const atrSeries = align(
    ATR.calculate({ high: highs, low: lows, close: closes, period: ATR_PERIOD }),
    length,
  );

  const snapshots: Record<number, IndicatorSnapshot> = {};
  for (let i = 0; i < length; i++) {
    snapshots[i] = {
      rsi: rsiSeries[i],
      ema20: ema20Series[i],
      ema50: ema50Series[i],
      macd: macdSeries[i],
      macdSignal: macdSignalSeries[i],
      macdHistogram: macdHistogramSeries[i],
      macdHistogramPrev: i > 0 ? macdHistogramSeries[i - 1] : null,
      bbUpper: bbUpperSeries[i],
      bbMiddle: bbMiddleSeries[i],
      bbLower: bbLowerSeries[i],
      stochRsi: stochSeries[i],
      adx: adxSeries[i],
      pdi: pdiSeries[i],
      mdi: mdiSeries[i],
      atr: atrSeries[i],
    };
  }

  return {
    ema20: ema20Series,
    ema50: ema50Series,
    rsi: rsiSeries,
    macd: macdSeries,
    macdSignal: macdSignalSeries,
    macdHistogram: macdHistogramSeries,
    bbUpper: bbUpperSeries,
    bbMiddle: bbMiddleSeries,
    bbLower: bbLowerSeries,
    stochRsi: stochSeries,
    adx: adxSeries,
    pdi: pdiSeries,
    mdi: mdiSeries,
    atr: atrSeries,
    snapshots,
  };
}

function crossedAbove(
  fast: (number | null)[],
  slow: (number | null)[],
  upTo: number,
  lookback = 3,
): boolean {
  const end = Math.min(fast.length - 1, slow.length - 1, upTo);
  const start = Math.max(1, end - lookback);
  for (let i = end; i > start; i--) {
    const f0 = fast[i - 1];
    const s0 = slow[i - 1];
    const f1 = fast[i];
    const s1 = slow[i];
    if (f0 === null || s0 === null || f1 === null || s1 === null) continue;
    return f0 <= s0 && f1 > s1;
  }
  return false;
}

interface Pivot {
  index: number;
  price: number;
  rsi: number;
}

function findPivots(
  closes: number[],
  rsi: (number | null)[],
  windowSize = 3,
): { lows: Pivot[]; highs: Pivot[] } {
  const lows: Pivot[] = [];
  const highs: Pivot[] = [];
  const n = closes.length;
  for (let i = windowSize; i < n - windowSize; i++) {
    const r = rsi[i];
    if (r === null) continue;
    const slice = closes.slice(i - windowSize, i + windowSize + 1);
    const min = Math.min(...slice);
    const max = Math.max(...slice);
    if (closes[i] === min) {
      lows.push({ index: i, price: closes[i], rsi: r });
    }
    if (closes[i] === max) {
      highs.push({ index: i, price: closes[i], rsi: r });
    }
  }
  return { lows, highs };
}

function detectRsiDivergence(
  closes: number[],
  rsi: (number | null)[],
): DivergenceInfo {
  const { lows, highs } = findPivots(closes, rsi, 3);

  // Bullish: price makes lower low, RSI makes higher low.
  if (lows.length >= 2) {
    const a = lows[lows.length - 2];
    const b = lows[lows.length - 1];
    const withinPercent = Math.abs(a.price - b.price) / a.price < 0.2;
    if (withinPercent && b.price < a.price && b.rsi > a.rsi) {
      return {
        rsi: "bullish",
        note: `Price printed a lower low (${
          b.price.toLocaleString("en-US", { maximumFractionDigits: 2 })
        }) while RSI printed a higher low (${a.rsi.toFixed(1)} → ${b.rsi.toFixed(
          1,
        )}) — hidden bullish momentum.`,
      };
    }
  }

  // Bearish: price makes higher high, RSI makes lower high.
  if (highs.length >= 2) {
    const a = highs[highs.length - 2];
    const b = highs[highs.length - 1];
    const withinPercent = Math.abs(a.price - b.price) / a.price < 0.2;
    if (withinPercent && b.price > a.price && b.rsi < a.rsi) {
      return {
        rsi: "bearish",
        note: `Price printed a higher high (${
          b.price.toLocaleString("en-US", { maximumFractionDigits: 2 })
        }) while RSI printed a lower high (${a.rsi.toFixed(1)} → ${b.rsi.toFixed(
          1,
        )}) — weakening bullish momentum.`,
      };
    }
  }

  return { rsi: null, note: "No divergence detected between price and RSI momentum." };
}

function computeVotes(
  candles: Candle[],
  ind: ComputedIndicators,
  i: number,
  divergence: DivergenceInfo,
): RuleResult[] {
  const s = ind.snapshots[i];
  const price = candles[i]?.c ?? null;
  const rules: RuleResult[] = [];

  const rsi = s.rsi;
  if (rsi !== null && price !== null && s.ema20 !== null && s.ema50 !== null) {
    const inTrendContext = s.ema20 > s.ema50;

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
    } else if (inTrendContext && rsi < 50) {
      rules.push({
        indicator: "RSI",
        vote: "BUY",
        weight: 1,
        title: "RSI Pullback in Uptrend",
        detail: `RSI(14) is ${rsi.toFixed(1)} (< 50) while price rides an EMA uptrend — classic dip-buy territory.`,
      });
    } else if (!inTrendContext && rsi > 50) {
      rules.push({
        indicator: "RSI",
        vote: "SELL",
        weight: 1,
        title: "RSI Rally in Downtrend",
        detail: `RSI(14) is ${rsi.toFixed(1)} (> 50) while price remains below the EMA trend — bounce in a bearish trend.`,
      });
    } else {
      rules.push({
        indicator: "RSI",
        vote: "NEUTRAL",
        weight: 1,
        title: "RSI In-Line With Trend",
        detail: `RSI(14) is ${rsi.toFixed(1)} — consistent with the prevailing EMA trend.`,
      });
    }
  }

  const ema20 = s.ema20;
  const ema50 = s.ema50;
  const goldenCross = crossedAbove(ind.ema20, ind.ema50, i);
  const deathCross = crossedAbove(ind.ema50, ind.ema20, i);

  if (ema20 !== null && ema50 !== null) {
    if (ema20 > ema50) {
      rules.push({
        indicator: "EMA",
        vote: "BUY",
        weight: 1,
        title: goldenCross ? "EMA Golden Cross" : "EMA Bullish Alignment",
        detail: goldenCross
          ? "EMA20 crossed above EMA50 within the last few candles — classic golden cross signal."
          : `EMA20 (${ema20.toFixed(2)}) is above EMA50 (${ema50.toFixed(2)}) — short-term trend is up.`,
      });
    } else if (ema20 < ema50) {
      rules.push({
        indicator: "EMA",
        vote: "SELL",
        weight: 1,
        title: deathCross ? "EMA Death Cross" : "EMA Bearish Alignment",
        detail: deathCross
          ? "EMA20 crossed below EMA50 within the last few candles — classic death cross signal."
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

  const { macd, macdSignal, macdHistogram, macdHistogramPrev } = s;
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
        detail: `MACD (${macd.toFixed(2)}) and its signal line (${macdSignal.toFixed(2)}) are converging — momentum is indecisive.`,
      });
    }
  }

  const bbUpper = s.bbUpper;
  const bbLower = s.bbLower;
  const bbMiddle = s.bbMiddle;
  if (price !== null && bbUpper !== null && bbLower !== null && bbMiddle !== null) {
    const widthPct = ((bbUpper - bbLower) / bbMiddle) * 100;
    const bw = Number.isFinite(widthPct) ? widthPct.toFixed(2) : "—";
    if (price > bbUpper) {
      rules.push({
        indicator: "BOLLINGER",
        vote: "SELL",
        weight: 1,
        title: "Price Piercing Upper Band",
        detail: `Price is above the upper Bollinger Band (${bbUpper.toFixed(2)}) — overextended resistance zone (band width ${bw}%).`,
      });
    } else if (price < bbLower) {
      rules.push({
        indicator: "BOLLINGER",
        vote: "BUY",
        weight: 1,
        title: "Price Pushing Lower Band",
        detail: `Price is below the lower Bollinger Band (${bbLower.toFixed(2)}) — capitulation into a likely bounce zone (band width ${bw}%).`,
      });
    } else if (bw !== "—" && Number(bw) < 4) {
      rules.push({
        indicator: "BOLLINGER",
        vote: "NEUTRAL",
        weight: 1,
        title: "Bollinger Squeeze",
        detail: `Band width is tight (${bw}%) — volatility contraction that usually precedes an expansion.`,
      });
    } else {
      const bbPos = (price - bbLower) / (bbUpper - bbLower);
      if (bbPos > 0.8) {
        rules.push({
          indicator: "BOLLINGER",
          vote: "SELL",
          weight: 1,
          title: "Upper Third of Bands",
          detail: `Price is in the upper ${(bbPos * 100).toFixed(0)}% of the Bollinger range — fading strength.`,
        });
      } else if (bbPos < 0.2) {
        rules.push({
          indicator: "BOLLINGER",
          vote: "BUY",
          weight: 1,
          title: "Lower Third of Bands",
          detail: `Price is in the lower ${(bbPos * 100).toFixed(0)}% of the Bollinger range — bargain zone.`,
        });
      }
    }
  }

  const stoch = s.stochRsi;
  if (stoch !== null && price !== null) {
    if (stoch <= 0.2) {
      rules.push({
        indicator: "STOCH_RSI",
        vote: "BUY",
        weight: 1,
        title: "StochRSI Oversold",
        detail: `Stochastic RSI is ${stoch.toFixed(2)} (≤ 0.20) — momentum oscillator at extreme lows.`,
      });
    } else if (stoch >= 0.8) {
      rules.push({
        indicator: "STOCH_RSI",
        vote: "SELL",
        weight: 1,
        title: "StochRSI Overbought",
        detail: `Stochastic RSI is ${stoch.toFixed(2)} (≥ 0.80) — momentum oscillator at extreme highs.`,
      });
    }
  }

  if (divergence.rsi === "bullish") {
    rules.push({
      indicator: "DIVERGENCE",
      vote: "BUY",
      weight: 1,
      title: "Bullish RSI Divergence",
      detail: divergence.note,
    });
  } else if (divergence.rsi === "bearish") {
    rules.push({
      indicator: "DIVERGENCE",
      vote: "SELL",
      weight: 1,
      title: "Bearish RSI Divergence",
      detail: divergence.note,
    });
  }

  const adx = s.adx;
  const pdi = s.pdi;
  const mdi = s.mdi;
  if (adx !== null && pdi !== null && mdi !== null && price !== null) {
    if (adx >= 25 && pdi > mdi) {
      rules.push({
        indicator: "ADX",
        vote: "BUY",
        weight: 1,
        title: "Strong Uptrend (ADX)",
        detail: `ADX(14) is ${adx.toFixed(1)} (≥ 25) and +DI (${pdi.toFixed(1)}) dominates −DI (${mdi.toFixed(1)}) — trend is confirmed.`,
      });
    } else if (adx >= 25 && mdi > pdi) {
      rules.push({
        indicator: "ADX",
        vote: "SELL",
        weight: 1,
        title: "Strong Downtrend (ADX)",
        detail: `ADX(14) is ${adx.toFixed(1)} (≥ 25) and −DI (${mdi.toFixed(1)}) dominates +DI (${pdi.toFixed(1)}) — trend is confirmed.`,
      });
    } else if (adx < 20) {
      rules.push({
        indicator: "ADX",
        vote: "NEUTRAL",
        weight: 1,
        title: "No Trend (ADX)",
        detail: `ADX(14) is ${adx.toFixed(1)} (< 20) — market is ranging; signals should be treated with lower conviction.`,
      });
    }
  }

  return rules;
}

function actionFromRules(rules: RuleResult[]): {
  action: SignalAction;
  confidence: number;
  score: number;
  maxScore: number;
  tier: SignalSummary["tier"];
} {
  let score = 0;
  let maxScore = 0;
  for (const rule of rules) {
    maxScore += rule.weight;
    if (rule.vote === "BUY") score += rule.weight;
    else if (rule.vote === "SELL") score -= rule.weight;
  }

  const normalized = maxScore > 0 ? score / maxScore : 0;
  let action: SignalAction = "NEUTRAL";
  if (normalized >= 0.7) action = "STRONG_BUY";
  else if (normalized >= 0.5) action = "BUY";
  else if (normalized <= -0.7) action = "STRONG_SELL";
  else if (normalized <= -0.5) action = "SELL";

  const tier: SignalSummary["tier"] =
    action === "STRONG_BUY" || action === "STRONG_SELL"
      ? "STRONG"
      : action === "NEUTRAL"
        ? "NEUTRAL"
        : "STANDARD";

  const confidence = maxScore > 0 ? Math.round(Math.abs(normalized) * 100) : 0;

  return { action, confidence, score, maxScore, tier };
}

export function divisionInfoFrom(candles: Candle[], ind: ComputedIndicators): DivergenceInfo {
  return detectRsiDivergence(
    candles.map((c) => c.c),
    ind.rsi,
  );
}

export function evaluateSignal(
  candles: Candle[],
  ind: ComputedIndicators,
): SignalSummary {
  const i = candles.length - 1;
  const divergence = divisionInfoFrom(candles, ind);
  const rules = computeVotes(candles, ind, i, divergence);
  const { action, confidence, score, maxScore, tier } = actionFromRules(rules);
  return { action, confidence, score, maxScore, tier, rules };
}

/**
 * Evaluate the signal state at a single candle index using the precomputed
 * aligned series. Used by the backtester to replay the strategy across history.
 */
export function signalAt(
  candles: Candle[],
  ind: ComputedIndicators,
  i: number,
): SignalSummary {
  const divergence = detectRsiDivergence(
    candles.slice(0, i + 1).map((c) => c.c),
    ind.rsi,
  );
  const rules = computeVotes(candles, ind, i, divergence);
  const { action, confidence, score, maxScore, tier } = actionFromRules(rules);
  return { action, confidence, score, maxScore, tier, rules };
}

export function computeTradeLevels(
  candles: Candle[],
  ind: ComputedIndicators,
): {
  atr: number | null;
  stop: number | null;
  target: number | null;
  riskPercent: number | null;
  rewardPercent: number | null;
  riskReward: number | null;
} {
  const i = candles.length - 1;
  const price = candles[i]?.c ?? null;
  const atr = lastValid(ind.atr);

  if (price === null || atr === null || atr <= 0) {
    return { atr: atr, stop: null, target: null, riskPercent: null, rewardPercent: null, riskReward: null };
  }

  const signal = evaluateSignal(candles, ind);
  const isShort = signal.action.includes("SELL");

  const stopDist = 1.5 * atr;
  const targetDist = 2.5 * atr;
  const stop = isShort ? price + stopDist : price - stopDist;
  const target = isShort ? price - targetDist : price + targetDist;

  return {
    atr,
    stop,
    target,
    riskPercent: (stopDist / price) * 100,
    rewardPercent: (targetDist / price) * 100,
    riskReward: targetDist / stopDist,
  };
}

export const INDICATOR_META: Record<string, { periods: string; label: string }> = {
  RSI: { periods: "14", label: "RSI" },
  EMA: { periods: "20 / 50", label: "EMA" },
  MACD: { periods: "12 / 26 / 9", label: "MACD" },
  TREND: { periods: "50", label: "Trend" },
  BOLLINGER: { periods: "20, 2σ", label: "Bollinger" },
  STOCH_RSI: { periods: "14", label: "Stoch RSI" },
  DIVERGENCE: { periods: "—", label: "Divergence" },
  ADX: { periods: "14", label: "ADX" },
};