"use client";

import { useEffect, useState } from "react";

import type { SentimentResponse } from "@/lib/types";

function fngZone(value: number): { label: string; color: string; text: string } {
  if (value <= 25)
    return { label: "Extreme Fear", color: "#f43f5e", text: "text-rose-400" };
  if (value < 45)
    return { label: "Fear", color: "#fb923c", text: "text-orange-400" };
  if (value <= 55)
    return { label: "Neutral", color: "#94a3b8", text: "text-slate-400" };
  if (value < 75)
    return { label: "Greed", color: "#34d399", text: "text-emerald-400" };
  return { label: "Extreme Greed", color: "#10b981", text: "text-emerald-300" };
}

function needle(point: number): string {
  const angle = -120 + (point / 100) * 240;
  return `rotate(${angle} 50 50)`;
}

export function SentimentGauge() {
  const [data, setData] = useState<SentimentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/sentiment", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as SentimentResponse;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unavailable");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = data?.value ?? null;
  const zone = value !== null ? fngZone(value) : null;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Market Sentiment
        </h3>
        <span className="text-[10px] text-slate-600">Fear &amp; Greed · alternative.me</span>
      </div>

      {data && value !== null && zone ? (
        <div className="flex items-center gap-4">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <path
                d="M 18 78 A 46 46 0 1 1 82 78"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="fngGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <path
                d="M 18 78 A 46 46 0 1 1 82 78"
                fill="none"
                stroke="url(#fngGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(value / 100) * 200.8} 200.8`}
                opacity="0.9"
              />
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="18"
                stroke="#e2e8f0"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={needle(value)}
              />
              <circle cx="50" cy="50" r="4" fill="#e2e8f0" />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center pt-4 text-slate-100">
              <span className="text-xl font-black tabular-nums">{value}</span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-base font-bold ${zone.text}`}>{zone.label}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Update{" "}
              {data.updatedAt
                ? new Date(data.updatedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : "—"}
            </p>
            {data.history.length > 0 && (
              <div className="mt-2 flex h-6 items-end gap-0.5">
                {data.history.slice(0, 20).map((p) => {
                  const c = fngZone(p.value).color;
                  return (
                    <span
                      key={p.timestamp}
                      title={`${p.value} · ${p.classification}`}
                      className="w-1.5 rounded-sm"
                      style={{
                        height: `${Math.max(12, p.value)}%`,
                        background: c,
                        opacity: 0.75,
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center text-xs text-slate-500">
          {error ? `Sentiment unavailable — ${error}` : "Loading sentiment…"}
        </div>
      )}
    </section>
  );
}