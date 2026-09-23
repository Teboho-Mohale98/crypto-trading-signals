"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { formatTime } from "@/lib/format";
import { DEFAULT_INTERVAL, INTERVALS, INSTRUMENTS, MARKETS, getSymbolConfig } from "@/lib/symbols";
import type { Interval, Market, SignalsResponse, SymbolAnalysis } from "@/lib/types";

import { AnalysisPanel } from "@/components/AnalysisPanel";
import { BacktestPanel } from "@/components/BacktestPanel";
import { Header } from "@/components/Header";
import { OverviewStrip } from "@/components/OverviewStrip";
import { ProChart } from "@/components/ProChart";
import { Screener } from "@/components/Screener";
import { SentimentGauge } from "@/components/SentimentGauge";
import { ShareBar } from "@/components/ShareBar";
import { SignalCard } from "@/components/SignalCard";
import { TradeLevels } from "@/components/TradeLevels";

const REFRESH_MS = 12000;

const INTERVAL_SET: Interval[] = INTERVALS.map((i) => i.value);

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
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlSymbol = searchParams.get("symbol");
  const urlInterval = searchParams.get("interval");

  const [interval, setIntervalValue] = useState<Interval>(
    INTERVAL_SET.includes(urlInterval as Interval) ? (urlInterval as Interval) : DEFAULT_INTERVAL,
  );
  const [activeMarket, setActiveMarket] = useState<Market | "all">("all");
  const [activeSymbol, setActiveSymbol] = useState<string>(
    urlSymbol && INSTRUMENTS.some((s) => s.symbol === urlSymbol)
      ? urlSymbol
      : INSTRUMENTS[0].symbol,
  );

  const [data, setData] = useState<SignalsResponse | null>(null);
  const [analysis, setAnalysis] = useState<SymbolAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [isPending, startTransition] = useTransition();
  const [isAnalysisPending, startAnalysisTransition] = useTransition();
  const [analysisKey, setAnalysisKey] = useState(`${activeSymbol}|${interval}`);

  const reqSeq = useRef(0);
  const analysisSeq = useRef(0);

  const pushUrlState = useCallback(
    (symbol: string, ivl: Interval) => {
      const params = new URLSearchParams();
      params.set("symbol", symbol);
      params.set("interval", ivl);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const selectSymbol = useCallback(
    (symbol: string, ivl: string) => {
      const nextInterval = (INTERVAL_SET as string[]).includes(ivl)
        ? (ivl as Interval)
        : interval;
      setActiveSymbol(symbol);
      if (nextInterval !== interval) setIntervalValue(nextInterval);
      pushUrlState(symbol, nextInterval);
      setAnalysisKey(`${symbol}|${nextInterval}`);
    },
    [interval, pushUrlState],
  );

  const selectInterval = useCallback(
    (ivl: Interval) => {
      setIntervalValue(ivl);
      pushUrlState(activeSymbol, ivl);
      setAnalysisKey(`${activeSymbol}|${ivl}`);
    },
    [activeSymbol, pushUrlState],
  );

  const load = useCallback(() => {
    startTransition(async () => {
      const seq = ++reqSeq.current;
      try {
        const res = await fetch(`/api/signals?interval=${interval}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as SignalsResponse;
        if (seq !== reqSeq.current) return;
        setData(json);
        setLastUpdated(Date.now());
        if (json.errors.length > 0 && json.results.length === 0) {
          setError(json.errors[0]?.message ?? "No data returned");
        }
      } catch (err) {
        if (seq !== reqSeq.current) return;
        setError(err instanceof Error ? err.message : "Failed to load market data");
      }
    });
  }, [interval]);

  const loadAnalysis = useCallback(() => {
    const [sym, ivl] = analysisKey.split("|");
    startAnalysisTransition(async () => {
      const seq = ++analysisSeq.current;
      try {
        const res = await fetch(`/api/analysis?symbol=${sym}&interval=${ivl}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(
            body?.error ??
              (res.status === 404
                ? `Pair ${sym} not found on this timeframe`
                : `HTTP ${res.status}`),
          );
        }
        setAnalysisError(null);
        const json = (await res.json()) as SymbolAnalysis;
        if (seq !== analysisSeq.current) return;
        setAnalysis(json);
      } catch (err) {
        if (seq !== analysisSeq.current) return;
        setAnalysisError(
          err instanceof Error ? err.message : "Failed to load detailed analysis",
        );
      }
    });
  }, [analysisKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      load();
      loadAnalysis();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [load, loadAnalysis]);

  const featured = useMemo(
    () =>
      data?.results.filter(
        (r) =>
          getSymbolConfig(r.symbol).featured &&
          (activeMarket === "all" || getSymbolConfig(r.symbol).market === activeMarket),
      ) ?? [],
    [data, activeMarket],
  );

  const chips = useMemo(() => {
    if (activeMarket === "all") return INSTRUMENTS;
    return INSTRUMENTS.filter((s) => s.market === activeMarket);
  }, [activeMarket]);

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

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 pb-16 pt-6 sm:px-6">
        {/* Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Market
            </span>
            <div className="flex rounded-xl border border-slate-800 bg-slate-900/70 p-1">
              {(["all", ...MARKETS.map((m) => m.value)] as (Market | "all")[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setActiveMarket(m)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                    activeMarket === m
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m === "all" ? "All" : MARKETS.find((x) => x.value === m)?.label}
                </button>
              ))}
            </div>

            <span className="ml-2 mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pair
            </span>
            <div className="flex flex-wrap rounded-xl border border-slate-800 bg-slate-900/70 p-1">
              {chips.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => selectSymbol(s.symbol, interval)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
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
                  onClick={() => selectInterval(it.value)}
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <ShareBar analysis={analysis} />
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isPending ? "animate-pulse bg-emerald-400" : "bg-emerald-500/60"
                  }`}
                />
                Updated {formatTime(lastUpdated)}
                <span className="text-slate-600">· {countdown}s</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                load();
                loadAnalysis();
              }}
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
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-slate-800/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
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
                {error}. The dashboard retries automatically every {REFRESH_MS / 1000}
                seconds. Public data endpoints may be geo-blocked or rate-limited in
                some regions — that is expected.
              </p>
            </div>
          </div>
        )}

        {/* Overview */}
        {data?.aggregates && <OverviewStrip aggregates={data.aggregates} />}

        {/* Featured cards */}
        {isPending && !data ? (
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((a) => (
              <SignalCard
                key={a.symbol}
                analysis={a}
                active={a.symbol === activeSymbol}
                onSelect={selectSymbol}
              />
            ))}
          </div>
        )}

        {/* Screener + sentiment */}
        {data && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Screener
                results={data.results}
                activeSymbol={activeSymbol}
                onSelect={selectSymbol}
              />
            </div>
            <SentimentGauge />
          </div>
        )}

        {/* Detail */}
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-slate-100">{activeSymbol}</h2>
                <span className="text-xs text-slate-500">
                  {interval} · TradingView-style panes
                </span>
              </div>
              {active && <span className="text-xs text-slate-600">{active.dataSource}</span>}
            </div>
            {analysis && !analysisError ? (
              <ProChart
                symbol={analysis.symbol}
                interval={analysis.interval}
                candles={analysis.candles}
                series={analysis.series}
                height={430}
              />
            ) : (
              <div className="flex h-96 items-center justify-center text-sm text-slate-500">
                {isAnalysisPending
                  ? "Loading chart…"
                  : analysisError ?? "Select a pair to load the chart"}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="mb-3 text-sm font-bold text-slate-100">
              Technical analysis
            </h2>
            {analysis && !analysisError ? (
              <AnalysisPanel analysis={analysis} interval={interval} />
            ) : (
              <div className="flex h-64 items-center justify-center text-center text-sm text-slate-500">
                {isAnalysisPending
                  ? "Loading analysis…"
                  : analysisError ?? "Select a pair"}
              </div>
            )}
          </section>
        </div>

        {/* Levels + backtest */}
        {analysis && !analysisError && (
          <div className="grid gap-4 lg:grid-cols-2">
            <TradeLevels levels={analysis.tradeLevels} />
            <BacktestPanel backtest={analysis.backtest} />
          </div>
        )}

        {data?.errors && data.errors.length > 0 && (
          <div className="text-xs text-slate-600">
            {data.errors.map((e) => (
              <p key={e.symbol}>
                {e.symbol}: {e.message}
              </p>
            ))}
          </div>
        )}

        <p className="pt-4 text-center text-xs text-slate-600">
          Data: Binance public REST API (crypto, no key) + Yahoo Finance
          (forex & indices, no key). Indicators: RSI(14), EMA(20/50),
          MACD(12,26,9), Bollinger(20,2σ), StochRSI(14), ADX(14), ATR(14) via{" "}
          <code>technicalindicators</code>, chart rendering via{" "}
          <code>lightweight-charts</code>. Signals & backtest are algorithmic and
          informational only — not financial advice.
        </p>
      </main>
    </div>
  );
}