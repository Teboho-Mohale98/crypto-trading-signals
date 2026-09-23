# SignalDesk — Elite Crypto Trading Signals

A heavyweight, 100% public, open-source trading signal web application built with
**Next.js (App Router)**, **Tailwind CSS**, and **TypeScript**.

Visitors land directly on a live dashboard tracking **12 USDT pairs** with:
STRONG_BUY / BUY / NEUTRAL / SELL / STRONG_SELL signals computed from a
**7-indicator elite engine** — RSI(14), EMA(20/50), MACD(12,26,9),
Bollinger(20,2σ), Stochastic RSI, ADX(14) and ATR(14) — plus a **pro multi-pane
TradingView-style chart**, a **sortable market screener**, a **Fear & Greed
sentiment gauge**, an **ATR position map**, a **strategy backtester** and a
**PWA install prompt**.

No login. No API keys. No environment variables. Clone, run, deploy.

### Screenshot

> Dark elite dashboard: overview strip, three featured pair cards, market screener
> with search/sort, Fear & Greed gauge, multi-pane pro chart (candles + EMA/BB,
> volume, RSI, MACD) with crosshair OHLC legend, rule-by-rule analysis with
> RSI/MACD divergence detection, ATR stop-loss/take-profit map, backtest panel,
> and a 12-second auto-refresh progress bar.

---

## Features

| Capability | Detail |
| --- | --- |
| **Zero authentication** | Fully public landing page. Market data and signals render immediately on first paint. |
| **Free data source** | Binance public REST API with automatic fallback across `api.binance.com`, `api1–3.binance.com` and `data-api.binance.vision`. No registration or keys anywhere. |
| **Elite signal engine** | `technicalindicators` computes RSI(14), EMA(20/50), MACD(12,26,9), Bollinger(20,2σ), Stochastic RSI(14), ADX(14) and ATR(14) server-side in Next.js Route Handlers. |
| **5-tier signals** | Weighted voting produces **STRONG_BUY / BUY / NEUTRAL / SELL / STRONG_SELL** with a confidence percentage, a STRONG badge, and a full rule-by-rule breakdown. |
| **RSI divergence** | Detects bullish price-lower-low + RSI-higher-low and bearish price-higher-high + RSI-lower-high scenarios, with plain-English notes. |
| **Pro multi-pane chart** | `lightweight-charts` v5: candles + EMA20/50 + Bollinger in the main pane, volume histogram, RSI (30/70 price lines) and MACD panes, live crosshair OHLC/RSI/MACD legend. |
| **Market screener** | Search + sortable table across all 12 pairs (price, 24h %, volume, RSI, confidence). |
| **Sentiment gauge** | Fear & Greed index from `api.alternative.me` (keyless) with an SVG gauge needle and 20-day history. |
| **ATR position map** | 1.5× ATR stop-loss and 2.5× ATR take-profit levels for the active signal, with risk/reward ratio. |
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
- **Binance Public REST API** — OHLCV klines + 24h ticker (free, keyless)
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
Binance data and computes signals immediately — nothing to configure.

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

1. **Fetch** 200 OHLCV candles + the 24h ticker from Binance public endpoints
   (host fallback + a short TTL cache that coalesces concurrent polls).
2. **Compute** RSI(14), EMA(20), EMA(50), MACD(12,26,9), Bollinger(20,2σ),
   Stochastic RSI(14), ADX(14) and ATR(14) with `technicalindicators`.
3. **Vote.** Each indicator casts a weighted vote:

   | Rule | Weight | BUY when | SELL when |
   | --- | --- | --- | --- |
   | RSI(14) zone | 2 / 1 | ≤ 30 (oversold) or pullback in uptrend | ≥ 70 (overbought) or rally in downtrend |
   | EMA 20 vs 50 | 1 | EMA20 > EMA50 (golden cross detected) | EMA20 < EMA50 (death cross detected) |
   | Price vs EMA50 | 1 | price above EMA50 | price below EMA50 |
   | MACD | 1 | MACD > signal, histogram > 0 | MACD < signal, histogram < 0 |
   | Bollinger | 1 | below lower band / lower third | above upper band / upper third |
   | Stochastic RSI | 1 | ≤ 0.20 (oversold) | ≥ 0.80 (overbought) |
   | RSI divergence | 1 | bullish divergence | bearish divergence |
   | ADX trend | 1 | ADX ≥ 25 with +DI dominant | ADX ≥ 25 with −DI dominant |

