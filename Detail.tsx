'use client';
import { useEffect, useState } from 'react';
import { TIMEFRAMES, TF_LABEL, TF, CONFIG } from '@/lib/config';
import { Badge, Coin, fmt, compact, signed } from './ui';

function Chart({ d }: { d: any }) {
  const W = 800, H = 300, n = d.candles.length, step = W / (n + CONFIG.alligator.jawOffset);
  const hi = Math.max(...d.candles.map((c: any) => c.h)), lo = Math.min(...d.candles.map((c: any) => c.l));
  const y = (v: number) => H - ((v - lo) / (hi - lo || 1)) * (H - 10) - 5;
  const line = (arr: (number | null)[], off: number) =>   // offset = drawing shift only
    arr.map((v, i) => (v == null ? null : `${(i + off) * step + step / 2},${y(v)}`)).filter(Boolean).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded bg-[#0a0e13]">
      {d.candles.map((c: any, i: number) => {
        const x = i * step + step / 2, up = c.c >= c.o, col = up ? '#34d399' : '#f87171';
        return (<g key={i} stroke={col} fill={col}>
          <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} />
          <rect x={x - step * 0.35} width={step * 0.7} y={y(Math.max(c.o, c.c))} height={Math.max(1, Math.abs(y(c.o) - y(c.c)))} />
        </g>);
      })}
      <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" points={line(d.jaw, CONFIG.alligator.jawOffset)} />
      <polyline fill="none" stroke="#ef4444" strokeWidth="1.5" points={line(d.teeth, CONFIG.alligator.teethOffset)} />
      <polyline fill="none" stroke="#22c55e" strokeWidth="1.5" points={line(d.lips, CONFIG.alligator.lipsOffset)} />
    </svg>
  );
}

export default function Detail({ coin, onClose }: { coin: Coin; onClose: () => void }) {
  const [tf, setTf] = useState<TF>('1h');
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    setD(null); setErr('');
    fetch(`/api/klines?symbol=${coin.symbol}&interval=${tf}`).then((r) => (r.ok ? r.json() : Promise.reject())).then(setD).catch(() => setErr('Data temporarily unavailable'));
  }, [coin.symbol, tf]);
  const s = d?.signal;
  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-black/70 p-3 sm:p-8" onClick={onClose}>
      <div className="mx-auto max-w-4xl rounded-lg border border-zinc-800 bg-[#10151c] p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{coin.base}<span className="text-zinc-500">/USDT</span></h2>
            <p className="num mt-1 text-lg">${fmt(coin.price)} <span className={coin.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>{coin.change.toFixed(2)}%</span></p>
            <p className="text-sm text-zinc-500">24h volume ${compact(coin.volume)}</p>
          </div>
          <div className="text-right">
            <Badge level={coin.overall?.level} />
            <p className="num mt-1 text-sm text-zinc-400">Overall score {coin.overall ? signed(coin.overall.score) : '–'}</p>
            <button onClick={onClose} className="mt-2 rounded border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800">Close</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {TIMEFRAMES.map((t) => (
            <button key={t} onClick={() => setTf(t)} className={`rounded px-3 py-1 text-sm ${t === tf ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-300'}`}>{TF_LABEL[t]}</button>
          ))}
        </div>
        <div className="mt-3">{err ? <p className="py-16 text-center text-zinc-400">{err}</p> : !d ? <p className="py-16 text-center text-zinc-500">Loading…</p> : <Chart d={d} />}</div>
        <p className="mt-1 text-xs text-zinc-500">Jaw <span className="text-blue-400">blue</span> · Teeth <span className="text-red-400">red</span> · Lips <span className="text-green-400">green</span> (drawn with standard offsets)</p>
        {s && <p className="num mt-3 text-sm text-zinc-300">{TF_LABEL[tf]} Alligator (last closed candle): Jaw {fmt(s.jaw)} · Teeth {fmt(s.teeth)} · Lips {fmt(s.lips)} · separation {s.sep.toFixed(2)} ATR</p>}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
          {TIMEFRAMES.map((t) => (<div key={t} className="rounded border border-zinc-800 p-2 text-center"><div className="mb-1 text-xs text-zinc-500">{TF_LABEL[t]}</div><Badge level={coin.tfs[t]?.level} /></div>))}
        </div>
      </div>
    </div>
  );
}
