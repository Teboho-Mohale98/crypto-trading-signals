import type { Interval, Market, SymbolConfig } from "@/lib/types";

export const CRYPTO_SYMBOLS: SymbolConfig[] = [
  {
    symbol: "BTCUSDT",
    base: "BTC",
    quote: "USDT",
    label: "BTC/USDT",
    accent: "#f7931a",
    description: "Bitcoin",
    market: "crypto",
    featured: true,
  },
  {
    symbol: "ETHUSDT",
    base: "ETH",
    quote: "USDT",
    label: "ETH/USDT",
    accent: "#93a5f2",
    description: "Ethereum",
    market: "crypto",
    featured: true,
  },
  {
    symbol: "SOLUSDT",
    base: "SOL",
    quote: "USDT",
    label: "SOL/USDT",
    accent: "#14f195",
    description: "Solana",
    market: "crypto",
    featured: true,
  },
  {
    symbol: "BNBUSDT",
    base: "BNB",
    quote: "USDT",
    label: "BNB/USDT",
    accent: "#f3ba2f",
    description: "BNB Chain",
    market: "crypto",
  },
  {
    symbol: "XRPUSDT",
    base: "XRP",
    quote: "USDT",
    label: "XRP/USDT",
    accent: "#00aae4",
    description: "XRP Ledger",
    market: "crypto",
  },
  {
    symbol: "ADAUSDT",
    base: "ADA",
    quote: "USDT",
    label: "ADA/USDT",
    accent: "#0033ad",
    description: "Cardano",
    market: "crypto",
  },
  {
    symbol: "DOGEUSDT",
    base: "DOGE",
    quote: "USDT",
    label: "DOGE/USDT",
    accent: "#c2a633",
    description: "Dogecoin",
    market: "crypto",
  },
  {
    symbol: "AVAXUSDT",
    base: "AVAX",
    quote: "USDT",
    label: "AVAX/USDT",
    accent: "#e84142",
    description: "Avalanche",
    market: "crypto",
  },
  {
    symbol: "LINKUSDT",
    base: "LINK",
    quote: "USDT",
    label: "LINK/USDT",
    accent: "#2a5ada",
    description: "Chainlink",
    market: "crypto",
  },
  {
    symbol: "DOTUSDT",
    base: "DOT",
    quote: "USDT",
    label: "DOT/USDT",
    accent: "#e6007a",
    description: "Polkadot",
    market: "crypto",
  },
  {
    symbol: "LTCUSDT",
    base: "LTC",
    quote: "USDT",
    label: "LTC/USDT",
    accent: "#bfbbbb",
    description: "Litecoin",
    market: "crypto",
  },
  {
    symbol: "TRXUSDT",
    base: "TRX",
    quote: "USDT",
    label: "TRX/USDT",
    accent: "#eb0029",
    description: "Tron",
    market: "crypto",
  },
];

