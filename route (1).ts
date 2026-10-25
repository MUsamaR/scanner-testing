import { NextResponse } from 'next/server';
import { getMarket, getKlines, pool } from '@/lib/binance';
import { TIMEFRAMES, TF } from '@/lib/config';
import { tfSignal, overall } from '@/lib/signals';
export const maxDuration = 60;

export async function GET(req: Request) {
  const top = Math.min(100, Math.max(1, +(new URL(req.url).searchParams.get('top') || 20)));
  try {
    const market = await getMarket(top);
    const coins = await pool(market, 5, async (m) => {
      const res = await Promise.all(TIMEFRAMES.map(async (tf) => {
        try { const s = tfSignal(await getKlines(m.symbol, tf)); return s ? { tf, level: s.level, score: s.score } : null; }
        catch { return null; } // one bad timeframe never breaks the row
      }));
      const tfs: Partial<Record<TF, { level: string; score: number }>> = {};
      res.forEach((r) => { if (r) tfs[r.tf] = { level: r.level, score: r.score }; });
      const ov = overall(Object.fromEntries(res.filter(Boolean).map((r) => [r!.tf, r!.level])) as any);
      return { ...m, tfs, overall: ov };
    });
    return NextResponse.json({ updated: Date.now(), source: 'Binance public data', coins },
      { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } });
  } catch { return NextResponse.json({ error: 'Data temporarily unavailable' }, { status: 503 }); }
}
