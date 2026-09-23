import { NextResponse } from "next/server";

import { fetch24hrTicker, fetchKlines } from "@/lib/binance";
import { computeIndicators, evaluateSignal } from "@/lib/signal-engine";
import { DEFAULT_INTERVAL } from "@/lib/symbols";
import type { Interval, SignalsResponse, SymbolAnalysis } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_INTERVALS = new Set<Interval>(["15m", "30m", "1h", "4h", "1d"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawSymbols = url.searchParams.get("symbols") ?? "";
  const symbols = rawSymbols
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z0-9]{5,20}$/.test(s));

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one valid symbol, e.g. ?symbols=BTCUSDT,ETHUSDT" },
      { status: 400 },
    );
  }

  const intervalRaw = url.searchParams.get("interval") ?? DEFAULT_INTERVAL;
  const interval: Interval = VALID_INTERVALS.has(intervalRaw as Interval)
    ? (intervalRaw as Interval)
    : DEFAULT_INTERVAL;

  const results: SymbolAnalysis[] = [];
  const errors: { symbol: string; message: string }[] = [];

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const [{ candles, host }, market] = await Promise.all([
          fetchKlines(symbol, interval),
          fetch24hrTicker(symbol),
        ]);

        const indicators = computeIndicators(candles);
        const signal = evaluateSignal(candles, indicators);

        results.push({
          symbol,
          interval,
          market,
          signal,
          indicators: indicators.snapshot,
          candles: candles.slice(-160),
          series: {
            ema20: indicators.ema20.slice(-160),
            ema50: indicators.ema50.slice(-160),
            rsi: indicators.rsi.slice(-160),
            macd: indicators.macd.slice(-160),
            macdSignal: indicators.macdSignal.slice(-160),
            macdHistogram: indicators.macdHistogram.slice(-160),
          },
          dataSource: host,
          updatedAt: Date.now(),
        });
      } catch (err) {
        errors.push({
          symbol,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }),
  );

  const payload: SignalsResponse = {
    interval,
    results,
    errors,
  };

  return NextResponse.json(payload);
}