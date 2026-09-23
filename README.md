# SignalDesk — Real-Time Crypto Trading Signals

A heavyweight, 100% public, open-source trading signal web application built with
**Next.js (App Router)**, **Tailwind CSS**, and **TypeScript**.

Visitors land directly on a live dashboard showing **BUY / SELL / NEUTRAL** signals
for BTC, ETH and SOL — computed from **RSI(14)**, **EMA(20/50)** and **MACD(12,26,9)**.
No login. No API keys. No environment variables. Clone, run, deploy.

### Screenshot

> Desktop-first dark dashboard: three pair cards with live prices and 24h stats, a
> candlestick chart with EMA overlay, RSI + MACD history panes, rule-by-rule signal
> breakdown, and a 12-second auto-refresh progress bar.

---

## Features

| Capability | Detail |
| --- | --- |
| **Zero authentication** | Fully public landing page. Market data and signals render immediately on first paint. |
| **Free data source** | Binance public REST API (`/api/v3/klines`, `/api/v3/ticker/24hr`) with automatic fallback across `api.binance.com`, `api1–3.binance.com` and `data-api.binance.vision`. No registration or keys anywhere. |
| **Signal engine** | `technicalindicators` computes RSI(14), EMA(20 & 50) and MACD(12,26,9) server-side in a Next.js Route Handler. |
| **Unified signals** | Weighted voting engine combining all indicators into **BUY / SELL / NEUTRAL** with a confidence percentage and a full rule-by-rule breakdown (e.g. *"RSI Oversold"*, *"EMA Golden Cross"*). |
| **Live dashboard** | Responsive dark UI with signal cards, candlestick + EMA chart, RSI and MACD history panes, hover OHLC tooltip, ticker selector, timeframe selector (15m/30m/1h/4h/1d) and 24h market stats. |
| **Auto-refresh** | Polls the public API every **12 seconds** with a live countdown, animated progress bar, spin state and last-update timestamp. |
| **Vercel ready** | Zero env-var dependencies — import to Vercel and hit Deploy. |

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack, React 19)
- **Tailwind CSS v4**
- **TypeScript**
- **technicalindicators** — RSI, EMA, MACD calculation
- **Binance Public REST API** — OHLCV klines + 24h ticker (free, keyless)

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
   (with host fallback and `cache: "no-store"`).
2. **Compute** RSI(14), EMA(20), EMA(50), MACD(12,26,9) with `technicalindicators`.
3. **Vote.** Each indicator casts a weighted vote:

   | Rule | Weight | BUY when | SELL when |
   | --- | --- | --- | --- |
   | RSI(14) zone | 2 / 1 | ≤ 30 (oversold) or < 45 | ≥ 70 (overbought) or > 55 |
   | EMA 20 vs 50 | 1 | EMA20 > EMA50 (golden cross detected) | EMA20 < EMA50 (death cross detected) |
   | Price vs EMA50 | 1 | price above EMA50 | price below EMA50 |
   | MACD | 1 | MACD > signal, histogram > 0 | MACD < signal, histogram < 0 |

4. **Aggregate.** `score = Σ(BUY votes) − Σ(SELL votes)`.
   Action threshold: normalized score `≥ +0.5` → **BUY**, `≤ −0.5` → **SELL**,
   otherwise **NEUTRAL**. `confidence = |normalized score| × 100%`.
5. **Return** the signal, confidence, every rule's title/detail/weight, indicator
   snapshot, full candle/series arrays, and the data-source host used.

### Example

> RSI(14) = 27.4 (oversold, +2 BUY), EMA20 < EMA50 (−1 SELL), price below
> EMA50 (−1 SELL), MACD hist negative (−1 SELL) → score −1 / max 5 → **NEUTRAL**
> at 20% confidence because the oversold bounce is not confirmed by trend.

---

## API

### `GET /api/signals`

