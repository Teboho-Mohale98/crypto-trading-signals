export type SignalAction = "BUY" | "SELL" | "NEUTRAL";

export type Interval =
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d";

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface SymbolConfig {
  symbol: string;
  base: string;
  quote: string;
  label: string;
  accent: string;
  description: string;
}

export interface RuleResult {
  indicator: "RSI" | "EMA" | "MACD" | "TREND";
  vote: SignalAction;
  weight: number;
  title: string;
  detail: string;
}

export interface SignalSummary {
  action: SignalAction;
  confidence: number;
  score: number;
  maxScore: number;
  rules: RuleResult[];
}

export interface IndicatorSnapshot {
  rsi: number | null;
  ema20: number | null;
  ema50: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  macdHistogramPrev: number | null;
}

export interface MarketStats {
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
}

export interface SymbolAnalysis {
  symbol: string;
  interval: Interval;
  market: MarketStats;
  signal: SignalSummary;
  indicators: IndicatorSnapshot;
  candles: Candle[];
  series: {
    ema20: (number | null)[];
    ema50: (number | null)[];
    rsi: (number | null)[];
    macd: (number | null)[];
    macdSignal: (number | null)[];
    macdHistogram: (number | null)[];
  };
  dataSource: string;
  updatedAt: number;
}

export interface SignalsResponse {
  interval: Interval;
  results: SymbolAnalysis[];
  errors: { symbol: string; message: string }[];
}
