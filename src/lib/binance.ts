import { cached } from "@/lib/cache";
import type { Candle, Interval, MarketStats } from "@/lib/types";

const BINANCE_HOSTS = [
  "https://api.binance.com",
  "https://data-api.binance.vision",
  "https://api1.binance.com",
  "https://api2.binance.com",
  "https://api3.binance.com",
];

export const CANDLE_LIMIT = 200;

// Short in-process TTL cache: every dashboard query is served from memory for a
// few seconds so consecutive polls don't hammer Binance (works on Vercel's
// serverless model where an instance can serve several overlapping requests).
const KLINE_TTL_MS = 8_000;
const TICKER_TTL_MS = 8_000;

export class BinanceDataError extends Error {}

async function fetchJsonWithFallback(
  path: string,
): Promise<{ data: unknown; host: string }> {
  let lastError: unknown;

  for (const host of BINANCE_HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        return { data: await res.json(), host };
      }

      lastError = new Error(`HTTP ${res.status} from ${host}${path}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw new BinanceDataError(
    `All Binance public endpoints failed for ${path}: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

type RawKline = [
  number, // open time
  string, // open
  string, // high
  string, // low
  string, // close
  string, // volume
  number, // close time
  string, // quote asset volume
  number, // trades
  string, // taker buy base
  string, // taker buy quote
  string, // ignore
];

export async function fetchKlines(
  symbol: string,
  interval: Interval,
  limit = CANDLE_LIMIT,
): Promise<{ candles: Candle[]; host: string }> {
  const path = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  return cached(
    `kline:${path}`,
    KLINE_TTL_MS,
    async () => {
      const { data, host } = await fetchJsonWithFallback(path);
      if (!Array.isArray(data)) {
        throw new BinanceDataError(`Unexpected klines payload for ${symbol}`);
      }
      const candles = (data as RawKline[]).map((k) => ({
        t: k[0],
        o: Number(k[1]),
        h: Number(k[2]),
        l: Number(k[3]),
        c: Number(k[4]),
        v: Number(k[5]),
      }));
      return { candles, host };
    },
  );
}

export async function fetch24hrTicker(symbol: string): Promise<MarketStats> {
  const path = `/api/v3/ticker/24hr?symbol=${symbol}`;

  return cached(
    `ticker:${path}`,
    TICKER_TTL_MS,
    async () => {
      const { data } = await fetchJsonWithFallback(path);
      const t = data as {
        lastPrice: string;
        priceChange: string;
        priceChangePercent: string;
        highPrice: string;
        lowPrice: string;
        volume: string;
        quoteVolume: string;
      };
      return {
        price: Number(t.lastPrice),
        change24h: Number(t.priceChange),
        changePercent24h: Number(t.priceChangePercent),
        high24h: Number(t.highPrice),
        low24h: Number(t.lowPrice),
        volume24h: Number(t.volume),
        quoteVolume24h: Number(t.quoteVolume),
      };
    },
  );
}