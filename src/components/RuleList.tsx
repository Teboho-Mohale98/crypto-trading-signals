import type { RuleResult } from "@/lib/types";

import { SignalBadge } from "@/components/SignalBadge";

const ICON: Record<RuleResult["indicator"], string> = {
  RSI: "𝞅",
  EMA: "~",
  MACD: "σ",
  TREND: "∫",
};

export function RuleList({ rules }: { rules: RuleResult[] }) {
  return (
    <ul className="space-y-2">
      {rules.map((rule, i) => (
        <li
          key={i}
          className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 transition-colors hover:border-slate-700"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-slate-400">
                {ICON[rule.indicator]}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                {rule.indicator}
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    rule.vote === "BUY"
                      ? "#34d399"
                      : rule.vote === "SELL"
                        ? "#fb7185"
                        : "#94a3b8",
                }}
              />
            </div>
            <SignalBadge signal={rule.vote} size="sm" />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-100">
            {rule.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {rule.detail}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <span className="text-[10px] uppercase tracking-wide text-slate-600">
              weight
            </span>
            {Array.from({ length: rule.weight }).map((_, k) => (
              <span
                key={k}
                className="h-1.5 w-3 rounded-full"
                style={{
                  background:
                    rule.vote === "BUY"
                      ? "#34d399"
                      : rule.vote === "SELL"
                        ? "#fb7185"
                        : "#64748b",
                  opacity: 0.9 - k * 0.2,
                }}
              />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}