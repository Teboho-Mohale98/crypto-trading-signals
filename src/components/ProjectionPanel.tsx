"use client";

import { useMemo, useState } from "react";

import {
  SCENARIOS,
  projectCapital,
  type ScenarioId,
} from "@/lib/projection";
import type { Interval, SymbolAnalysis } from "@/lib/types";

const TIER_AMOUNTS = [200, 500, 1000, 2000];

function formatR(value: number): string {
  return `R${Math.round(value).toLocaleString("en-US")}`;
}

function formatSignedR(value: number): string {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : "−"}R${Math.abs(rounded).toLocaleString("en-US")}`;
}

function OutcomeCard({
  label,
  final,
  amount,
  tone,
  note,
}: {
  label: string;
  final: number;
  amount: number;
  tone: string;
  note: string;
}) {
  const profit = final - amount;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-black tabular-nums" style={{ color: tone }}>
        {formatR(final)}
      </p>
      <p className="mt-0.5 text-[10px] tabular-nums text-slate-500">
        {formatSignedR(profit)} over 7 days
      </p>
      <p className="mt-1 text-[10px] leading-snug text-slate-600">{note}</p>
    </div>
  );
}

export function ProjectionPanel({
  analysis,
  interval,
}: {
  analysis: SymbolAnalysis;
  interval: Interval;
}) {
  const [amountRaw, setAmountRaw] = useState("200");
  const [scenarioId, setScenarioId] = useState<ScenarioId>("moderate");

  const amount = Math.max(0, Number(amountRaw) || 0);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[1];

  const projection = useMemo(
    () => projectCapital(analysis.backtest, interval, amount, scenario),
    [analysis.backtest, interval, amount, scenario],
  );

  const tierRows = useMemo(
    () =>
      TIER_AMOUNTS.map((a) => ({
        amount: a,
        projection: projectCapital(analysis.backtest, interval, a, scenario),
      })),
    [analysis.backtest, interval, scenario],
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Capital projection · hypothetical
        </h3>
        <span className="text-[10px] text-slate-600">
          {analysis.symbol} · {interval} · from this pair&apos;s own backtest
        </span>
      </div>

      {/* Controls */}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Capital
          </span>
          <span className="flex items-center rounded-xl border border-slate-700 bg-slate-950/70 pl-3">
            <span className="text-sm font-bold text-slate-400">R</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={10}
              value={amountRaw}
              onChange={(e) => setAmountRaw(e.target.value)}
              className="w-28 bg-transparent px-2 py-1.5 text-sm font-bold tabular-nums text-white outline-none"
            />
          </span>
        </label>

        <div className="flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScenarioId(s.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                scenarioId === s.id
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {!projection ? (
        <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-3 text-xs text-amber-300">
          Not enough backtest history on {analysis.symbol} ({interval}) to model
          a projection yet — try another pair or timeframe.
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <OutcomeCard
              label="Expected outcome"
              final={projection.expectedFinal}
              amount={amount}
              tone="#38bdf8"
              note={`Mean result: ${projection.expectedWeeklyPercent.toFixed(1)}% over 7 days — every setup taken at ${scenario.blurb.toLowerCase()}.`}
            />
            <OutcomeCard
              label="Optimistic run"
              final={projection.optimisticFinal}
              amount={amount}
              tone="#34d399"
              note={`Every setup closes a winner at the historic average winning move of +${projection.avgWinMovePercent.toFixed(2)}%.`}
            />
            <OutcomeCard
              label="Downside — all losers"
              final={projection.downsideFinal}
              amount={amount}
              tone="#fb7185"
              note={`Every setup closes a loser at the historic average losing move of ${projection.avgLossMovePercent.toFixed(2)}%. Losing your entire capital is possible.`}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-500">
            <span>
              ~{projection.setupsPerWeek} setups/week · backtest win-rate{" "}
              <span className="font-bold text-slate-300">
                {projection.winRatePercent.toFixed(0)}%
              </span>{" "}
              · avg move {projection.avgMovePercent.toFixed(2)}% per setup
            </span>
            <span className="text-slate-600">7-day horizon</span>
          </div>

          {/* Investment tiers */}
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Starter tiers · {scenario.label} scenario
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
              {tierRows.map(({ amount: a, projection: p }) => {
                const active = a === amount;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmountRaw(String(a))}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                      active
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                    }`}
                  >
                    <p className="text-sm font-black text-slate-100">
                      {formatR(a)}
                    </p>
                    {p ? (
                      <>
                        <p
                          className={`mt-0.5 text-xs font-bold tabular-nums ${
                            p.expectedProfit >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {formatSignedR(p.expectedProfit)} expected
                        </p>
                        <p className="mt-0.5 text-[10px] tabular-nums text-slate-600">
                          downside {formatR(p.downsideFinal)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-0.5 text-[10px] text-slate-600">
                        no backtest data
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        <p className="text-[11px] leading-relaxed text-rose-300/90">
          <span className="font-bold">Nothing here is guaranteed.</span> These are
          hypothetical projections from historic backtest data — not a promise,
          forecast or offer of returns. Real results will differ, past performance
          never guarantees future results, and you can lose your entire
          investment. Never trade money you cannot afford to lose. Not financial
          advice.
        </p>
      </div>
    </section>
  );
}
