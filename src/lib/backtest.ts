import type { BacktestMetrics, BacktestResult, Candle } from "@/lib/types";

import { signalAt, type ComputedIndicators } from "@/lib/signal-engine";

export const BACKTEST_HORIZON = 5;
export const BACKTEST_THRESHOLD_PERCENT = 0.5;

export const MIN_INDEX = 70;

function emptyMetrics(): BacktestMetrics {
  return {
    wins: 0,
    losses: 0,
    total: 0,
    winRate: 0,
    avgMovePercent: 0,
    avgWinMovePercent: 0,
    avgLossMovePercent: 0,
  };
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

  const moveSums = {
    buy: { win: 0, loss: 0 },
    sell: { win: 0, loss: 0 },
    strongBuy: { win: 0, loss: 0 },
    strongSell: { win: 0, loss: 0 },
  };

  const n = candles.length;
  const closes = candles.map((c) => c.c);

  for (let i = MIN_INDEX; i < n - BACKTEST_HORIZON; i++) {
    const entry = closes[i];
    if (!Number.isFinite(entry) || entry <= 0) continue;

    const { action } = signalAt(candles, ind, i);
    const key =
      action === "STRONG_BUY"
        ? "strongBuy"
        : action === "BUY"
          ? "buy"
          : action === "STRONG_SELL"
            ? "strongSell"
            : action === "SELL"
              ? "sell"
              : null;

    if (!key) continue;

    const bucket = metrics[key];
    const direction = action.includes("BUY") ? 1 : -1;
    const exit = closes[i + BACKTEST_HORIZON];
    if (!Number.isFinite(exit)) continue;

    const movePercent = ((exit - entry) / entry) * 100 * direction;
    if (movePercent >= BACKTEST_THRESHOLD_PERCENT) {
      bucket.wins += 1;
      moveSums[key].win += movePercent;
    } else if (movePercent <= -BACKTEST_THRESHOLD_PERCENT) {
      bucket.losses += 1;
      moveSums[key].loss += movePercent;
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
    m.avgWinMovePercent = m.wins > 0 ? moveSums[key].win / m.wins : 0;
    m.avgLossMovePercent = m.losses > 0 ? moveSums[key].loss / m.losses : 0;
  }

  return {
    buy: metrics.buy,
    sell: metrics.sell,
    strongBuy: metrics.strongBuy,
    strongSell: metrics.strongSell,
    horizonCandles: BACKTEST_HORIZON,
    thresholdPercent: BACKTEST_THRESHOLD_PERCENT,
    candlesCount: n,
    evaluatedCandles: Math.max(0, n - BACKTEST_HORIZON - MIN_INDEX),
  };
}