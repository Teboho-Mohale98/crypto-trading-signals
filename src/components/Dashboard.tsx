"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { formatTime } from "@/lib/format";
import { DEFAULT_INTERVAL, INTERVALS, SYMBOLS } from "@/lib/symbols";
import type { Interval, SignalsResponse } from "@/lib/types";

import { AnalysisPanel } from "@/components/AnalysisPanel";
import { CandleChart } from "@/components/CandleChart";
import { Header } from "@/components/Header";
import { MacdPanel, RsiPanel } from "@/components/IndicatorCharts";
import { SignalBadge } from "@/components/SignalBadge";
import { SignalCard } from "@/components/SignalCard";

const REFRESH_MS = 12000;
const SYMBOL_LIST = SYMBOLS.map((s) => s.symbol).join(",");

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 rounded-lg bg-slate-800" />
        <div className="h-6 w-16 rounded-full bg-slate-800" />
      </div>
      <div className="mt-4 h-8 w-40 rounded-lg bg-slate-800" />
      <div className="mt-3 h-12 w-full rounded-lg bg-slate-800/70" />
      <div className="mt-3 h-4 w-3/4 rounded-lg bg-slate-800/70" />
    </div>
  );
}

export function Dashboard() {
  const [interval, setIntervalValue] = useState<Interval>(DEFAULT_INTERVAL);
  const [activeSymbol, setActiveSymbol] = useState<string>(SYMBOLS[0].symbol);
  const [data, setData] = useState<SignalsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();

  const reqSeq = useRef(0);

  const load = useCallback(() => {
      startTransition(async () => {
        const seq = ++reqSeq.current;
        try {
          const res = await fetch(
            `/api/signals?symbols=${SYMBOL_LIST}&interval=${interval}`,
            { cache: "no-store" },
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = (await res.json()) as SignalsResponse;
          if (seq !== reqSeq.current) return;
          setData(json);
          setLastUpdated(Date.now());
          setActiveSymbol((prev) =>
            json.results.some((r) => r.symbol === prev)
              ? prev
              : json.results[0]?.symbol ?? prev,
          );
          if (json.errors.length > 0 && json.results.length === 0) {
            setError(json.errors[0]?.message ?? "No data returned");
          }
        } catch (err) {
          if (seq !== reqSeq.current) return;
          setError(
            err instanceof Error ? err.message : "Failed to load market data",
          );
        }
      });
    },
    [interval],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      load();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const active = useMemo(
    () => data?.results.find((r) => r.symbol === activeSymbol) ?? null,
    [data, activeSymbol],
  );

  const dataSource = active?.dataSource;
  const countdown = lastUpdated
    ? Math.max(0, Math.ceil((REFRESH_MS - (now - lastUpdated)) / 1000))
    : Math.round(REFRESH_MS / 1000);
  const progress = lastUpdated
    ? Math.min(100, Math.max(0, ((now - lastUpdated) / REFRESH_MS) * 100))
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header activeSymbol={data ? "" : activeSymbol} dataSource={dataSource} />

      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(60rem 30rem at 50% -10%, rgba(16,185,129,0.07), transparent 60%), radial-gradient(50rem 25rem at 100% 110%, rgba(56,189,248,0.06), transparent 60%)",
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6">
        {/* Controls */}
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pair
            </span>
            <div className="flex rounded-xl border border-slate-800 bg-slate-900/70 p-1">
              {SYMBOLS.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => setActiveSymbol(s.symbol)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                    activeSymbol === s.symbol
                      ? "bg-slate-700/80 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <span className="ml-2 mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Timeframe
            </span>
            <div className="flex rounded-xl border border-slate-800 bg-slate-900/70 p-1">
              {INTERVALS.map((it) => (
                <button
                  key={it.value}
                  type="button"
                  onClick={() => setIntervalValue(it.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                    interval === it.value
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>

          {/* Refresh status */}
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isPending ? "animate-pulse bg-emerald-400" : "bg-emerald-500/60"
                  }`}
                />
                Updated {formatTime(lastUpdated)}
                <span className="text-slate-600">
                  · refresh in {countdown}s
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => load()}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:opacity-60"
            >
              <svg
                className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
              {isPending ? "Updating…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Refresh progress */}
        {lastUpdated && (
          <div className="mb-5 h-0.5 w-full overflow-hidden rounded-full bg-slate-800/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <div>
              <p className="font-semibold">Events in the data pipeline went sideways</p>
              <p className="mt-0.5 text-rose-300/80">
                {error}. The dashboard retries automatically every{" "}
                {REFRESH_MS / 1000} seconds. Binance public endpoints may be
                geo-blocked in some regions — that is expected.
              </p>
            </div>
          </div>
        )}

        {/* Signal cards */}
        {isPending && !data ? (
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {data?.results.map((a) => (
              <SignalCard
                key={a.symbol}
                analysis={a}
                active={a.symbol === activeSymbol}
                onSelect={setActiveSymbol}
              />
            ))}
          </div>
        )}

        {data?.errors && data.errors.length > 0 && (
          <div className="mt-4 text-xs text-slate-500">
            {data.errors.map((e) => (
              <p key={e.symbol}>
                {e.symbol}: {e.message}
              </p>
            ))}
          </div>
        )}

        {/* Main detail grid */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* Chart */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-slate-100">
                  {active?.symbol ?? SYMBOLS[0].symbol}
                </h2>
                <span className="text-xs text-slate-500">
                  {interval} candlesticks · EMA 20/50 overlay
                </span>
              </div>
              {active && <SignalBadge signal={active.signal.action} size="md" />}
            </div>
            {active ? (
              <CandleChart
                candles={active.candles}
                ema20={active.series.ema20}
                ema50={active.series.ema50}
                interval={interval}
                accent={active.signal.action === "SELL" ? "#fb7185" : "#34d399"}
                height={360}
              />
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-slate-500">
                {isPending ? "Loading chart…" : "Select a pair"}
              </div>
            )}
            <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-t-2 border-dashed border-sky-400" />
                EMA 20
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-t-2 border-amber-500" />
                EMA 50
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-400" />
                Bullish candle
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-rose-400" />
                Bearish candle
              </span>
            </div>
          </section>

          {/* Analysis */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="mb-3 text-sm font-bold text-slate-100">
              Technical analysis
            </h2>
            {active ? (
              <AnalysisPanel analysis={active} interval={interval} />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                Loading analysis…
              </div>
            )}
          </section>
        </div>

        {/* Indicator panes */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              RSI history
            </h3>
            {active ? (
              <RsiPanel
                candles={active.candles}
                values={active.series.rsi}
                interval={interval}
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                Loading…
              </div>
            )}
          </section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              MACD momentum
            </h3>
            {active ? (
              <MacdPanel
                candles={active.candles}
                macd={active.series.macd}
                macdSignal={active.series.macdSignal}
                hist={active.series.macdHistogram}
                interval={interval}
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                Loading…
              </div>
            )}
          </section>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Data: Binance public REST API · Indicators: RSI(14), EMA(20/50),
          MACD(12,26,9) via <code>technicalindicators</code> · Signals are
          algorithmic and informational only — not financial advice.
        </p>
      </main>
    </div>
  );
}