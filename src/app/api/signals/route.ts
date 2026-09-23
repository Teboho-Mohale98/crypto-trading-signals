import { NextResponse } from "next/server";

import { buildSummary } from "@/lib/analysis";
import { fetch24hrTicker, fetchKlines } from "@/lib/binance";
import { SYMBOLS } from "@/lib/symbols";
import type { Interval, OverviewAggregate, SignalsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const intervalParam = searchParams.get("interval");
  const interval: Interval = (["15m", "30m", "1h", "4h", "1d"] as const).includes(
    intervalParam as Interval,
  )
    ? (intervalParam as Interval)
    : "1h";

  const results = await Promise.all(
    SYMBOLS.map(async (cfg) => {
      try {
        const [{ candles, host }, market] = await Promise.all([
          fetchKlines(cfg.symbol, interval),
          fetch24hrTicker(cfg.symbol),
        ]);
        if (candles.length < 100) {
          return { kind: "error" as const, error: { symbol: cfg.symbol, message: `Not enough candle history (${candles.length})` } };
        }
        return { kind: "ok" as const, summary: buildSummary(cfg.symbol, interval, candles, host, market) };
      } catch (err) {
        return {
          kind: "error" as const,
          error: { symbol: cfg.symbol, message: err instanceof Error ? err.message : String(err) },
        };
      }
    }),
  );

  const summaries = results
    .filter((r) => r.kind === "ok")
    .map((r) => (r.kind === "ok" ? r.summary : undefined))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);
  const errors = results
    .filter((r) => r.kind === "error")
    .map((r) => (r.kind === "error" ? r.error : undefined))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);

  const withSignals = summaries.filter((s) => s.signal.action !== "NEUTRAL");
  const sortedBest = [...summaries].sort(
    (a, b) => b.market.changePercent24h - a.market.changePercent24h,
  );
  const sortedWorst = [...summaries].sort(
    (a, b) => a.market.changePercent24h - b.market.changePercent24h,
  );
  const best = sortedBest[0];
  const worst = sortedWorst[0];

  const aggregates: OverviewAggregate = {
    trackedSymbols: summaries.length,
    totalQuoteVolume24h: summaries.reduce((acc, s) => acc + s.market.quoteVolume24h, 0),
    avgChangePercent24h:
      summaries.length > 0
        ? summaries.reduce((acc, s) => acc + s.market.changePercent24h, 0) / summaries.length
        : 0,
    longs: withSignals.filter((s) => s.signal.action.includes("BUY")).length,
    shorts: withSignals.filter((s) => s.signal.action.includes("SELL")).length,
    best: best && best.market.changePercent24h !== 0 ? { symbol: best.symbol, changePercent24h: best.market.changePercent24h } : null,
    worst: worst && worst.market.changePercent24h !== 0 ? { symbol: worst.symbol, changePercent24h: worst.market.changePercent24h } : null,
  };

  const response: SignalsResponse = {
    interval,
    results: summaries,
    aggregates,
    errors,
  };

  const headers = new Headers();
  headers.set("Cache-Control", "no-store");

  return NextResponse.json(response, { headers });
}