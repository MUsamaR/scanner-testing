import { NextResponse } from 'next/server';
import { getKlines } from '@/lib/binance';
import { alligator } from '@/lib/alligator';
import { tfSignal } from '@/lib/signals';
import { TIMEFRAMES, TF } from '@/lib/config';
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const symbol = (q.get('symbol') || '').toUpperCase(), tf = q.get('interval') as TF;
  if (!/^[A-Z0-9]{5,15}$/.test(symbol) || !TIMEFRAMES.includes(tf)) return NextResponse.json({ error: 'Invalid symbol or interval' }, { status: 400 });
  try {
    const cs = await getKlines(symbol, tf);
    const al = alligator(cs), N = 100;
    const cut = (a: number[]) => a.slice(-N).map((x) => (Number.isFinite(x) ? x : null));
    return NextResponse.json(
      { candles: cs.slice(-N), jaw: cut(al.jaw), teeth: cut(al.teeth), lips: cut(al.lips), signal: tfSignal(cs) },
      { headers: { 'Cache-Control': 's-maxage=15, stale-while-revalidate=60' } });
  } catch { return NextResponse.json({ error: 'Data temporarily unavailable' }, { status: 503 }); }
}
