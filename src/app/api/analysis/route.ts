import { NextResponse } from "next/server";

import { buildAnalysis } from "@/lib/analysis";
import { BinanceDataError, fetch24hrTicker, fetchKlines } from "@/lib/binance";
import { getSymbolConfig, isValidSymbol } from "@/lib/symbols";
import type { Interval } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolParam = searchParams.get("symbol") ?? "";
  const intervalParam = searchParams.get("interval");

  const interval: Interval = (["15m", "30m", "1h", "4h", "1d"] as const).includes(
    intervalParam as Interval,
  )
    ? (intervalParam as Interval)
    : "1h";

  if (!isValidSymbol(symbolParam)) {
    return NextResponse.json(
      { error: "Invalid or missing symbol. Expected something like BTCUSDT." },
      { status: 400 },
    );
  }

  const symbol = symbolParam.toUpperCase();
  getSymbolConfig(symbol);

  try {
    const [{ candles, host }, market] = await Promise.all([
      fetchKlines(symbol, interval),
      fetch24hrTicker(symbol),
    ]);

    if (candles.length < 100) {
      return NextResponse.json(
        { error: `Not enough candle history for ${symbol} (${candles.length} candles).` },
        { status: 422 },
      );
    }

    const analysis = buildAnalysis(symbol, interval, candles, host, market);
    return NextResponse.json(analysis);
  } catch (err) {
    if (err instanceof BinanceDataError) {
      return NextResponse.json(
        { error: err.message },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}