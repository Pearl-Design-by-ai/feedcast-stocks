'use client';

/**
 * StockHeatMap — a responsive treemap heat map.
 *
 * Each rectangle is one stock; its AREA encodes market cap (bigger company =
 * bigger box) and its COLOR encodes the % change for the active period. Stocks
 * are grouped by sector. On hover a tooltip shows the full detail. Below ~480px
 * the treemap collapses into a scrollable list of colored chips per sector.
 *
 * Presentational + props-driven (see StockHeatMapDatum). The period/index
 * selectors are controlled (the parent owns the data for each period). See
 * MOCK_STOCKS for sample data and the file footer for how to wire a real API.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';

export interface StockHeatMapDatum {
  ticker: string;
  name: string;
  sector: string;
  /** null = quote unavailable — render a dash, never $0.00. */
  price: number | null;
  /** % change for the active period; null/undefined = unavailable (gray). */
  changePercent: number | null;
  marketCap: number; // any consistent unit (we use $B)
  volume?: number;
}

export type HeatMapPeriod = 'd1' | 'w1' | 'm1' | 'ytd';

const PERIODS: { id: HeatMapPeriod; label: string }[] = [
  { id: 'd1', label: '1D' },
  { id: 'w1', label: '1W' },
  { id: 'm1', label: '1M' },
  { id: 'ytd', label: 'YTD' },
];

export interface StockHeatMapProps {
  data: StockHeatMapDatum[];
  /** Controlled period selector. Omit to hide the period buttons. */
  period?: HeatMapPeriod;
  onPeriodChange?: (p: HeatMapPeriod) => void;
  asOf?: string;
  loading?: boolean;
  height?: number;
  className?: string;
}

// Discrete color buckets (dark-mode friendly).
function tileColor(dp: number | null | undefined): string {
  if (dp == null) return 'rgba(115,115,115,0.22)'; // gray — unavailable
  if (dp > 3) return '#15803d'; // strong green
  if (dp >= 0) return 'rgba(22,163,74,0.42)'; // light green
  if (dp > -3) return 'rgba(220,38,38,0.42)'; // light red
  return '#b91c1c'; // strong red
}

function fmtPct(dp: number | null | undefined): string {
  if (dp == null) return '—';
  return `${dp >= 0 ? '+' : ''}${dp.toFixed(2)}%`;
}

function fmtCap(cap: number): string {
  // cap is in $B
  if (cap >= 1000) return `$${(cap / 1000).toFixed(2)}T`;
  return `$${cap.toFixed(0)}B`;
}

function fmtVol(v?: number): string {
  if (v == null) return '—';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
}

// Each tile links to the in-app stock detail page (/stocks/<TICKER>). Relative
// path so it works on any host (preview & prod).
function stockPageUrl(ticker: string): string {
  return `/stocks/${encodeURIComponent(ticker)}`;
}

const SECTOR_HEADER = 18;

type Leaf = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  datum: StockHeatMapDatum;
};
type SectorBox = { x0: number; y0: number; sector: string; w: number };