export const FOREX_SYMBOLS: SymbolConfig[] = [
  { symbol: "EURUSD=X", base: "EUR", quote: "USD", label: "EUR/USD", accent: "#38bdf8", description: "Euro / US Dollar", market: "forex", featured: true },
  { symbol: "GBPUSD=X", base: "GBP", quote: "USD", label: "GBP/USD", accent: "#22d3ee", description: "British Pound / US Dollar", market: "forex", featured: true },
  { symbol: "USDJPY=X", base: "USD", quote: "JPY", label: "USD/JPY", accent: "#818cf8", description: "US Dollar / Japanese Yen", market: "forex", featured: true },
  { symbol: "AUDUSD=X", base: "AUD", quote: "USD", label: "AUD/USD", accent: "#34d399", description: "Australian Dollar / US Dollar", market: "forex" },
  { symbol: "USDCAD=X", base: "USD", quote: "CAD", label: "USD/CAD", accent: "#f87171", description: "US Dollar / Canadian Dollar", market: "forex" },
  { symbol: "USDCHF=X", base: "USD", quote: "CHF", label: "USD/CHF", accent: "#a78bfa", description: "US Dollar / Swiss Franc", market: "forex" },
  { symbol: "NZDUSD=X", base: "NZD", quote: "USD", label: "NZD/USD", accent: "#2dd4bf", description: "NZ Dollar / US Dollar", market: "forex" },
  { symbol: "EURGBP=X", base: "EUR", quote: "GBP", label: "EUR/GBP", accent: "#60a5fa", description: "Euro / British Pound", market: "forex" },
  { symbol: "EURJPY=X", base: "EUR", quote: "JPY", label: "EUR/JPY", accent: "#fbbf24", description: "Euro / Japanese Yen", market: "forex" },
  { symbol: "GBPJPY=X", base: "GBP", quote: "JPY", label: "GBP/JPY", accent: "#fb923c", description: "Pound / Japanese Yen", market: "forex" },
  { symbol: "EURCHF=X", base: "EUR", quote: "CHF", label: "EUR/CHF", accent: "#c084fc", description: "Euro / Swiss Franc", market: "forex" },
  { symbol: "AUDJPY=X", base: "AUD", quote: "JPY", label: "AUD/JPY", accent: "#4ade80", description: "Australian Dollar / Japanese Yen", market: "forex" },
  { symbol: "USDCNH=X", base: "USD", quote: "CNH", label: "USD/CNH", accent: "#f43f5e", description: "US Dollar / Offshore Yuan", market: "forex" },
  { symbol: "USDSGD=X", base: "USD", quote: "SGD", label: "USD/SGD", accent: "#f472b6", description: "US Dollar / Singapore Dollar", market: "forex" },
  { symbol: "USDHKD=X", base: "USD", quote: "HKD", label: "USD/HKD", accent: "#94a3b8", description: "US Dollar / Hong Kong Dollar", market: "forex" },
  { symbol: "USDSEK=X", base: "USD", quote: "SEK", label: "USD/SEK", accent: "#a3e635", description: "US Dollar / Swedish Krona", market: "forex" },
  { symbol: "USDNOK=X", base: "USD", quote: "NOK", label: "USD/NOK", accent: "#fca5a5", description: "US Dollar / Norwegian Krone", market: "forex" },
  { symbol: "USDMXN=X", base: "USD", quote: "MXN", label: "USD/MXN", accent: "#fde047", description: "US Dollar / Mexican Peso", market: "forex" },
  { symbol: "EURCAD=X", base: "EUR", quote: "CAD", label: "EUR/CAD", accent: "#93c5fd", description: "Euro / Canadian Dollar", market: "forex" },
  { symbol: "AUDCAD=X", base: "AUD", quote: "CAD", label: "AUD/CAD", accent: "#6ee7b7", description: "Australian Dollar / Canadian Dollar", market: "forex" },
];

