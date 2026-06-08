'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getLiveHeatmap, type HeatmapData, type HeatmapStock } from '@/lib/actions/heatmap.actions';
import { capWeightB } from '@/lib/market-caps';

// Green for up, red for down; alpha scales with magnitude (capped at 4%).
function tileColor(dp: number | null): string {
  if (dp == null) return 'rgba(255,255,255,0.05)';
  const i = Math.min(Math.abs(dp) / 4, 1);
  const a = (0.16 + 0.62 * i).toFixed(3);
  return dp >= 0 ? `rgba(22,163,74,${a})` : `rgba(220,38,38,${a})`;
}

function fmtPct(dp: number | null): string {
  if (dp == null) return '—';
  return `${dp >= 0 ? '+' : ''}${dp.toFixed(2)}%`;
}

function fmtTime(iso: string): string {
  if (!iso) return '';
  // Stable HH:MM — avoids locale/SSR drift (this is a client component anyway).
  const t = iso.slice(11, 16);
  return t ? `${t} UTC` : '';
}

// Pixels² of tile area per $1B of market cap. Tuned so mega-caps read large but
// the whole board stays a sensible height on a phone-width column.
const AREA_PER_B = 11;
const MIN_SECTOR_H = 52; // keep tiny sectors tappable
const GAP = 3; // px gutter between tiles

type Rect = { x: number; y: number; w: number; h: number };

/**
 * Squarified treemap (Bruls/Huizing/van Wijk). Lays `values` out inside the
 * given rect, returning a rect per input index. Larger values get larger areas
 * while tiles are kept as close to square as possible.
 */
function squarify(values: number[], X: number, Y: number, W: number, H: number): Rect[] {
  const n = values.length;
  const out: Rect[] = new Array(n);
  if (n === 0 || W <= 0 || H <= 0) {
    for (let k = 0; k < n; k++) out[k] = { x: X, y: Y, w: 0, h: 0 };
    return out;
  }
  const total = values.reduce((s, v) => s + Math.max(v, 0), 0);
  if (total <= 0) {
    for (let k = 0; k < n; k++) out[k] = { x: X, y: Y, w: 0, h: 0 };
    return out;
  }

  const area = W * H;
  const items = values
    .map((v, index) => ({ index, a: (Math.max(v, 0) / total) * area }))
    .sort((p, q) => q.a - p.a);

  let x = X;
  let y = Y;
  let w = W;
  let h = H;

  const worst = (row: { a: number }[], len: number): number => {
    let sum = 0;
    let mx = -Infinity;
    let mn = Infinity;
    for (const r of row) {
      sum += r.a;
      if (r.a > mx) mx = r.a;
      if (r.a < mn) mn = r.a;
    }
    if (sum <= 0) return Infinity;
    return Math.max((len * len * mx) / (sum * sum), (sum * sum) / (len * len * mn));
  };

  const layoutRow = (row: { index: number; a: number }[]) => {
    const sum = row.reduce((s, r) => s + r.a, 0);
    if (sum <= 0) return;
    if (w >= h) {
      const stripW = sum / h;
      let yy = y;
      for (const r of row) {
        const rh = (r.a / sum) * h;
        out[r.index] = { x, y: yy, w: stripW, h: rh };
        yy += rh;
      }
      x += stripW;
      w -= stripW;
    } else {
      const stripH = sum / w;
      let xx = x;
      for (const r of row) {
        const rw = (r.a / sum) * w;
        out[r.index] = { x: xx, y, w: rw, h: stripH };
        xx += rw;
      }
      y += stripH;
      h -= stripH;
    }
  };

  let i = 0;
  let row: { index: number; a: number }[] = [];
  while (i < items.length) {
    const len = Math.min(w, h);
    if (len <= 0) {
      // Degenerate remainder — just flush whatever's left.
      row.push(items[i]);
      i++;
      continue;
    }
    const cur = items[i];
    if (row.length === 0 || worst([...row, cur], len) <= worst(row, len)) {
      row.push(cur);
      i++;
    } else {
      layoutRow(row);
      row = [];
    }
  }
  if (row.length) layoutRow(row);

  for (let k = 0; k < n; k++) if (!out[k]) out[k] = { x: X, y: Y, w: 0, h: 0 };
  return out;
}

function SectorTreemap({ stocks, width }: { stocks: HeatmapStock[]; width: number }) {
  const weights = stocks.map((s) => capWeightB(s.symbol, s.marketCap));
  const total = weights.reduce((s, v) => s + v, 0);
  // Area is globally proportional to market cap (width is shared across sectors),
  // so a heavier sector is taller — like a real market-cap heatmap.
  const height = Math.max(MIN_SECTOR_H, (total * AREA_PER_B) / Math.max(width, 1));
  const rects = squarify(weights, 0, 0, width, height);

  return (
    <div className="relative w-full" style={{ height }}>
      {rects.map((r, idx) => {
        const s = stocks[idx];
        const tw = Math.max(0, r.w - GAP);
        const th = Math.max(0, r.h - GAP);
        if (tw <= 0 || th <= 0) return null;
        const showPct = th >= 30 && tw >= 44;
        const tiny = tw < 60 || th < 40;
        return (
          <div
            key={s.symbol}
            title={`${s.name}${s.price ? ` · $${s.price.toFixed(2)}` : ''}`}
            className="absolute flex flex-col items-center justify-center overflow-hidden rounded-md px-1 text-center leading-tight"
            style={{
              left: r.x + GAP / 2,
              top: r.y + GAP / 2,
              width: tw,
              height: th,
              backgroundColor: tileColor(s.changePct),
            }}
          >
            <span className={`font-bold text-white ${tiny ? 'text-[10px]' : 'text-xs'}`}>
              {s.symbol}
            </span>
            {showPct && (
              <span className={`tabular-nums text-white/90 ${tiny ? 'text-[9px]' : 'text-[11px]'}`}>
                {fmtPct(s.changePct)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function LiveHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      getLiveHeatmap()
        .then((d) => {
          if (active) {
            setData(d);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    load();
    const id = setInterval(load, 60_000); // refresh ~every minute
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Track the column width so the treemap can lay out in real pixels.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/40 text-sm text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-teal-400" /> Loading live heatmap…
      </div>
    );
  }

  if (!data || data.sectors.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 text-sm text-gray-500">
        Heatmap unavailable right now.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
          </span>
          Live Heatmap
        </span>
        <span className="text-[11px] text-gray-500">
          Finnhub · ~60s{data.asOf ? ` · ${fmtTime(data.asOf)}` : ''}
        </span>
      </div>

      <div ref={containerRef} className="space-y-3">
        {data.sectors.map((sec) => (
          <div key={sec.sector}>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-gray-500">{sec.sector}</p>
            {width > 0 ? (
              <SectorTreemap stocks={sec.stocks} width={width} />
            ) : (
              <div style={{ height: MIN_SECTOR_H }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
