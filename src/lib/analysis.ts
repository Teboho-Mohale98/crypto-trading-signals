import { runBacktest } from "@/lib/backtest";
import {
  computeIndicators,
  computeTradeLevels,
  divisionInfoFrom,
  evaluateSignal,
} from "@/lib/signal-engine";
import type {
  Candle,
  Interval,
  MarketStats,
  SymbolAnalysis,
  SymbolSummary,
  TradeLevels,
} from "@/lib/types";

const SPARK_POINTS = 48;
const CHART_CANDLES = 160;

function downsample(values: number[], points: number): number[] {
  if (values.length <= points) return values;
  const out: number[] = [];
  const step = values.length / points;
  for (let i = 0; i < points; i++) {
    out.push(values[Math.min(values.length - 1, Math.floor(i * step))]);
  }
  return out;
}

function sliceSeries(
  series: (number | null)[],
  start: number,
): (number | null)[] {
  return series.slice(start);
}

export function buildSummary(
  symbol: string,
  interval: Interval,
  candles: Candle[],
  host: string,
  market: MarketStats,
): SymbolSummary {
  const ind = computeIndicators(candles);
  const signal = evaluateSignal(candles, ind);
  const now = Date.now();

  return {
    symbol,
    interval,
    market,
    signal,
    indicators: ind.snapshots[candles.length - 1] ?? {
      rsi: null,
      ema20: null,
      ema50: null,
      macd: null,
      macdSignal: null,
      macdHistogram: null,
      macdHistogramPrev: null,
      bbUpper: null,
      bbMiddle: null,
      bbLower: null,
      stochRsi: null,
      adx: null,
      pdi: null,
      mdi: null,
      atr: null,
    },
    sparkline: downsample(
      candles.map((c) => c.c),
      SPARK_POINTS,
    ),
    dataSource: host,
    updatedAt: now,
  };
}

export function buildAnalysis(
  symbol: string,
  interval: Interval,
  candles: Candle[],
  host: string,
  market: MarketStats,
): SymbolAnalysis {
  const summary = buildSummary(symbol, interval, candles, host, market);
  const ind = computeIndicators(candles);
  const start = Math.max(0, candles.length - CHART_CANDLES);

  return {
    ...summary,
    candles: candles.slice(start),
    series: {
      ema20: sliceSeries(ind.ema20, start),
      ema50: sliceSeries(ind.ema50, start),
      rsi: sliceSeries(ind.rsi, start),
      macd: sliceSeries(ind.macd, start),
      macdSignal: sliceSeries(ind.macdSignal, start),
      macdHistogram: sliceSeries(ind.macdHistogram, start),
      bbUpper: sliceSeries(ind.bbUpper, start),
      bbMiddle: sliceSeries(ind.bbMiddle, start),
      bbLower: sliceSeries(ind.bbLower, start),
      stochRsi: sliceSeries(ind.stochRsi, start),
      adx: sliceSeries(ind.adx, start),
      atr: sliceSeries(ind.atr, start),
    },
    divergence: divisionInfoFrom(candles, ind),
    tradeLevels: tradeLevelsOrEmpty(computeTradeLevels(candles, ind)),
    backtest: runBacktest(candles, ind),
  };
}

function tradeLevelsOrEmpty(
  levels: TradeLevels,
): TradeLevels {
  return levels.entry !== null &&
    levels.stopLoss !== null &&
    levels.tp1 !== null &&
    levels.tp2 !== null
    ? {
        atr: levels.atr,
        entry: levels.entry,
        stopLoss: levels.stopLoss,
        tp1: levels.tp1,
        tp2: levels.tp2,
        riskPercent: levels.riskPercent,
        tp1Percent: levels.tp1Percent,
        tp2Percent: levels.tp2Percent,
        riskReward: levels.riskReward,
      }
    : {
        atr: levels.atr ?? null,
        entry: null,
        stopLoss: null,
        tp1: null,
        tp2: null,
        riskPercent: null,
        tp1Percent: null,
        tp2Percent: null,
        riskReward: null,
      };
}