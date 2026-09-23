export type SignalAction = "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";

export type Market = "crypto" | "forex" | "index";

export type Interval = "15m" | "30m" | "1h" | "4h" | "1d";

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
  market: Market;
  featured?: boolean;
}

export interface RuleResult {
  indicator:
    | "RSI"
    | "EMA"
    | "MACD"
    | "TREND"
    | "BOLLINGER"
    | "STOCH_RSI"
    | "DIVERGENCE"
    | "ADX";
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
  tier: "STRONG" | "STANDARD" | "NEUTRAL";
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
  bbUpper: number | null;
  bbMiddle: number | null;
  bbLower: number | null;
  stochRsi: number | null;
  adx: number | null;
  pdi: number | null;
  mdi: number | null;
  atr: number | null;
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

export interface DivergenceInfo {
  rsi: "bullish" | "bearish" | null;
  note: string;
}

export interface TradeLevels {
  atr: number | null;
  entry: number | null;
  stopLoss: number | null;
  tp1: number | null;
  tp2: number | null;
  riskPercent: number | null;
  tp1Percent: number | null;
  tp2Percent: number | null;
  riskReward: number | null;
}

export interface BacktestMetrics {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  avgMovePercent: number;
}

export interface BacktestResult {
  buy: BacktestMetrics;
  sell: BacktestMetrics;
  strongBuy: BacktestMetrics;
  strongSell: BacktestMetrics;
  horizonCandles: number;
  thresholdPercent: number;
  candlesCount: number;
}

export interface AnalysisSeries {
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
  atr: (number | null)[];
}

export interface SymbolSummary {
  symbol: string;
  interval: Interval;
  market: MarketStats;
  signal: SignalSummary;
  indicators: IndicatorSnapshot;
  sparkline: number[];
  dataSource: string;
  updatedAt: number;
}

export interface SymbolAnalysis extends SymbolSummary {
  candles: Candle[];
  series: AnalysisSeries;
  divergence: DivergenceInfo;
  tradeLevels: TradeLevels;
  backtest: BacktestResult;
}

export interface OverviewAggregate {
  trackedSymbols: number;
  totalQuoteVolume24h: number;
  avgChangePercent24h: number;
  longs: number;
  shorts: number;
  best: { symbol: string; changePercent24h: number } | null;
  worst: { symbol: string; changePercent24h: number } | null;
}

export interface SignalsResponse {
  interval: Interval;
  results: SymbolSummary[];
  aggregates: OverviewAggregate;
  errors: { symbol: string; message: string }[];
}

export interface SentimentPoint {
  value: number;
  classification: string;
  timestamp: number;
}

export interface SentimentResponse {
  value: number;
  classification: string;
  updatedAt: number;
  history: SentimentPoint[];
}