import { ADX, ATR, BollingerBands, EMA, MACD, RSI, StochasticRSI } from "technicalindicators";

import type {
  Candle,
  DivergenceInfo,
  IndicatorSnapshot,
  SignalAction,
  SignalSummary,
  StrategyId,
  StrategyResult,
  TradeLevels,
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
export const ATR_STOP_MULTIPLIER = 1.5;
export const ATR_TP1_MULTIPLIER = 1;
export const ATR_TP2_MULTIPLIER = 2;
export const ATR_TP3_MULTIPLIER = 3;
export const ATR_TP4_MULTIPLIER = 4.5;

export const STRATEGY_ORDER: StrategyId[] = [
  "trend",
  "momentum",
  "mean_reversion",
  "breakout",
  "divergence",
];

export const STRATEGY_LABELS: Record<StrategyId, string> = {
  trend: "Trend Following",
  momentum: "MACD Momentum",
  mean_reversion: "Mean Reversion",
  breakout: "Bollinger Breakout",
  divergence: "RSI Divergence",
};

// How much each strategy contributes to the overall composite score.
export const STRATEGY_WEIGHTS: Record<StrategyId, number> = {
  trend: 2,
  momentum: 1.5,
  mean_reversion: 1.5,
  breakout: 1,
  divergence: 1,
};

// Composite score thresholds. STRONG requires the majority of strategies to
// agree on one side with little opposition.
const STRONG_SHARE = 0.55;
const STRONG_MIN_ALIGNED = 3;
const STANDARD_SHARE = 0.42;
const FLAT_STRENGTH = 0.2;
const MIN_ALIGNED_STRENGTH = 0.4;
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

type StrategyDirection = "long" | "short" | "flat";

function strategyRes(
  id: StrategyId,
  direction: StrategyDirection,
  strength: number,
  detail: string,
): StrategyResult {
  return {
    id,
    label: STRATEGY_LABELS[id],
    direction,
    action:
      direction === "long" ? "BUY" : direction === "short" ? "SELL" : "NEUTRAL",
    strength: Math.max(0, Math.min(1, strength)),
    detail,
  };
}

function clampStrength(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function evaluateStrategies(
  candles: Candle[],
  ind: ComputedIndicators,
  i: number,
  divergence: DivergenceInfo,
): StrategyResult[] {
  const s = ind.snapshots[i];
  const price = candles[i]?.c ?? null;

  // 1) Trend Following — EMA alignment, crosses and ADX confirmation.
  const crossUp = crossedAbove(ind.ema20, ind.ema50, i);
  const crossDn = crossedAbove(ind.ema50, ind.ema20, i);
  const trendLong =
    s.ema20 !== null && s.ema50 !== null && price !== null &&
    s.ema20 > s.ema50 && price > s.ema50;
  const trendShort =
    s.ema20 !== null && s.ema50 !== null && price !== null &&
    s.ema20 < s.ema50 && price < s.ema50;
  const adxN = s.adx ?? 0;
  let trend: StrategyResult;
  if (crossUp) {
    trend = strategyRes(
      "trend",
      "long",
      0.9 + (adxN >= 25 ? 0.1 : 0),
      "EMA20 just crossed above EMA50 — new uptrend",
    );
  } else if (crossDn) {
    trend = strategyRes(
      "trend",
      "short",
      0.9 + (adxN >= 25 ? 0.1 : 0),
      "EMA20 just crossed below EMA50 — new downtrend",
    );
  } else if (trendLong) {
    trend = strategyRes(
      "trend",
      "long",
      clampStrength(0.4 + adxN / 100),
      s.adx !== null && s.adx >= 25
        ? "EMA uptrend with ADX confirming trend strength"
        : "EMA uptrend, price above EMA50",
    );
  } else if (trendShort) {
    trend = strategyRes(
      "trend",
      "short",
      clampStrength(0.4 + adxN / 100),
      s.adx !== null && s.adx >= 25
        ? "EMA downtrend with ADX confirming trend strength"
        : "EMA downtrend, price below EMA50",
    );
  } else {
    trend = strategyRes(
      "trend",
      "flat",
      FLAT_STRENGTH,
      "EMAs converged or price sitting on the trend line — no trend edge",
    );
  }

  // 2) MACD Momentum — line vs signal + histogram acceleration.
  const hist = s.macdHistogram;
  const prevHist = s.macdHistogramPrev;
  const accelerating =
    hist !== null && prevHist !== null && Math.abs(hist) > Math.abs(prevHist);
  let momentum: StrategyResult;
  if (s.macd !== null && s.macdSignal !== null && hist !== null) {
    if (s.macd > s.macdSignal && hist > 0) {
      momentum = strategyRes(
        "momentum",
        "long",
        clampStrength(
          0.5 +
            (accelerating ? 0.3 : 0) +
            (s.rsi !== null && s.rsi > 50 && s.rsi < 75 ? 0.1 : 0),
        ),
        accelerating ? "MACD bullish and accelerating" : "MACD above signal line",
      );
    } else if (s.macd < s.macdSignal && hist < 0) {
      momentum = strategyRes(
        "momentum",
        "short",
        clampStrength(
          0.5 +
            (accelerating ? 0.3 : 0) +
            (s.rsi !== null && s.rsi > 25 && s.rsi < 50 ? 0.1 : 0),
        ),
        accelerating
          ? "MACD bearish and accelerating"
          : "MACD below signal line",
      );
    } else {
      momentum = strategyRes(
        "momentum",
        "flat",
        FLAT_STRENGTH,
        "MACD converging on its signal line — momentum indecisive",
      );
    }
  } else {
    momentum = strategyRes(
      "momentum",
      "flat",
      FLAT_STRENGTH,
      "MACD not computed yet",
    );
  }

  // 3) Mean Reversion — RSI / StochRSI / Bollinger extremes, counter-trend.
  const oversold =
    (s.rsi !== null && s.rsi <= 30) ||
    (s.stochRsi !== null && s.stochRsi <= 0.2) ||
    (price !== null && s.bbLower !== null && price <= s.bbLower);
  const overbought =
    (s.rsi !== null && s.rsi >= 70) ||
    (s.stochRsi !== null && s.stochRsi >= 0.8) ||
    (price !== null && s.bbUpper !== null && price >= s.bbUpper);
  let meanRev: StrategyResult;
  if (oversold && !overbought) {
    const ext = clampStrength(
      0.5 + (s.rsi !== null ? Math.max(0, (30 - s.rsi) / 30) : 0) * 0.5,
    );
    meanRev = strategyRes(
      "mean_reversion",
      "long",
      ext,
      s.rsi !== null && s.rsi <= 30
        ? `RSI ${s.rsi.toFixed(1)} oversold — expecting a bounce`
        : "Oscillators pinned at extremes — expecting mean reversion up",
    );
  } else if (overbought && !oversold) {
    const ext = clampStrength(
      0.5 + (s.rsi !== null ? Math.max(0, (s.rsi - 70) / 30) : 0) * 0.5,
    );
    meanRev = strategyRes(
      "mean_reversion",
      "short",
      ext,
      s.rsi !== null && s.rsi >= 70
        ? `RSI ${s.rsi.toFixed(1)} overbought — expecting a pullback`
        : "Oscillators pinned at extremes — expecting mean reversion down",
    );
  } else {
    meanRev = strategyRes(
      "mean_reversion",
      "flat",
      FLAT_STRENGTH,
      "Oscillators mid-range — no extreme to fade",
    );
  }

  // 4) Bollinger Breakout — price breaking out of the bands.
  let breakout: StrategyResult;
  if (
    price !== null &&
    s.bbUpper !== null &&
    s.bbLower !== null &&
    s.bbMiddle !== null
  ) {
    if (price > s.bbUpper) {
      breakout = strategyRes(
        "breakout",
        "long",
        0.65,
        "Price broke above the upper Bollinger Band — upside expansion",
      );
    } else if (price < s.bbLower) {
      breakout = strategyRes(
        "breakout",
        "short",
        0.65,
        "Price broke below the lower Bollinger Band — downside expansion",
      );
    } else {
      breakout = strategyRes(
        "breakout",
        "flat",
        FLAT_STRENGTH,
        "Price contained inside the Bollinger Bands — no breakout",
      );
    }
  } else {
    breakout = strategyRes(
      "breakout",
      "flat",
      FLAT_STRENGTH,
      "Bollinger Bands not ready",
    );
  }

  // 5) RSI Divergence — exhaustion signal against recent price swings.
  let divStrategy: StrategyResult;
  if (divergence.rsi === "bullish") {
    divStrategy = strategyRes("divergence", "long", 0.7, divergence.note);
  } else if (divergence.rsi === "bearish") {
    divStrategy = strategyRes("divergence", "short", 0.7, divergence.note);
  } else {
    divStrategy = strategyRes(
      "divergence",
      "flat",
      FLAT_STRENGTH,
      "No significant divergence between price and RSI",
    );
  }

  return [trend, momentum, meanRev, breakout, divStrategy];
}

function compositeSignal(
  strategies: StrategyResult[],
): {
  action: SignalAction;
  confidence: number;
  score: number;
  maxScore: number;
  tier: SignalSummary["tier"];
} {
  let longW = 0;
  let shortW = 0;
  let totalW = 0;
  for (const strat of strategies) {
    const w = STRATEGY_WEIGHTS[strat.id] * strat.strength;
    totalW += w;
    if (strat.action === "BUY") longW += w;
    else if (strat.action === "SELL") shortW += w;
  }

  const score = totalW > 0 ? (longW - shortW) / totalW : 0;
  const longShare = totalW > 0 ? longW / totalW : 0;
  const shortShare = totalW > 0 ? shortW / totalW : 0;
  const buyAligned = strategies.filter(
    (st) => st.action === "BUY" && st.strength >= MIN_ALIGNED_STRENGTH,
  ).length;
  const sellAligned = strategies.filter(
    (st) => st.action === "SELL" && st.strength >= MIN_ALIGNED_STRENGTH,
  ).length;

  let action: SignalAction = "NEUTRAL";
  if (buyAligned >= STRONG_MIN_ALIGNED && sellAligned <= 1 && longShare >= STRONG_SHARE) {
    action = "STRONG_BUY";
  } else if (sellAligned >= STRONG_MIN_ALIGNED && buyAligned <= 1 && shortShare >= STRONG_SHARE) {
    action = "STRONG_SELL";
  } else if (longShare >= STANDARD_SHARE && longShare > shortShare) {
    action = "BUY";
  } else if (shortShare >= STANDARD_SHARE && shortShare > longShare) {
    action = "SELL";
  }

  const tier: SignalSummary["tier"] =
    action === "STRONG_BUY" || action === "STRONG_SELL"
      ? "STRONG"
      : action === "NEUTRAL"
        ? "NEUTRAL"
        : "STANDARD";

  return {
    action,
    confidence: Math.round(Math.abs(score) * 100),
    score,
    maxScore: 1,
    tier,
  };
}

export function evaluateSignal(
  candles: Candle[],
  ind: ComputedIndicators,
): SignalSummary {
  const i = candles.length - 1;
  const divergence = divisionInfoFrom(candles, ind);
  const strategies = evaluateStrategies(candles, ind, i, divergence);
  const { action, confidence, score, maxScore, tier } = compositeSignal(strategies);
  return { action, confidence, score, maxScore, tier, strategies };
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
  const strategies = evaluateStrategies(candles, ind, i, divergence);
  const { action, confidence, score, maxScore, tier } = compositeSignal(strategies);
  return { action, confidence, score, maxScore, tier, strategies };
}

export function divisionInfoFrom(candles: Candle[], ind: ComputedIndicators): DivergenceInfo {
  return detectRsiDivergence(
    candles.map((c) => c.c),
    ind.rsi,
  );
}

export function computeTradeLevels(
  candles: Candle[],
  ind: ComputedIndicators,
): TradeLevels {
  const i = candles.length - 1;
  const price = candles[i]?.c ?? null;
  const atr = lastValid(ind.atr);

  const empty: TradeLevels = {
    atr,
    entry: null,
    stopLoss: null,
    tp1: null,
    tp2: null,
    tp3: null,
    tp4: null,
    riskPercent: null,
    tp1Percent: null,
    tp2Percent: null,
    tp3Percent: null,
    tp4Percent: null,
    riskReward: null,
  };

  if (price === null || price <= 0 || atr === null || atr <= 0) {
    return empty;
  }

  const signal = evaluateSignal(candles, ind);
  const direction =
    signal.action.includes("SELL") ? -1 :
    signal.action.includes("BUY") ? 1 :
    0;

  // NEUTRAL — no actionable entry, stop or targets.
  if (direction === 0) {
    return empty;
  }

  const stopDist = ATR_STOP_MULTIPLIER * atr;
  const tp1Dist = ATR_TP1_MULTIPLIER * atr;
  const tp2Dist = ATR_TP2_MULTIPLIER * atr;
  const tp3Dist = ATR_TP3_MULTIPLIER * atr;
  const tp4Dist = ATR_TP4_MULTIPLIER * atr;

  return {
    atr,
    entry: price,
    stopLoss: price - direction * stopDist,
    tp1: price + direction * tp1Dist,
    tp2: price + direction * tp2Dist,
    tp3: price + direction * tp3Dist,
    tp4: price + direction * tp4Dist,
    riskPercent: (stopDist / price) * 100,
    tp1Percent: (tp1Dist / price) * 100,
    tp2Percent: (tp2Dist / price) * 100,
    tp3Percent: (tp3Dist / price) * 100,
    tp4Percent: (tp4Dist / price) * 100,
    riskReward: tp4Dist / stopDist,
  };
}