export const INDEX_SYMBOLS: SymbolConfig[] = [
  { symbol: "^GSPC", base: "SPX", quote: "USD", label: "S&P 500", accent: "#4f46e5", description: "S&P 500 Index", market: "index", featured: true },
  { symbol: "^IXIC", base: "COMP", quote: "USD", label: "Nasdaq", accent: "#3b82f6", description: "Nasdaq Composite", market: "index", featured: true },
  { symbol: "^DJI", base: "DJI", quote: "USD", label: "Dow Jones", accent: "#0891b2", description: "Dow Jones Industrial Avg", market: "index", featured: true },
  { symbol: "^RUT", base: "RUT", quote: "USD", label: "Russell 2000", accent: "#7c3aed", description: "Russell 2000 Index", market: "index" },
  { symbol: "^VIX", base: "VIX", quote: "USD", label: "CBOE VIX", accent: "#dc2626", description: "Volatility Index", market: "index" },
  { symbol: "^N225", base: "NKY", quote: "JPY", label: "Nikkei 225", accent: "#e11d48", description: "Nikkei 225 (Japan)", market: "index" },
  { symbol: "^HSI", base: "HSI", quote: "HKD", label: "Hang Seng", accent: "#db2777", description: "Hang Seng (Hong Kong)", market: "index" },
  { symbol: "000001.SS", base: "SHCOMP", quote: "CNY", label: "Shanghai", accent: "#ea580c", description: "Shanghai Composite (China)", market: "index" },
  { symbol: "000300.SS", base: "CSI300", quote: "CNY", label: "CSI 300", accent: "#ea1600", description: "CSI 300 (China)", market: "index" },
  { symbol: "^FTSE", base: "UKX", quote: "GBP", label: "FTSE 100", accent: "#2563eb", description: "FTSE 100 (UK)", market: "index" },
  { symbol: "^GDAXI", base: "DAX", quote: "EUR", label: "DAX 40", accent: "#0ea5e9", description: "DAX 40 (Germany)", market: "index" },
  { symbol: "^FCHI", base: "CAC", quote: "EUR", label: "CAC 40", accent: "#0284c7", description: "CAC 40 (France)", market: "index" },
  { symbol: "^STOXX50E", base: "SX5E", quote: "EUR", label: "Euro Stoxx 50", accent: "#6366f1", description: "Euro Stoxx 50 (EU)", market: "index" },
  { symbol: "^AXJO", base: "ASX", quote: "AUD", label: "ASX 200", accent: "#16a34a", description: "S&P/ASX 200 (Australia)", market: "index" },
  { symbol: "^KS11", base: "KOSPI", quote: "KRW", label: "KOSPI", accent: "#8b5cf6", description: "KOSPI (South Korea)", market: "index" },
  { symbol: "^TWII", base: "TWSE", quote: "TWD", label: "Taiwan", accent: "#d97706", description: "Taiwan Weighted Index", market: "index" },
  { symbol: "^BVSP", base: "IBOV", quote: "BRL", label: "Bovespa", accent: "#059669", description: "IBOVESPA (Brazil)", market: "index" },
  { symbol: "^MXX", base: "IPC", quote: "MXN", label: "IPC Mexico", accent: "#65a30d", description: "S&P/BMV IPC (Mexico)", market: "index" },
  { symbol: "^NSEI", base: "NIFTY", quote: "INR", label: "NIFTY 50", accent: "#9333ea", description: "NIFTY 50 (India)", market: "index" },
  { symbol: "^BSESN", base: "SENSEX", quote: "INR", label: "Sensex", accent: "#c026d3", description: "S&P BSE Sensex (India)", market: "index" },
];

export const INSTRUMENTS: SymbolConfig[] = [
  ...CRYPTO_SYMBOLS,
  ...FOREX_SYMBOLS,
  ...INDEX_SYMBOLS,
];

export const MARKETS: { value: Market; label: string }[] = [
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
  { value: "index", label: "Index" },
];

// Backwards-compatible alias: the original 12 crypto pairs.
export const SYMBOLS = CRYPTO_SYMBOLS;

export const INTERVALS: { value: Interval; label: string }[] = [
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

export const DEFAULT_INTERVAL: Interval = "1h";

export function instrumentsByMarket(market: Market | "all"): SymbolConfig[] {
  return market === "all" ? INSTRUMENTS : INSTRUMENTS.filter((s) => s.market === market);
}

export function isKnownSymbol(symbol: string): boolean {
  return INSTRUMENTS.some((s) => s.symbol === symbol);
}

export function getSymbolConfig(symbol: string): SymbolConfig {
  const found = INSTRUMENTS.find((s) => s.symbol === symbol);
  if (found) return found;

  const market: Market =
    symbol.endsWith("=X") ? "forex" :
    symbol.startsWith("^") || /^\d+\./.test(symbol) ? "index" :
    "crypto";
  const base =
    market === "forex"
      ? symbol.replace(/=X$/, "").slice(0, 3)
      : symbol.replace(/=\d+$/, "").replace(/\.\w+$/, "").replace(/\^/, "");
  const quote =
    market === "forex"
      ? symbol.replace(/=X$/, "").slice(3) || "USD"
      : market === "index"
        ? "USD"
        : "USDT";
  return {
    symbol,
    base,
    quote,
    label: market === "index" ? base : `${base}/${quote}`,
    accent: "#38bdf8",
    description: base,
    market,
  };
}

export function isValidSymbol(symbol: string): boolean {
  if (isKnownSymbol(symbol)) return true;
  if (/^[A-Z0-9]{6}=X$/.test(symbol)) return true;
  if (/^\^[A-Z0-9]{2,8}$/.test(symbol)) return true;
  return /^[A-Z0-9]{2,20}$/.test(symbol);
}