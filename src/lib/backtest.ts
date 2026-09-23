import type { BacktestMetrics, BacktestResult, Candle } from "@/lib/types";

import { signalAt, type ComputedIndicators } from "@/lib/signal-engine";

export const BACKTEST_HORIZON = 5;
export const BACKTEST_THRESHOLD_PERCENT = 0.5;

const MIN_INDEX = 70;

function emptyMetrics(): BacktestMetrics {
  return { wins: 0, losses: 0, total: 0, winRate: 0, avgMovePercent: 0 };
}

/**
 * Replays the signal engine across history: at each closed candle the engine
 * emits an action; a trade is scored "win" if price moves at least
 * `thresholdPercent` in the signal direction within `horizonCandles`.
 * Trades that reach neither threshold in time are skipped (no trade).
 */
export function runBacktest(
  candles: Candle[],
  ind: ComputedIndicators,
): BacktestResult {
  const metrics = {
    buy: emptyMetrics(),
    sell: emptyMetrics(),
    strongBuy: emptyMetrics(),
    strongSell: emptyMetrics(),
  };

  const n = candles.length;
  const closes = candles.map((c) => c.c);

  for (let i = MIN_INDEX; i < n - BACKTEST_HORIZON; i++) {
    const entry = closes[i];
    if (!Number.isFinite(entry) || entry <= 0) continue;

    const { action } = signalAt(candles, ind, i);
    const bucket =
      action === "STRONG_BUY"
        ? metrics.strongBuy
        : action === "BUY"
          ? metrics.buy
          : action === "STRONG_SELL"
            ? metrics.strongSell
            : action === "SELL"
              ? metrics.sell
              : null;

    if (!bucket) continue;

    const direction = action.includes("BUY") ? 1 : -1;
    const exit = closes[i + BACKTEST_HORIZON];
    if (!Number.isFinite(exit)) continue;

    const movePercent = ((exit - entry) / entry) * 100 * direction;
    if (movePercent >= BACKTEST_THRESHOLD_PERCENT) {
      bucket.wins += 1;
    } else if (movePercent <= -BACKTEST_THRESHOLD_PERCENT) {
      bucket.losses += 1;
    }

    bucket.total += 1;
    bucket.avgMovePercent += movePercent;
  }

  for (const key of [
    "buy",
    "sell",
    "strongBuy",
    "strongSell",
  ] as const) {
    const m = metrics[key];
    m.winRate = m.total > 0 ? (m.wins / m.total) * 100 : 0;
    m.avgMovePercent = m.total > 0 ? m.avgMovePercent / m.total : 0;
  }

  return {
    buy: metrics.buy,
    sell: metrics.sell,
    strongBuy: metrics.strongBuy,
    strongSell: metrics.strongSell,
    horizonCandles: BACKTEST_HORIZON,
    thresholdPercent: BACKTEST_THRESHOLD_PERCENT,
    candlesCount: n,
  };
}