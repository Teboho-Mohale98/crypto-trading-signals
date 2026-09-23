import { BinanceDataError, fetch24hrTicker, fetchKlines } from "@/lib/binance";
import {
  YahooDataError,
  computeMarketStats,
  fetchYahooKlines,
} from "@/lib/yahoo";
import type { Candle, Interval, MarketStats, SymbolConfig } from "@/lib/types";

export interface InstrumentData {
  candles: Candle[];
  market: MarketStats;
  source: string;
}

export async function fetchInstrumentData(
  instrument: SymbolConfig,
  interval: Interval,
): Promise<InstrumentData> {
  if (instrument.market === "crypto") {
    const [{ candles, host }, market] = await Promise.all([
      fetchKlines(instrument.symbol, interval),
      fetch24hrTicker(instrument.symbol),
    ]);
    return { candles, market, source: host };
  }

  const { candles } = await fetchYahooKlines(instrument.symbol, interval);
  return {
    candles,
    market: computeMarketStats(candles),
    source: "Yahoo Finance",
  };
}

export function dataSourceForMarket(market: SymbolConfig["market"]): string {
  return market === "crypto" ? "Binance public API" : "Yahoo Finance";
}

export function isProviderError(err: unknown): boolean {
  return err instanceof BinanceDataError || err instanceof YahooDataError;
}