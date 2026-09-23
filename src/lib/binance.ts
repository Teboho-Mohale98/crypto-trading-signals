import type { Candle, Interval, MarketStats } from "@/lib/types";

const BINANCE_HOSTS = [
  "https://api.binance.com",
  "https://data-api.binance.vision",
  "https://api1.binance.com",
  "https://api2.binance.com",
  "https://api3.binance.com",
];

export const CANDLE_LIMIT = 200;

export class BinanceDataError extends Error {}

async function fetchJsonWithFallback(
  path: string,
  init?: RequestInit,
): Promise<{ data: unknown; host: string }> {
  let lastError: unknown;

  for (const host of BINANCE_HOSTS) {
    try {
      const res = await fetch(`${host}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init?.headers ?? {}),
        },
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
  const { data, host } = await fetchJsonWithFallback(
    `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    { cache: "no-store" },
  );

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
}

export async function fetch24hrTicker(
  symbol: string,
): Promise<MarketStats> {
  const { data } = await fetchJsonWithFallback(
    `/api/v3/ticker/24hr?symbol=${symbol}`,
    { cache: "no-store" },
  );

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
}
