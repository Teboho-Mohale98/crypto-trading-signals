import type { SignalAction } from "@/lib/types";

const STYLES: Record<SignalAction, string> = {
  STRONG_BUY: "border-emerald-400/60 bg-emerald-500/25 text-emerald-300 shadow-sm shadow-emerald-500/20",
  BUY: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
  NEUTRAL: "border-slate-600/60 bg-slate-700/25 text-slate-300",
  SELL: "border-rose-500/40 bg-rose-500/15 text-rose-400",
  STRONG_SELL: "border-rose-400/60 bg-rose-500/25 text-rose-300 shadow-sm shadow-rose-500/20",
};

const TONES: Record<SignalAction, string> = {
  STRONG_BUY: "#10b981",
  BUY: "#34d399",
  NEUTRAL: "#94a3b8",
  SELL: "#fb7185",
  STRONG_SELL: "#f43f5e",
};

export interface SignalBadgeProps {
  signal?: SignalAction;
  symbol?: string;
  size?: "sm" | "md" | "lg";
}

export function TONE(action: SignalAction): string {
  return TONES[action];
}

export function SignalBadge({ signal, symbol, size = "sm" }: SignalBadgeProps) {
  if (!signal) {
    return (
      <span className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {symbol ?? "—"}
      </span>
    );
  }

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider shadow-sm ${STYLES[signal]} ${sizes[size]}`}
    >
      {signal !== "NEUTRAL" && (
        <svg className="h-1.5 w-1.5" viewBox="0 0 6 6" fill={TONES[signal]}>
          <circle cx="3" cy="3" r="3" />
        </svg>
      )}
      {signal}
    </span>
  );
}