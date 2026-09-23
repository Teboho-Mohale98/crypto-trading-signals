import { SignalBadge } from "@/components/SignalBadge";

interface HeaderProps {
  activeSymbol: string;
  dataSource?: string;
}

export function Header({ activeSymbol, dataSource }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <svg
              className="h-5 w-5 text-slate-950"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M14 7h7v7" />
            </svg>
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold tracking-tight text-slate-50 sm:text-lg">
              SignalDesk
            </h1>
            <p className="hidden text-xs text-slate-400 sm:block">
              Public real-time crypto, forex &amp; index signals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 md:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live · no login required
          </div>
          {activeSymbol && (
            <div className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200">
              <SignalBadge symbol={activeSymbol} />
            </div>
          )}
          {dataSource && (
            <span className="hidden text-xs text-slate-500 lg:block">
              {dataSource}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}