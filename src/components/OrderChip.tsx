import type { ExecutionAdvice, OrderType } from "@/lib/types";

const ORDER_LABEL: Record<OrderType, string> = {
  MARKET: "Market",
  BUY_LIMIT: "Buy Limit",
  SELL_LIMIT: "Sell Limit",
  BUY_STOP: "Buy Stop",
  SELL_STOP: "Sell Stop",
  BUY_STOP_LIMIT: "Buy Stop Limit",
  SELL_STOP_LIMIT: "Sell Stop Limit",
};

const ORDER_CLASS: Record<OrderType, string> = {
  MARKET: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  BUY_LIMIT: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  SELL_LIMIT: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  BUY_STOP: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  SELL_STOP: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  BUY_STOP_LIMIT: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  SELL_STOP_LIMIT: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

export function OrderChip({
  execution,
  size = "sm",
}: {
  execution: ExecutionAdvice;
  size?: "sm" | "md";
}) {
  const orderType = execution.orderType;
  if (!orderType) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ring-1 ring-inset ring-slate-800 ${
          size === "md" ? "text-[11px]" : "text-[9px]"
        } text-slate-500`}
      >
        Wait
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold uppercase tracking-wide ring-1 ring-inset ${
        size === "md" ? "text-[11px]" : "text-[9px]"
      } ${ORDER_CLASS[orderType]}`}
      title={execution.reason}
    >
      {ORDER_LABEL[orderType]}
    </span>
  );
}