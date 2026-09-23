import { NextResponse } from "next/server";

import { buildAnalysis } from "@/lib/analysis";
import { fetchInstrumentData, isProviderError } from "@/lib/markets";
import { getSymbolConfig, isValidSymbol } from "@/lib/symbols";
import type { Interval } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_INTERVALS: Interval[] = ["15m", "30m", "1h", "4h", "1d"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolParam = searchParams.get("symbol") ?? "";
  const intervalParam = searchParams.get("interval");

  const interval: Interval = VALID_INTERVALS.includes(intervalParam as Interval)
    ? (intervalParam as Interval)
    : "1h";

  const symbol = symbolParam.toUpperCase();
  if (!isValidSymbol(symbol)) {
    return NextResponse.json(
      { error: "Invalid or missing symbol. Expected something like BTCUSDT, EURUSD=X or ^GSPC." },
      { status: 400 },
    );
  }

  const config = getSymbolConfig(symbol);

  try {
    const { candles, market, source } = await fetchInstrumentData(config, interval);

    if (candles.length < 100) {
      return NextResponse.json(
        { error: `Not enough candle history for ${symbol} (${candles.length} candles).` },
        { status: 422 },
      );
    }

    const analysis = buildAnalysis(symbol, interval, candles, source, market);
    return NextResponse.json(analysis);
  } catch (err) {
    if (isProviderError(err)) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : String(err) },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}