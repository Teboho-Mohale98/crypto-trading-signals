<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-memory -->

# Project Memory — crypto-trading-signals

Public trading-signals web app (Next.js 16.3.6 App Router, React 19, TS, Tailwind v4, `lightweight-charts`, `technicalindicators`). Repo: https://github.com/Teboho-Mohale98/crypto-trading-signals

## Git rules
- git identity is NOT configured. Commit ONLY with env vars, never `git config`:
  `GIT_AUTHOR_NAME/GIT_COMMITTER_NAME=Teboho-Mohale98`, `GIT_AUTHOR_EMAIL/GIT_COMMITTER_EMAIL=Teboho-Mohale98@users.noreply.github.com`.
- Commit + push each milestone; base branch `main` (origin). Do not modify git config.
- `.gitignore` includes `*.log` — never stage stray test-server logs.

## Environment (Windows, PowerShell 5.1)
- `rg` NOT available — use Select-String or the grep tool.
- No `-SkipHttpErrorCheck`; use try/catch. Node v22.19.0.
- Verify with: `npx tsc --noEmit`, `npm run lint`, `npm run build`, then live smoke via `npx next start -p <port>` + Invoke-RestMethod.

## Architecture
- Providers: Binance (crypto, multi-host fallback incl. `data-api.binance.vision`, 8s TTL cache) in `src/lib/binance.ts`; Yahoo Finance chart API for forex/indices (`query1/2.finance.yahoo.com`, 8s TTL, seconds→ms, 4h = rebinned 1h, `computeMarketStats` derives 24h stats) in `src/lib/yahoo.ts`; provider router in `src/lib/markets.ts`.
- 52 instruments in `src/lib/symbols.ts`: `CRYPTO_SYMBOLS` (12), `FOREX_SYMBOLS` (20, `XXXYYY=X` style), `INDEX_SYMBOLS` (20, `^GSPC`/`000001.SS` style), `INSTRUMENTS`, `MARKETS`, `instrumentsByMarket`, `isKnownSymbol`, `getSymbolConfig` (market-inferring fallback), `SYMBOLS = CRYPTO_SYMBOLS`.
- `/api/signals?market=crypto|forex|index|all` and `/api/analysis` (routes by market). Dashboard polls every 12s.
- Capital projection: `src/lib/projection.ts` (`SCENARIOS` conservative/moderate/aggressive position-size multipliers, `projectCapital`) + `src/components/ProjectionPanel.tsx` (ROI calculator + R200/500/1000/2000 tier cards). Backtest now also reports `evaluatedCandles` and per-bucket `avgWinMovePercent`/`avgLossMovePercent`; `backtest.ts` exports `MIN_INDEX`. Strictly hypothetical — no guaranteed-return claims, heavy risk disclaimers.
- Engine params `src/lib/signal-engine.ts`: RSI(14), EMA(20/50), MACD(12,26,9), BB(20,2σ), StochRSI(14), ADX(14), ATR(14); backtest horizon 5, ±0.5%, MIN_INDEX 70. Trade plan: stop 1.5×ATR, FOUR scale-out take-profits at 1 / 2 / 3 / 4.5×ATR (up to 1:3 R/R) → `TradeLevels {atr, entry, stopLoss, tp1..tp4, riskPercent, tp1Percent..tp4Percent, riskReward}` (riskReward = tp4Dist/stopDist).

## Signal engine (current)
- 5 strategies: `trend` (EMA+ADX), `momentum` (MACD line/signal + histogram), `mean_reversion` (RSI/StochRSI/BB extremes), `breakout` (BB band break), `divergence` (RSI divergence). Each → `StrategyResult {id,label,direction,action,strength,detail}`.
- Composite (`compositeSignal`) from `STRATEGY_WEIGHTS` (trend 2, momentum 1.5, mean_reversion 1.5, breakout 1, divergence 1) × strength; score = (longW−shortW)/totalW ∈ [-1,1], `maxScore=1` (progress bars = (score+maxScore)/(2*maxScore)).
- Tiers: `STRONG_BUY`/`STRONG_SELL` when ≥3 aligned strategies (strength ≥0.4, MIN_ALIGNED_STRENGTH) and opposing side ≤1 and side share ≥0.55 (STRONG_SHARE); else BUY/SELL when share ≥0.42 (STANDARD_SHARE); else NEUTRAL. `tier` STRONG/STANDARD/NEUTRAL; confidence = |score|×100.
- `SignalSummary` = `{action, confidence, score, maxScore, tier, strategies, execution}`. No `rules` field; `RuleResult`/`RuleList`/`INDICATOR_META` deleted.
- `execution` = `{orderType, stopPrice, limitPrice, reason}` where `orderType ∈ MARKET | BUY_LIMIT | SELL_LIMIT | BUY_STOP | SELL_STOP | BUY_STOP_LIMIT | SELL_STOP_LIMIT | null` (null = no setup). `stopPrice` = stop trigger (STOP/STOP_LIMIT only), `limitPrice` = fill/cap (LIMIT/STOP_LIMIT only); both null for MARKET. `executionAdvice(strategies, action, price, atr)` (0.25×ATR edge): mean-reversion/divergence-only fades → LIMIT; band breakout → STOP, or STOP_LIMIT when trend/momentum also aligned; trend+momentum (no extreme) → MARKET. Exposed via `/api/signals` and `/api/analysis`. Rendered by `OrderChip.tsx`: `OrderChip` (label badge, or "Wait") + `ExecutionPrices` ("Stop <p> · Limit <p>") used in the Screener Order column and TradeLevels banner.
- `evaluateSignal` (single candle) and `signalAt` (index i, for backtest via `detectRsiDivergence` on slice) both return full composite. `computeTradeLevels` calls `evaluateSignal` for direction. Helpers kept: `crossedAbove`, `lastValid`, `findPivots`, `detectRsiDivergence`, `divisionInfoFrom`, `computeIndicators`.
- AnalysisPanel shows indicator grid + divergence callout + StrategyCard grid (label, action tag, conviction %, detail). Screen: `analysis.indicators` + `analysis.signal` + `analysis.divergence`.

## Commit history (main)
- `3434928` Elite upgrade (pro chart, screener, sentiment, 7-indicator engine)
- `487804d` All forex pairs + global indices via Yahoo Finance
- `b3a411d` Entry / stop loss / TP1 / TP2 trade levels
- `25d99db` Multi-strategy signal engine with STRONG buy/sell consensus
- `8a02b5e` Scale-out ladder with four take-profit levels
- `4f99be2` Advise order type per signal: market, limit, stop or stop-limit
- `1533286` Show stop and limit prices with every order advice

<!-- END:project-memory -->