4. **Aggregate & tier.** `score = Σ(BUY votes) − Σ(SELL votes)`, normalized by max
   score: `≥ +0.7` → **STRONG_BUY**, `≥ +0.5` → **BUY**, `≤ −0.7` →
   **STRONG_SELL**, `≤ −0.5` → **SELL**, else **NEUTRAL**.
   `confidence = |normalized score| × 100%`.
5. **Position map.** ATR(14) derives a 1.5× ATR stop-loss and 2.5× ATR take-profit
   with an explicit risk/reward ratio.
6. **Backtest.** The same engine is replayed across all closed candles to report
   win rates per action tier (a trade wins if price moves ±0.5% within 5 candles).
7. **Return** the signal, tier, confidence, every rule's title/detail/weight, the
   full indicator snapshot, divergence note, trade levels and backtest metrics.

---

## API

### `GET /api/signals`

Public endpoint used by the dashboard's overview, cards and screener.

| Query param | Values | Default | Description |
| --- | --- | --- | --- |
| `interval` | `15m`, `30m`, `1h`, `4h`, `1d` | `1h` | Kline timeframe |

Returns `{ interval, results: SymbolSummary[], aggregates, errors }`. Each summary
contains `market`, `signal` (action/tier/confidence/rules), an `indicators`
snapshot, a downsampled `sparkline`, `dataSource` and `updatedAt`. `aggregates`
adds total quote volume, average 24h move, long/short counts and best/worst pairs.

### `GET /api/analysis`

Full detail for one pair, used by the pro chart and analysis panels.

| Query param | Values | Default | Description |
| --- | --- | --- | --- |
| `symbol` | any Binance USDT pair (`BTCUSDT`) | — | Pair to analyze |
| `interval` | `15m`, `30m`, `1h`, `4h`, `1d` | `1h` | Kline timeframe |

Returns candles (up to 160 for the chart), all `series` arrays (EMA/RSI/MACD/BB/
StochRSI/ADX/ATR), `divergence`, `tradeLevels` and `backtest` metrics.

### `GET /api/sentiment`

Fear & Greed sentiment from `api.alternative.me/fng` (keyless, 60s cache).
Returns `{ value, classification, updatedAt, history[] }`.

```bash
curl "https://your-deployment.vercel.app/api/signals?interval=1h"
curl "https://your-deployment.vercel.app/api/analysis?symbol=BTCUSDT&interval=1h"
curl "https://your-deployment.vercel.app/api/sentiment"
```

---

## Architecture

```
crypto-trading-signals/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── signals/route.ts    # Summaries + market aggregates (all 12 pairs)
│   │   │   ├── analysis/route.ts   # Full detail: candles, series, levels, backtest
│   │   │   └── sentiment/route.ts  # Fear & Greed gauge data
│   │   ├── manifest.ts             # PWA manifest
│   │   ├── globals.css             # Tailwind v4 + theme
│   │   ├── layout.tsx              # Metadata, viewport, fonts, icons
│   │   └── page.tsx                # Dashboard (wrapped in Suspense for URL state)
│   ├── components/                 # Dashboard, ProChart, Screener, panels…
│   └── lib/
│       ├── binance.ts              # Keyless Binance fetchers + fallback + TTL cache
│       ├── cache.ts                # Tiny in-process TTL cache
│       ├── signal-engine.ts        # 8-rule weighted engine + divergence + levels
│       ├── backtest.ts             # Strategy replay (win rates per action tier)
│       ├── analysis.ts             # Summary/detail builders
│       ├── symbols.ts              # Pair & timeframe configuration
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
> and Binance fetches use `cache: "no-store"` with a short in-process TTL cache, so
> every poll returns fresh market data without hammering the API. Binance public
> endpoints may be unreachable from a few regions; the multi-host fallback
> (including `data-api.binance.vision`) keeps the app live.

---

## Customization

- **Add a pair:** append an entry to `SYMBOLS` in `src/lib/symbols.ts` (any
  `QUOTE=USDT` pair on Binance works) — the screener and aggregates pick it up
  automatically.
- **Tune the engine:** edit rule weights/thresholds in `src/lib/signal-engine.ts`.
- **Backtest settings:** change `BACKTEST_HORIZON` / `BACKTEST_THRESHOLD_PERCENT`
  in `src/lib/backtest.ts`.
- **Change refresh cadence:** edit `REFRESH_MS` in `src/components/Dashboard.tsx`.
- **Add indicators:** `technicalindicators` ships many more — extend
  `computeIndicators` and add another vote rule.

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