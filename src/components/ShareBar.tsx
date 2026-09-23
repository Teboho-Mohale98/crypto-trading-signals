"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import type { SymbolAnalysis } from "@/lib/types";

export function ShareBar({ analysis }: { analysis?: SymbolAnalysis | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const symbol = analysis?.symbol ?? searchParams.get("symbol") ?? "";
  const interval = searchParams.get("interval") ?? "1h";

  const shareUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (symbol) params.set("symbol", symbol);
    params.set("interval", interval);
    return `${window.location.origin}${pathname}?${params.toString()}`;
  }, [pathname, symbol, interval]);

  const copyShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [shareUrl]);

  const exportCsv = useCallback(() => {
    if (!analysis) return;
    const rows: string[][] = [
      ["time", "open", "high", "low", "close", "volume", "ema20", "ema50", "rsi", "macd", "macd_signal", "bb_upper", "bb_middle", "bb_lower", "stoch_rsi", "adx", "atr"],
    ];
    const n = analysis.candles.length;
    for (let i = 0; i < n; i++) {
      const c = analysis.candles[i];
      const s = analysis.series;
      rows.push([
        new Date(c.t).toISOString(),
        String(c.o),
        String(c.h),
        String(c.l),
        String(c.c),
        String(c.v),
        s.ema20[i] !== null ? String(s.ema20[i]) : "",
        s.ema50[i] !== null ? String(s.ema50[i]) : "",
        s.rsi[i] !== null ? String(s.rsi[i]) : "",
        s.macd[i] !== null ? String(s.macd[i]) : "",
        s.macdSignal[i] !== null ? String(s.macdSignal[i]) : "",
        s.bbUpper[i] !== null ? String(s.bbUpper[i]) : "",
        s.bbMiddle[i] !== null ? String(s.bbMiddle[i]) : "",
        s.bbLower[i] !== null ? String(s.bbLower[i]) : "",
        s.stochRsi[i] !== null ? String(s.stochRsi[i]) : "",
        s.adx[i] !== null ? String(s.adx[i]) : "",
        s.atr[i] !== null ? String(s.atr[i]) : "",
      ]);
    }
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${analysis.symbol}-${interval}-indicators.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysis, interval]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyShare}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
        title="Copy shareable link"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        {copied ? "Copied!" : "Share"}
      </button>
      <button
        type="button"
        onClick={exportCsv}
        disabled={!analysis}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        title="Download candles + indicators as CSV"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        CSV
      </button>
      <span className="hidden text-[10px] text-slate-600 sm:inline">
        {symbol ? `${shareUrl.split("?")[1] ?? ""}` : ""}
      </span>
    </div>
  );
}