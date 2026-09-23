import type { Interval, SymbolConfig } from "@/lib/types";

export const SYMBOLS: SymbolConfig[] = [
  {
    symbol: "BTCUSDT",
    base: "BTC",
    quote: "USDT",
    label: "BTC/USDT",
    accent: "#f7931a",
    description: "Bitcoin",
    featured: true,
  },
  {
    symbol: "ETHUSDT",
    base: "ETH",
    quote: "USDT",
    label: "ETH/USDT",
    accent: "#93a5f2",
    description: "Ethereum",
    featured: true,
  },
  {
    symbol: "SOLUSDT",
    base: "SOL",
    quote: "USDT",
    label: "SOL/USDT",
    accent: "#14f195",
    description: "Solana",
    featured: true,
  },
  {
    symbol: "BNBUSDT",
    base: "BNB",
    quote: "USDT",
    label: "BNB/USDT",
    accent: "#f3ba2f",
    description: "BNB Chain",
  },
  {
    symbol: "XRPUSDT",
    base: "XRP",
    quote: "USDT",
    label: "XRP/USDT",
    accent: "#00aae4",
    description: "XRP Ledger",
  },
  {
    symbol: "ADAUSDT",
    base: "ADA",
    quote: "USDT",
    label: "ADA/USDT",
    accent: "#0033ad",
    description: "Cardano",
  },
  {
    symbol: "DOGEUSDT",
    base: "DOGE",
    quote: "USDT",
    label: "DOGE/USDT",
    accent: "#c2a633",
    description: "Dogecoin",
  },
  {
    symbol: "AVAXUSDT",
    base: "AVAX",
    quote: "USDT",
    label: "AVAX/USDT",
    accent: "#e84142",
    description: "Avalanche",
  },
  {
    symbol: "LINKUSDT",
    base: "LINK",
    quote: "USDT",
    label: "LINK/USDT",
    accent: "#2a5ada",
    description: "Chainlink",
  },
  {
    symbol: "DOTUSDT",
    base: "DOT",
    quote: "USDT",
    label: "DOT/USDT",
    accent: "#e6007a",
    description: "Polkadot",
  },
  {
    symbol: "LTCUSDT",
    base: "LTC",
    quote: "USDT",
    label: "LTC/USDT",
    accent: "#bfbbbb",
    description: "Litecoin",
  },
  {
    symbol: "TRXUSDT",
    base: "TRX",
    quote: "USDT",
    label: "TRX/USDT",
    accent: "#eb0029",
    description: "Tron",
  },
];

export const INTERVALS: { value: Interval; label: string }[] = [
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

export const DEFAULT_INTERVAL: Interval = "1h";

export function getSymbolConfig(symbol: string): SymbolConfig {
  const found = SYMBOLS.find((s) => s.symbol === symbol);
  if (found) return found;
  const base = symbol.replace(/USDT$/, "");
  return {
    symbol,
    base,
    quote: "USDT",
    label: `${base}/USDT`,
    accent: "#38bdf8",
    description: base,
  };
}

export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z0-9]{5,20}$/.test(symbol);
}