Public endpoint used by the dashboard (also usable by your own tooling — CORS
friendly plain JSON).

| Query param | Values | Default | Description |
| --- | --- | --- | --- |
| `symbols` | comma-separated, 5–20 uppercase chars (`BTCUSDT,ETHUSDT,SOLUSDT`) | — | Symbols to analyze |
| `interval` | `15m`, `30m`, `1h`, `4h`, `1d` | `1h` | Kline timeframe |

```bash
curl "https://your-deployment.vercel.app/api/signals?symbols=BTCUSDT,ETHUSDT&interval=1h"
```

Response shape (abridged):

```json
{
  "interval": "1h",
  "results": [
    {
      "symbol": "BTCUSDT",
      "market": { "price": 84020.35, "changePercent24h": 1.24, "high24h": 84900, "low24h": 82800, "volume24h": 18952.1 },
      "indicators": { "rsi": 27.39, "ema20": 84110.2, "ema50": 86340.1, "macdHistogram": -210.3 },
      "signal": {
        "action": "NEUTRAL",
        "confidence": 20,
        "score": -1,
        "maxScore": 5,
        "rules": [
          { "indicator": "RSI", "vote": "BUY", "weight": 2, "title": "RSI Oversold", "detail": "..." }
        ]
      },
      "candles": [ { "t": 1790157600000, "o": 84100, "h": 84500, "l": 83900, "c": 84300, "v": 123.4 } ],
      "series": { "ema20": [null, "...", 84110.2], "ema50": [], "rsi": [], "macd": [], "macdHistogram": [] },
      "dataSource": "https://api.binance.com",
      "updatedAt": 1790157600000
    }
  ],
  "errors": []
}
```

---

## Architecture

```
crypto-trading-signals/
├── src/
│   ├── app/
│   │   ├── api/signals/route.ts   # Serverless API: fetch → compute → respond
│   │   ├── globals.css            # Tailwind v4 + theme
│   │   ├── layout.tsx             # Metadata + fonts
│   │   └── page.tsx               # Renders dashboard
│   ├── components/                # Dashboard, cards, charts, panels, selectors
│   └── lib/
│       ├── binance.ts             # Keyless Binance fetchers + multi-host fallback
│       ├── signal-engine.ts       # Indicators + weighted voting engine
│       ├── symbols.ts             # Pair & timeframe configuration
│       ├── types.ts               # Shared TypeScript types
│       └── format.ts              # Number/date formatters
├── public/
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

Alternative: in the Vercel dashboard, **New Project → Import** and Vercel will use
the `build` script (`next build`) and `start` command automatically.

> **Production note:** Route Handlers are dynamic (`export const dynamic = "force-dynamic"`)
> and Binance fetches use `cache: "no-store"`, so every poll returns fresh market data.
> On Vercel's serverless model each `/api/signals` call is served by the nearest
> compute region. Binance public endpoints may be unreachable from a few regions;
> the multi-host fallback (including `data-api.binance.vision`) keeps the app live.

---

## Customization

- **Add a pair:** append an entry to `SYMBOLS` in `src/lib/symbols.ts` (any
  `QUOTE=USDT` pair on Binance works).
- **Tune the engine:** edit rule weights/thresholds in `src/lib/signal-engine.ts`.
- **Change refresh cadence:** edit `REFRESH_MS` in `src/components/Dashboard.tsx`.
- **Add indicators:** `technicalindicators` ships Bollinger Bands, Stochastic, ATR
  and more — extend `computeIndicators` and add another vote rule.

---

## Disclaimer

**This is NOT financial advice.**

- All trading involves substantial risk of loss; never trade money you cannot afford
  to lose.
- Signals are purely algorithmic interpretations of historical data — past
  performance does not guarantee future results.
- No system guarantees profit. This tool is provided for educational and research
  purposes. You are solely responsible for your own trading decisions.

---

## License

[MIT](./LICENSE) — free to use, fork, and modify.