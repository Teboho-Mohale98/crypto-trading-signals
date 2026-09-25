# SignalDesk — Elite Crypto, Forex & Index Trading Signals

A heavyweight, 100% public, open-source trading signal web application built with
**Next.js (App Router)**, **Tailwind CSS**, and **TypeScript**.

Visitors land directly on a live dashboard tracking **52 instruments** across
three markets — **12 USDT crypto pairs**, **20 forex pairs** and **20 global
indices** — with STRONG_BUY / BUY / NEUTRAL / SELL / STRONG_SELL signals computed
from a **7-indicator elite engine** — RSI(14), EMA(20/50), MACD(12,26,9),
Bollinger(20,2σ), Stochastic RSI, ADX(14) and ATR(14) — plus a **pro multi-pane
TradingView-style chart**, a **sortable market screener**, a **Fear & Greed
sentiment gauge**, an **ATR position map**, a **strategy backtester** and a
**PWA install prompt**.

No login. No API keys. No environment variables. Clone, run, deploy.

### Screenshot

> Dark elite dashboard: overview strip, featured instrument cards, market screener
> with search/sort and market badges, Fear & Greed gauge, multi-pane pro chart
> (candles + EMA/BB, volume, RSI, MACD) with crosshair OHLC legend, five-strategy
> consensus analysis with RSI/MACD divergence detection, ATR position map with
> four take-profit levels, backtest panel, and a 12-second auto-refresh progress
> bar.

---

## Features

| Capability | Detail |
| --- | --- |
| **Zero authentication** | Fully public landing page. Market data and signals render immediately on first paint. |
| **Three markets, one dashboard** | **Crypto** (12 USDT pairs via Binance), **Forex** (20 majors/crosses: EURUSD, GBPUSD, USDJPY, AUDUSD, …) and **Indices** (20 global: S&P 500, Nasdaq, Dow, Nikkei, DAX, FTSE, … via Yahoo Finance). Market tabs filter the pair bar; the screener lists every instrument with a market badge. |
| **Free data sources** | Binance public REST API with automatic fallback across `api.binance.com`, `api1–3.binance.com` and `data-api.binance.vision`; Yahoo Finance chart API (`query1/2.finance.yahoo.com`) for forex and indices. No registration or keys anywhere. |
| **Elite signal engine** | `technicalindicators` computes RSI(14), EMA(20/50), MACD(12,26,9), Bollinger(20,2σ), Stochastic RSI(14), ADX(14) and ATR(14) server-side in Next.js Route Handlers. |
| **5-tier signals** | Five-strategy consensus (trend, momentum, mean reversion, breakout, divergence) produces **STRONG_BUY / BUY / NEUTRAL / SELL / STRONG_SELL** with a confidence percentage, a STRONG badge, and a per-strategy consensus breakdown. |
| **RSI divergence** | Detects bullish price-lower-low + RSI-higher-low and bearish price-higher-high + RSI-lower-high scenarios, with plain-English notes. |
| **Pro multi-pane chart** | `lightweight-charts` v5: candles + EMA20/50 + Bollinger in the main pane, volume histogram, RSI (30/70 price lines) and MACD panes, live crosshair OHLC/RSI/MACD legend. |
| **Market screener** | Search + sortable table across all 52 instruments (name, market badge, price, 24h %, volume, RSI, confidence). |
| **Sentiment gauge** | Fear & Greed index from `api.alternative.me` (keyless) with an SVG gauge needle and 20-day history. |
| **ATR position map** | 1.5× ATR stop-loss plus **four scale-out take-profit levels** (1 / 2 / 3 / 4.5× ATR, up to 1 : 3 risk/reward) for partial profit-taking. |
| **Strategy backtester** | Replays the engine across ~200 candles to report win rates for strong-buy / buy / strong-sell / sell setups (±0.5% target, 5-candle horizon). |
| **Shareable state** | Symbol + timeframe are synced to the URL; share a snapshot link or download candles + indicators as CSV. |
| **PWA-ready** | Web manifest, maskable icons (192/512), theme color and apple-touch icon for install-to-homescreen. |
| **Auto-refresh** | Polls the public API every **12 seconds** with a live countdown, animated progress bar, spin state and last-update timestamp. |
| **Vercel ready** | Zero env-var dependencies — import to Vercel and hit Deploy. |

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack, React 19)
- **Tailwind CSS v4**
- **TypeScript**
- **technicalindicators** — RSI, EMA, MACD, Bollinger, StochRSI, ADX, ATR
- **lightweight-charts v5** — TradingView-style multi-pane charting
- **Binance Public REST API** — crypto OHLCV klines + 24h ticker (free, keyless)
- **Yahoo Finance Chart API** — forex + index OHLCV (free, keyless)
- **alternative.me** — Fear & Greed sentiment API (free, keyless)

