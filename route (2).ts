import { NextResponse } from 'next/server';
import { getMarket } from '@/lib/binance';
export async function GET(req: Request) {
  const top = Math.min(100, Math.max(1, +(new URL(req.url).searchParams.get('top') || 20)));
  try {
    return NextResponse.json({ coins: await getMarket(top) }, { headers: { 'Cache-Control': 's-maxage=10, stale-while-revalidate=30' } });
  } catch { return NextResponse.json({ error: 'Data temporarily unavailable' }, { status: 503 }); }
}
