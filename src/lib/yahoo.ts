import { cached } from "@/lib/cache";
import type { Candle, Interval, MarketStats } from "@/lib/types";

const YAHOO_HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

export const YAHOO_CANDLE_LIMIT = 200;

const TTL_MS = 8_000;

export class YahooDataError extends Error {}

const YAHOO_INTERVAL: Record<Exclude<Interval, "4h">, string> = {
  "15m": "15m",
  "30m": "30m",
  "1h": "1h",
  "1d": "1d",
};

const YAHOO_RANGE: Record<Exclude<Interval, "4h">, string> = {
  "15m": "5d",
  "30m": "1mo",
  "1h": "1mo",
  "1d": "2y",
};

interface YahooQuote {
  open: (number | null)[];
  high: (number | null)[];
  low: (number | null)[];
  close: (number | null)[];
  volume: (number | null)[];
}

interface YahooChartPayload {
  chart: {
    result?: Array<{
      timestamp?: number[] | null;
      indicators?: { quote?: YahooQuote[] };
      meta?: { regularMarketPrice?: number | null };
    }> | null;
    error?: unknown;
  } | null;
}

async function fetchJsonFromYahoo(path: string): Promise<YahooChartPayload> {
  let lastError: unknown;

  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        },
      });

      if (res.ok) {
        return (await res.json()) as YahooChartPayload;
      }

      lastError = new Error(`HTTP ${res.status} from ${host}${path}`);
      if (res.status === 404) {
        throw new YahooDataError(
          `Yahoo Finance has no chart data for "${path.split("/").pop()}".`,
        );
      }
    } catch (err) {
      if (err instanceof YahooDataError) throw err;
      lastError = err;
    }
  }

  throw new YahooDataError(
    `All Yahoo Finance endpoints failed for ${path}: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

function chartToCandles(payload: YahooChartPayload, symbol: string): Candle[] {
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const quote = result?.indicators?.quote?.[0];
  if (!result || !timestamps || !quote) {
    throw new YahooDataError(`Unexpected Yahoo Finance payload for ${symbol}`);
  }

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = quote.close[i];
    if (close === null || close === undefined || Number.isNaN(close)) continue;
    candles.push({
      t: timestamps[i] * 1000,
      o: quote.open[i] ?? close,
      h: quote.high[i] ?? close,
      l: quote.low[i] ?? close,
      c: close,
      v: quote.volume?.[i] ?? 0,
    });
  }

  if (candles.length === 0) {
    throw new YahooDataError(`No usable candles returned for ${symbol}`);
  }
  return candles;
}

// Yahoo has no 4h interval; aggregate hourly bars into fixed 4-hour buckets.
function aggregateCandles(hourly: Candle[], bucketMs: number): Candle[] {
  const out: Candle[] = [];
  for (const c of hourly) {
    const bucket = Math.floor(c.t / bucketMs) * bucketMs;
    const last = out[out.length - 1];
    if (last && last.t === bucket) {
      last.h = Math.max(last.h, c.h);
      last.l = Math.min(last.l, c.l);
      last.c = c.c;
      last.v += c.v;
    } else {
      out.push({ t: bucket, o: c.o, h: c.h, l: c.l, c: c.c, v: c.v });
    }
  }
  return out;
}

export async function fetchYahooKlines(
  symbol: string,
  interval: Interval,
  limit = YAHOO_CANDLE_LIMIT,
): Promise<{ candles: Candle[]; price: number }> {
  const cacheKey = `yahoo:${symbol}:${interval}`;

  return cached(cacheKey, TTL_MS, async () => {
    const last = await (async () => {
      if (interval === "4h") {
        const raw = await fetchJsonFromYahoo(
          `/v8/finance/chart/${encodeURIComponent(
            symbol,
          )}?interval=1h&range=1mo&events=div%2Csplit&includePrePost=false`,
        );
        return aggregateCandles(chartToCandles(raw, symbol), 4 * 3600_000);
      }
      const raw = await fetchJsonFromYahoo(
        `/v8/finance/chart/${encodeURIComponent(
          symbol,
        )}?interval=${YAHOO_INTERVAL[interval]}&range=${
          YAHOO_RANGE[interval]
        }&events=div%2Csplit&includePrePost=false`,
      );
      return chartToCandles(raw, symbol);
    })();

    const candles = last.slice(-limit);
    const price = candles[candles.length - 1]?.c ?? NaN;
    return { candles, price };
  });
}

// Binance exposes a 24h ticker; Yahoo doesn't, so derive comparable stats from
// the candle window (last close vs. the close ~24h earlier).
export function computeMarketStats(
  candles: Candle[],
): MarketStats {
  const len = candles.length;
  const last = candles[len - 1];
  const price = last.c;
  const dayMs = 24 * 3600_000;
  const windowStart = last.t - dayMs;

  let baseIndex = -1;
  for (let i = len - 1; i >= 0; i--) {
    if (candles[i].t <= windowStart) {
      baseIndex = i;
      break;
    }
  }
  const basePrice = baseIndex >= 0 ? candles[baseIndex].c : price;

  const within = candles.filter((c) => c.t >= windowStart);
  const high24h = within.reduce((m, c) => Math.max(m, c.h), price);
  const low24h = within.reduce((m, c) => Math.min(m, c.l), price);
  let volume24h = 0;
  let quoteVolume24h = 0;
  for (const c of within) {
    volume24h += c.v;
    quoteVolume24h += c.v * c.c;
  }

  return {
    price,
    change24h: price - basePrice,
    changePercent24h: basePrice > 0 ? ((price - basePrice) / basePrice) * 100 : 0,
    high24h,
    low24h,
    volume24h,
    quoteVolume24h,
  };
}