---

## Quick Start (Local)

Requires **Node.js 20.9+**.

```bash
git clone <your-repo-url>
cd crypto-trading-signals
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard fetches live
crypto, forex and index data and computes signals immediately — nothing to
configure.

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server with Turbopack |
| `npm run build` | Create an optimized production build |
| `npm start` | Run the production build locally |
| `npm run lint` | Lint with ESLint (flat config) |

---

## How Signals Are Generated

The signal engine lives in `src/lib/signal-engine.ts` and runs inside the
`GET /api/signals` Route Handler (`src/app/api/signals/route.ts`), so heavy number
crunching never ships to the browser.

1. **Fetch** up to 200 OHLCV candles + 24h stats from the instrument's provider —
   Binance public endpoints for crypto (`src/lib/binance.ts`, host fallback + TTL
   cache), Yahoo Finance chart API for forex and indices (`src/lib/yahoo.ts`,
   which also rebins hourly candles into 4h bars and derives 24h stats from the
   candle window). A shared provider router in `src/lib/markets.ts` picks the
   right source per instrument and coalesces concurrent polls.
2. **Compute** RSI(14), EMA(20), EMA(50), MACD(12,26,9), Bollinger(20,2σ),
   Stochastic RSI(14), ADX(14) and ATR(14) with `technicalindicators`.
3. **Score five strategies.** Each strategy evaluates the indicators and emits
   its own action (BUY / SELL / HOLD) with a 0–1 conviction:

   | Strategy | Acts on | Conviction rises when |
   | --- | --- | --- |
   | Trend Following (`trend`) | EMA20 vs EMA50, ADX | golden/death cross, price on the trend side, ADX ≥ 25 |
   | MACD Momentum (`momentum`) | MACD line, signal, histogram | line above signal with positive, accelerating histogram |
   | Mean Reversion (`mean_reversion`) | RSI, StochRSI, Bollinger | RSI ≤ 30 / ≥ 70, StochRSI ≤ 0.2 / ≥ 0.8, price outside the bands |
   | Bollinger Breakout (`breakout`) | BB upper/lower | price breaks above / below the 2σ bands |
   | RSI Divergence (`divergence`) | price vs RSI pivots | bullish / bearish price–RSI divergence |

4. **Composite & tier.** Weighted conviction (trend ×2, momentum ×1.5, mean
   reversion ×1.5, breakout ×1, divergence ×1) collapses to a score in
   `[−1, +1]`. When **three or more strategies align** on one side with little
   opposition → **STRONG_BUY / STRONG_SELL**; a single-sided weighted share
   ≥ 42% → **BUY / SELL**; otherwise **NEUTRAL**.
   `confidence = |score| × 100%`.
5. **Position map.** Entry at the last close, stop-loss at **1.5× ATR**, and a
   **scale-out ladder of four take-profits at 1 / 2 / 3 / 4.5× ATR** (up to
   1 : 3 risk/reward) for partial profit-taking.
6. **Backtest.** The same composite is replayed across all closed candles to
   report win rates per action tier (a trade wins if price moves ±0.5% within
   5 candles).
7. **Return** the signal, tier, confidence, each strategy's action/conviction/
   note, the full indicator snapshot, divergence note, trade levels and backtest
   metrics.

---

## API

### `GET /api/signals`

Public endpoint used by the dashboard's overview, cards and screener.

| Query param | Values | Default | Description |
| --- | --- | --- | --- |
| `interval` | `15m`, `30m`, `1h`, `4h`, `1d` | `1h` | Kline timeframe |
| `market` | `all`, `crypto`, `forex`, `index` | `all` | Restrict to a single market |

Returns `{ interval, results: SymbolSummary[], aggregates, errors }`. Each summary
contains `market` (price/24h stats), `signal` (action/tier/confidence/strategies),
an `indicators` snapshot, a downsampled `sparkline`, `dataSource` and `updatedAt`.
`aggregates` adds total quote volume, average 24h move, long/short counts and
best/worst instruments.

### `GET /api/analysis`

Full detail for one instrument, used by the pro chart and analysis panels.

| Query param | Values | Default | Description |
| --- | --- | --- | --- |
| `symbol` | `BTCUSDT`, `EURUSD=X`, `^GSPC`, … | — | Instrument to analyze |
| `interval` | `15m`, `30m`, `1h`, `4h`, `1d` | `1h` | Kline timeframe |

Returns candles (up to 160 for the chart), all `series` arrays (EMA/RSI/MACD/BB/
StochRSI/ADX/ATR), `divergence`, `tradeLevels` and `backtest` metrics.

### `GET /api/sentiment`

Fear & Greed sentiment from `api.alternative.me/fng` (keyless, 60s cache).
Returns `{ value, classification, updatedAt, history[] }`.

```bash
curl "https://your-deployment.vercel.app/api/signals?interval=1h"
curl "https://your-deployment.vercel.app/api/signals?interval=1h&market=forex"
curl "https://your-deployment.vercel.app/api/analysis?symbol=EURUSD=X&interval=1h"
curl "https://your-deployment.vercel.app/api/analysis?symbol=^GSPC&interval=1d"
curl "https://your-deployment.vercel.app/api/sentiment"
```

---

## Architecture

```
crypto-trading-signals/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── signals/route.ts    # Summaries + market aggregates (all 52 instruments)
│   │   │   ├── analysis/route.ts   # Full detail: candles, series, levels, backtest
│   │   │   └── sentiment/route.ts  # Fear & Greed gauge data
│   │   ├── manifest.ts             # PWA manifest
│   │   ├── globals.css             # Tailwind v4 + theme
│   │   ├── layout.tsx              # Metadata, viewport, fonts, icons
│   │   └── page.tsx                # Dashboard (wrapped in Suspense for URL state)
│   ├── components/                 # Dashboard, ProChart, Screener, panels…
│   └── lib/
│       ├── binance.ts              # Keyless Binance fetchers + fallback + TTL cache
│       ├── yahoo.ts                # Keyless Yahoo Finance fetcher + 4h rebin + stats
│       ├── markets.ts              # Provider router (crypto → Binance, else Yahoo)
│       ├── cache.ts                # Tiny in-process TTL cache
│       ├── signal-engine.ts        # 5-strategy engine + divergence + trade levels
│       ├── backtest.ts             # Strategy replay (win rates per action tier)
│       ├── analysis.ts             # Summary/detail builders
│       ├── symbols.ts              # 52-instrument catalog + market/timeframe config
│       ├── types.ts                # Shared TypeScript types
│       └── format.ts               # Number/date formatters
├── public/                         # PWA icons (192/512)
├── next.config.ts
├── package.json
└── README.md
```

---

## Deploy to Vercel (1-click)

Zero environment variables needed — this works immediately.

1. Push this folder to a GitHub repository.
2. Go to [https://vercel.com/new](https://vercel.com/new) and click **Import** your repo.
3. Vercel auto-detects **Next.js** — keep the defaults (no env vars to add).
4. Click **Deploy**. Done.

> **Production note:** Route Handlers are dynamic (`export const dynamic = "force-dynamic"`)
> and all provider fetches use `cache: "no-store"` with a short in-process TTL cache, so
> every poll returns fresh market data without hammering the APIs. Binance public
> endpoints may be unreachable from a few regions; the multi-host fallback
> (including `data-api.binance.vision`) keeps it alive. Yahoo Finance chart data
> works from almost anywhere but absent volume for indices shows as `0`.

---

## Customization

- **Add an instrument:** append an entry to `INSTRUMENTS` in `src/lib/symbols.ts`
  (crypto pairs on Binance, `EURUSD=X`-style forex and `^GSPC`-style indices on
  Yahoo Finance) — the screener and aggregates pick it up automatically. Pin it
  to the featured cards with `featured: true`.
- **Tune the engine:** edit strategy weights/thresholds in `src/lib/signal-engine.ts`.
- **Backtest settings:** change `BACKTEST_HORIZON` / `BACKTEST_THRESHOLD_PERCENT`
  in `src/lib/backtest.ts`.
- **Change refresh cadence:** edit `REFRESH_MS` in `src/components/Dashboard.tsx`.
- **Add indicators:** `technicalindicators` ships many more — extend
  `computeIndicators` and a strategy in the engine.

---

## Disclaimer

**This is NOT financial advice.**

- All trading involves substantial risk of loss; never trade money you cannot afford
  to lose.
- Signals are purely algorithmic interpretations of historical data; backtests are
  research-grade estimates — past performance does not guarantee future results.
- No system guarantees profit. This tool is provided for educational and research
  purposes. You are solely responsible for your own trading decisions.

---

## License

[MIT](./LICENSE) — free to use, fork, and modify.