"use client";

import { useMemo, useState } from "react";

import { formatCompact, formatPercent, formatPrice } from "@/lib/format";
import { getSymbolConfig } from "@/lib/symbols";
import type { Market, SymbolSummary } from "@/lib/types";

import { SignalBadge } from "@/components/SignalBadge";

type SortKey =
  | "symbol"
  | "price"
  | "change24h"
  | "volume24h"
  | "rsi"
  | "confidence"
  | "signal";

const MARKET_BADGE: Record<Market, { label: string; className: string }> = {
  crypto: { label: "Crypto", className: "bg-amber-500/15 text-amber-300 ring-amber-500/25" },
  forex: { label: "Forex", className: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/25" },
  index: { label: "Index", className: "bg-violet-500/15 text-violet-300 ring-violet-500/25" },
};

export function Screener({
  results,
  activeSymbol,
  onSelect,
}: {
  results: SymbolSummary[];
  activeSymbol: string;
  onSelect: (symbol: string, interval: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume24h");
  const [sortDesc, setSortDesc] = useState(true);

  const rows = useMemo(() => {
    const filtered = results.filter((r) => {
      const cfg = getSymbolConfig(r.symbol);
      const hay = `${r.symbol} ${cfg.label} ${cfg.description} ${cfg.market}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    });

    const factor = sortDesc ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const av = a;
      const bv = b;
      switch (sortKey) {
        case "symbol":
          return (av.symbol < bv.symbol ? -1 : 1) * factor;
        case "price":
          return (av.market.price - bv.market.price) * factor;
        case "volume24h":
          return (av.market.quoteVolume24h - bv.market.quoteVolume24h) * factor;
        case "confidence":
          return (av.signal.confidence - bv.signal.confidence) * factor;
        case "rsi": {
          const ra = av.indicators.rsi ?? -1;
          const rb = bv.indicators.rsi ?? -1;
          return (ra - rb) * factor;
        }
        case "change24h":
          return (av.market.changePercent24h - bv.market.changePercent24h) * factor;
        default:
          return 0;
      }
    });
  }, [results, query, sortKey, sortDesc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(key === "symbol");
    }
  };

  const th = (
    key: SortKey,
    label: string,
    className = "",
  ) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className={`inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-wider hover:text-slate-200 ${
        sortKey === key ? "text-slate-200" : "text-slate-500"
      } ${className}`}
    >
      {label}
      {sortKey === key && (
        <span className="text-[9px]">{sortDesc ? "▼" : "▲"}</span>
      )}
    </button>
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Market Screener
          <span className="ml-2 text-slate-600">{rows.length}/{results.length}</span>
        </h3>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter pair…"
          className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-slate-600 focus:outline-none sm:w-48"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="pb-2 pr-2 font-semibold">{th("symbol", "Pair")}</th>
              <th className="pb-2 pr-2 text-left font-semibold">Market</th>
              <th className="pb-2 pr-2 font-semibold">{th("signal", "Signal")}</th>
              <th className="pb-2 pr-2 text-right font-semibold">{th("price", "Price")}</th>
              <th className="pb-2 pr-2 text-right font-semibold">{th("change24h", "24h %")}</th>
              <th className="pb-2 pr-2 text-right font-semibold">{th("volume24h", "24h Vol")}</th>
              <th className="pb-2 pr-2 text-right font-semibold">{th("rsi", "RSI")}</th>
              <th className="pb-2 text-right font-semibold">{th("confidence", "Conf")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cfg = getSymbolConfig(r.symbol);
              const up = r.market.changePercent24h >= 0;
              return (
                <tr
                  key={r.symbol}
                  onClick={() => onSelect(r.symbol, r.interval)}
                  className={`cursor-pointer border-b border-slate-800/60 transition-colors hover:bg-slate-800/40 ${
                    activeSymbol === r.symbol ? "bg-slate-800/40" : ""
                  }`}
                >
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black text-slate-950"
                        style={{ background: cfg.accent }}
                      >
                        {cfg.base.slice(0, 1)}
                      </span>
                      <div className="leading-tight">
                        <p className="font-semibold text-slate-200">{cfg.label}</p>
                        <p className="text-[10px] text-slate-600">{cfg.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2">
                    <SignalBadge signal={r.signal.action} size="sm" />
                  </td>
                  <td className="py-2.5 pr-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                        MARKET_BADGE[cfg.market].className
                      }`}
                    >
                      {MARKET_BADGE[cfg.market].label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-right font-semibold tabular-nums text-slate-200">
                    {formatPrice(r.market.price)}
                  </td>
                  <td
                    className={`py-2.5 pr-2 text-right font-semibold tabular-nums ${
                      up ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatPercent(r.market.changePercent24h)}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-slate-400">
                    {formatCompact(r.market.quoteVolume24h)}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums text-slate-300">
                    {r.indicators.rsi !== null ? r.indicators.rsi.toFixed(1) : "—"}
                  </td>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-slate-300">
                    {r.signal.confidence}%
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">
                  No pairs match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}