export default function StockHeatMap({
  data,
  period,
  onPeriodChange,
  asOf,
  loading = false,
  height = 600,
  className,
}: StockHeatMapProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [hover, setHover] = useState<{ x: number; y: number; d: StockHeatMapDatum } | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const sectors = useMemo(() => {
    const set = new Set(data.map((d) => d.sector));
    return Array.from(set);
  }, [data]);

  const filtered = useMemo(
    () => (sectorFilter === 'all' ? data : data.filter((d) => d.sector === sectorFilter)),
    [data, sectorFilter],
  );

  const { leaves, sectorBoxes } = useMemo(() => {
    if (width <= 0 || filtered.length === 0) return { leaves: [] as Leaf[], sectorBoxes: [] as SectorBox[] };
    const bySector = new Map<string, StockHeatMapDatum[]>();
    for (const d of filtered) {
      if (!bySector.has(d.sector)) bySector.set(d.sector, []);
      bySector.get(d.sector)!.push(d);
    }
    const rootData = {
      name: 'root',
      children: Array.from(bySector.entries()).map(([sector, stocks]) => ({
        name: sector,
        children: stocks,
      })),
    };

    const root = hierarchy<Record<string, unknown>>(rootData as Record<string, unknown>, (n) =>
      (n as { children?: Record<string, unknown>[] }).children,
    )
      .sum((n) => ((n as unknown as StockHeatMapDatum).marketCap as number) || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    treemap<Record<string, unknown>>()
      .tile(treemapSquarify)
      .size([width, height])
      .paddingInner(2)
      .paddingTop(SECTOR_HEADER)
      .round(true)(root);

    const lv: Leaf[] = root.leaves().map((n) => {
      const t = n as unknown as { x0: number; y0: number; x1: number; y1: number; data: StockHeatMapDatum };
      return { x0: t.x0, y0: t.y0, x1: t.x1, y1: t.y1, datum: t.data };
    });
    const sb: SectorBox[] = (root.children ?? []).map((n) => {
      const t = n as unknown as { x0: number; y0: number; x1: number; data: { name: string } };
      return { x0: t.x0, y0: t.y0, sector: t.data.name, w: t.x1 - t.x0 };
    });
    return { leaves: lv, sectorBoxes: sb };
  }, [filtered, width, height]);

  const isMobile = width > 0 && width < 480;

  return (
    <div className={`rounded-xl border border-gray-800 bg-gray-900/40 p-3 sm:p-4 ${className ?? ''}`}>
      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
          </span>
          Live Heatmap
          {asOf ? <span className="font-normal normal-case text-gray-500">· {asOf.slice(11, 16)} UTC</span> : null}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* Sector filter */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            aria-label="Filter by sector"
            className="rounded-md border border-gray-700 bg-gray-800/70 px-2 py-1 text-xs text-gray-200 focus:border-teal-500/50 focus:outline-none"
          >
            <option value="all">All sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {/* Period selector */}
          {period && onPeriodChange && (
            <div className="flex overflow-hidden rounded-md border border-gray-700">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPeriodChange(p.id)}
                  className={`px-2.5 py-1 text-xs transition-colors ${
                    period === p.id ? 'bg-teal-500 text-gray-900' : 'bg-gray-800/70 text-gray-300 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div ref={wrapRef} className="relative w-full">
        {loading && filtered.length === 0 ? (
          <div className="flex items-center justify-center text-sm text-gray-500" style={{ height }}>
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center text-sm text-gray-500" style={{ height: 200 }}>
            No data.
          </div>
        ) : isMobile ? (
          // Mobile: simplified, scrollable colored chips per sector.
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {Array.from(new Set(filtered.map((d) => d.sector))).map((sec) => (
              <div key={sec}>
                <p className="mb-1.5 text-[11px] uppercase tracking-wide text-gray-500">{sec}</p>
                <div className="flex flex-wrap gap-1.5">
                  {filtered
                    .filter((d) => d.sector === sec)
                    .sort((a, b) => b.marketCap - a.marketCap)
                    .map((d) => (
                      <Link
                        key={d.ticker}
                        href={stockPageUrl(d.ticker)}
                        title={`Open ${d.ticker}`}
                        className="flex min-w-[72px] flex-1 flex-col items-center rounded-md px-2 py-1.5 no-underline active:brightness-110"
                        style={{ backgroundColor: tileColor(d.changePercent) }}
                      >
                        <span className="text-xs font-bold text-white">{d.ticker}</span>
                        <span className="text-[11px] tabular-nums text-white/90">{fmtPct(d.changePercent)}</span>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop: treemap.
          <div className="relative" style={{ height }}>
            {sectorBoxes.map((s) =>
              s.w > 70 ? (
                <div
                  key={`sec-${s.sector}`}
                  className="pointer-events-none absolute truncate text-[10px] font-semibold uppercase tracking-wide text-gray-400"
                  style={{ left: s.x0 + 3, top: s.y0 + 2, width: s.w - 6 }}
                >
                  {s.sector}
                </div>
              ) : null,
            )}
            {leaves.map((l) => {
              const w = l.x1 - l.x0;
              const h = l.y1 - l.y0;
              const d = l.datum;
              const showName = w >= 96 && h >= 58;
              const showPct = h >= 38;
              const showPrice = h >= 74 && w >= 70;
              return (
                <Link
                  key={d.ticker}
                  href={stockPageUrl(d.ticker)}
                  title={`Open ${d.ticker}`}
                  onMouseEnter={() => setHover({ x: l.x0 + w / 2, y: l.y0, d })}
                  onMouseMove={() => setHover((prev) => (prev && prev.d.ticker === d.ticker ? prev : { x: l.x0 + w / 2, y: l.y0, d }))}
                  onMouseLeave={() => setHover(null)}
                  className="absolute flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[3px] px-1 text-center no-underline outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/70"
                  style={{ left: l.x0, top: l.y0, width: w, height: h, backgroundColor: tileColor(d.changePercent) }}
                >
                  {w >= 34 && h >= 22 && (
                    <span className="max-w-full truncate text-[11px] font-bold leading-tight text-white">
                      {d.ticker}
                    </span>
                  )}
                  {showName && (
                    <span className="max-w-full truncate text-[10px] leading-tight text-white/80">{d.name}</span>
                  )}
                  {showPrice && (
                    <span className="text-[10px] tabular-nums leading-tight text-white/80">
                      {d.price != null ? `$${d.price.toFixed(2)}` : '—'}
                    </span>
                  )}
                  {showPct && w >= 40 && (
                    <span className="text-[10px] font-semibold tabular-nums leading-tight text-white">
                      {fmtPct(d.changePercent)}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Tooltip */}
            {hover && (
              <div
                className="pointer-events-none absolute z-20 w-52 -translate-x-1/2 rounded-lg border border-gray-700 bg-gray-950/95 p-3 text-xs shadow-xl backdrop-blur"
                style={{
                  left: Math.min(Math.max(hover.x, 104), Math.max(width - 104, 104)),
                  top: hover.y + 6,
                }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-bold text-white">{hover.d.ticker}</span>
                  <span className="font-semibold tabular-nums" style={{ color: (hover.d.changePercent ?? 0) >= 0 ? '#4ade80' : '#f87171' }}>
                    {fmtPct(hover.d.changePercent)}
                  </span>
                </div>
                <p className="mb-1 truncate text-gray-300">{hover.d.name}</p>
                <dl className="space-y-0.5 text-gray-400">
                  <div className="flex justify-between"><dt>Sector</dt><dd className="text-gray-200">{hover.d.sector}</dd></div>
                  <div className="flex justify-between"><dt>Price</dt><dd className="text-gray-200 tabular-nums">{hover.d.price != null ? `$${hover.d.price.toFixed(2)}` : '—'}</dd></div>
                  <div className="flex justify-between"><dt>Market cap</dt><dd className="text-gray-200 tabular-nums">{fmtCap(hover.d.marketCap)}</dd></div>
                  <div className="flex justify-between"><dt>Volume</dt><dd className="text-gray-200 tabular-nums">{fmtVol(hover.d.volume)}</dd></div>
                </dl>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sample data — drop-in for previews/tests until a real feed is wired.
export const MOCK_STOCKS: StockHeatMapDatum[] = [
  { ticker: 'AAPL', name: 'Apple', sector: 'Technology', price: 232.1, changePercent: 1.2, marketCap: 3400, volume: 51_000_000 },
  { ticker: 'MSFT', name: 'Microsoft', sector: 'Technology', price: 441.2, changePercent: -0.6, marketCap: 3300, volume: 22_000_000 },
  { ticker: 'NVDA', name: 'NVIDIA', sector: 'Technology', price: 124.5, changePercent: 4.1, marketCap: 3000, volume: 310_000_000 },
  { ticker: 'AMZN', name: 'Amazon', sector: 'Consumer Discretionary', price: 186.3, changePercent: -3.4, marketCap: 1900, volume: 40_000_000 },
  { ticker: 'GOOGL', name: 'Alphabet', sector: 'Communication Services', price: 178.9, changePercent: 0.4, marketCap: 2100, volume: 18_000_000 },
  { ticker: 'META', name: 'Meta', sector: 'Communication Services', price: 504.2, changePercent: -1.1, marketCap: 1300, volume: 14_000_000 },
  { ticker: 'JPM', name: 'JPMorgan', sector: 'Financials', price: 212.4, changePercent: 0.9, marketCap: 600, volume: 9_000_000 },
  { ticker: 'LLY', name: 'Eli Lilly', sector: 'Health Care', price: 905.1, changePercent: 2.2, marketCap: 800, volume: 3_000_000 },
  { ticker: 'XOM', name: 'Exxon Mobil', sector: 'Energy', price: 113.7, changePercent: -2.0, marketCap: 480, volume: 16_000_000 },
  { ticker: 'WMT', name: 'Walmart', sector: 'Consumer Staples', price: 68.9, changePercent: 0.1, marketCap: 600, volume: 20_000_000 },
];

/*
 * Connecting a real API later
 * ---------------------------
 * Pass `data` as StockHeatMapDatum[]. Map your provider's fields:
 *   - marketCap → rectangle size (any consistent unit; we use $B)
 *   - changePercent → color (null/undefined renders gray)
 * For period switching, keep the multi-period values in the parent and pass the
 * selected period's value as `changePercent`, wiring `period`/`onPeriodChange`.
 * In this app the data comes from the engine's GET /v1/heatmap (Finnhub real-time
 * 1D + Yahoo EOD for 1W/1M/YTD); see components/markets/MarketHeatmap.tsx. To use
 * another source (Polygon, IEX, Finnhub direct), swap that fetch — no API key is
 * hardcoded here; keys live server-side only.
 */
