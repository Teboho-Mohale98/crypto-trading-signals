import type { Interval, SymbolConfig } from "@/lib/types";

export const SYMBOLS: SymbolConfig[] = [
  {
    symbol: "BTCUSDT",
    base: "BTC",
    quote: "USDT",
    label: "BTC/USDT",
    accent: "#f7931a",
    description: "Bitcoin",
  },
  {
    symbol: "ETHUSDT",
    base: "ETH",
    quote: "USDT",
    label: "ETH/USDT",
    accent: "#8c8cf0",
    description: "Ethereum",
  },
  {
    symbol: "SOLUSDT",
    base: "SOL",
    quote: "USDT",
    label: "SOL/USDT",
    accent: "#14f195",
    description: "Solana",
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
