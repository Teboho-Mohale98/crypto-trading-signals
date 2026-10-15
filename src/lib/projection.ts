import type { BacktestResult, Interval } from "@/lib/types";

const MINUTES_PER_WEEK = 10080;

const INTERVAL_MINUTES: Record<Interval, number> = {
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "4h": 240,
  "1d": 1440,
};

export type ScenarioId = "conservative" | "moderate" | "aggressive";

export interface Scenario {
  id: ScenarioId;
  label: string;
  blurb: string;
  moveMultiplier: number;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "conservative",
    label: "Conservative",
    blurb: "Half position size — lowest exposure per signal",
    moveMultiplier: 0.5,
  },
  {
    id: "moderate",
    label: "Moderate",
    blurb: "Full position size on every signal",
    moveMultiplier: 1,
  },
  {
    id: "aggressive",
    label: "Aggressive",
    blurb: "Double position size on STRONG signals — highest exposure",
    moveMultiplier: 2,
  },
];

export interface Projection {
  setupsPerWeek: number;
  winRatePercent: number;
  avgMovePercent: number;
  avgWinMovePercent: number;
  avgLossMovePercent: number;
  expectedWeeklyPercent: number;
  expectedFinal: number;
  expectedProfit: number;
  optimisticFinal: number;
  downsideFinal: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Projects a starting capital amount over one week using the pair's own
 * historic backtest as the edge estimate. Purely hypothetical: no outcome
 * is guaranteed and the downside can be the full capital.
 */
export function projectCapital(
  backtest: BacktestResult,
  interval: Interval,
  amount: number,
  scenario: Scenario,
): Projection | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const buckets = [
    backtest.buy,
    backtest.sell,
    backtest.strongBuy,
    backtest.strongSell,
  ];

  let total = 0;
  let wins = 0;
  let losses = 0;
  let moveSum = 0;
  let winSum = 0;
  let lossSum = 0;
  for (const b of buckets) {
    total += b.total;
    wins += b.wins;
    losses += b.losses;
    moveSum += b.avgMovePercent * b.total;
    winSum += b.avgWinMovePercent * b.wins;
    lossSum += b.avgLossMovePercent * b.losses;
  }

  if (total < 10 || backtest.evaluatedCandles < 50) return null;

  const avgMove = moveSum / total;
  const avgWin = wins > 0 ? winSum / wins : 0;
  const avgLoss = losses > 0 ? lossSum / losses : 0;
  const winRate = wins / total;
  if (!Number.isFinite(avgMove)) return null;

  const candlesPerWeek = MINUTES_PER_WEEK / INTERVAL_MINUTES[interval];
  const setupsPerWeek = (total / backtest.evaluatedCandles) * candlesPerWeek;

  const size = scenario.moveMultiplier;

  const expectedWeeklyPercent = clamp(setupsPerWeek * avgMove * size, -95, 500);
  const optimisticWeeklyPercent = clamp(
    setupsPerWeek * Math.max(avgWin, 0) * size,
    0,
    1000,
  );
  const downsideWeeklyPercent = clamp(
    setupsPerWeek * Math.min(avgLoss, 0) * size,
    -100,
    0,
  );

  const toFinal = (pct: number) =>
    Math.max(0, Math.round(amount * (1 + pct / 100)));
  const expectedFinal = toFinal(expectedWeeklyPercent);

  return {
    setupsPerWeek: Math.round(setupsPerWeek * 10) / 10,
    winRatePercent: winRate * 100,
    avgMovePercent: avgMove,
    avgWinMovePercent: avgWin,
    avgLossMovePercent: avgLoss,
    expectedWeeklyPercent,
    expectedFinal,
    expectedProfit: expectedFinal - amount,
    optimisticFinal: toFinal(optimisticWeeklyPercent),
    downsideFinal: toFinal(downsideWeeklyPercent),
  };
}
