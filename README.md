# Crypto Alligator Scanner

Live Williams Alligator scanner for Binance USDT pairs. Next.js + React + TypeScript + Tailwind. The browser only talks to this app's `/api/*` routes; the server calls Binance, so there are no CORS problems.

## Deploy (no software needed on your computer)
1. Create a free account at github.com and click **New repository** (name it `crypto-alligator-scanner`).
2. Unzip this project. On the new repository page click **uploading an existing file**, drag in ALL the files and folders from inside the unzipped folder, then **Commit changes**.
3. Go to vercel.com and sign up with GitHub.
4. Click **Add New, then Project** and choose your repository.
5. Leave every setting as it is and click **Deploy**.
6. Open the `.vercel.app` URL Vercel shows you.

`vercel.json` runs the backend in London because Binance blocks many US servers (Vercel's default). If every request shows "Data temporarily unavailable", check the Vercel function logs for HTTP 451/403.

## Where things are
- `lib/config.ts` - all weights, thresholds, offsets, cache times
- `lib/alligator.ts` - SMMA, ATR, Alligator lines (offsets are chart-only)
- `lib/signals.ts` - per-timeframe strength, five levels, weighted overall
- `lib/binance.ts` - Binance calls, caching, stale fallback, coin filtering
- `app/api/{market,klines,signals}` - API routes; `app/page.tsx`, `components/` - UI

## Method
Bullish = Lips > Teeth > Jaw, bearish = reverse, otherwise Neutral. A coin also needs separation of at least 0.15 ATR. Strength points: separation >= 1 ATR, average slope >= 0.05 ATR/bar in the trend direction, same ordering on >= 80% of the last 5 closed candles. 2+ points = Strong, otherwise normal. Overall = weight-averaged timeframe scores (1m 1, 5m 1, 15m 2, 1H 3, 4H 4, 1D 5); Strong at +/-1.25, normal at +/-0.4. Displayed score is the weighted sum. Missing timeframes are skipped.

## Adding alerts later
Compare each coin's `overall.level` between two `/api/signals` runs (for example from a Vercel Cron job) and send changes to Telegram with a token stored in an environment variable.
