/**
 * Dashboard module catalog — pure metadata, no component imports, so it can be
 * shared by both the server view (which renders the real widgets) and the client
 * editor (which only needs titles/descriptions). The actual components are wired
 * in components/dashboard/DashboardView.tsx.
 */

export type ModuleId =
  // TradingView
  | 'market-quotes'
  | 'top-stories'
  | 'screener'
  | 'economic-calendar'
  | 'forex-heatmap'
  | 'crypto-heatmap'
  // AI
  | 'market-brief'
  | 'ai-commentary'
  | 'ask-shortcut'
  // Personal
  | 'watchlist'
  // Markets
  | 'market-regime'
  | 'world-indices';

export type TileSpan = 'full' | 'half';

export interface Tile {
  id: ModuleId;
  span: TileSpan;
}

export interface DashboardLayout {
  tiles: Tile[];
}

export type ModuleCategory = 'TradingView' | 'AI' | 'Personal' | 'Markets';

export interface ModuleMeta {
  id: ModuleId;
  title: string;
  description: string;
  category: ModuleCategory;
  defaultSpan: TileSpan;
}

export const CATALOG: ModuleMeta[] = [
  // TradingView
  { id: 'market-quotes', title: 'Market Quotes', description: 'Live quote table across key stocks.', category: 'TradingView', defaultSpan: 'full' },
  { id: 'top-stories', title: 'Top Stories', description: 'Latest market news headlines.', category: 'TradingView', defaultSpan: 'full' },
  { id: 'screener', title: 'Stock Screener', description: 'Most-capitalized stock screener.', category: 'TradingView', defaultSpan: 'full' },
  { id: 'economic-calendar', title: 'Economic Calendar', description: 'Upcoming macro events.', category: 'TradingView', defaultSpan: 'full' },
  { id: 'forex-heatmap', title: 'Forex Heatmap', description: 'Relative strength of major currencies.', category: 'TradingView', defaultSpan: 'full' },
  { id: 'crypto-heatmap', title: 'Crypto Heatmap', description: 'Market-cap weighted crypto heatmap.', category: 'TradingView', defaultSpan: 'full' },
  // AI
  { id: 'market-brief', title: 'AI Market Brief', description: 'Today’s headlines summarized by FeedCast AI.', category: 'AI', defaultSpan: 'full' },
  { id: 'ai-commentary', title: 'AI Commentary', description: 'Live FeedCast AI read on the market regime.', category: 'AI', defaultSpan: 'full' },
  { id: 'ask-shortcut', title: 'Ask the Markets', description: 'Quick link into the grounded FeedCast AI chat.', category: 'AI', defaultSpan: 'full' },
  // Personal
  { id: 'watchlist', title: 'Watchlist', description: 'Your saved tickers at a glance.', category: 'Personal', defaultSpan: 'full' },
  // Markets
  { id: 'market-regime', title: 'Market Regime', description: 'Risk-on/off score and signals.', category: 'Markets', defaultSpan: 'full' },
  { id: 'world-indices', title: 'World Indices', description: 'Global equity ETFs by region.', category: 'Markets', defaultSpan: 'full' },
];

export const MODULE_META: Record<ModuleId, ModuleMeta> = CATALOG.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<ModuleId, ModuleMeta>,
);

const VALID_IDS = new Set(CATALOG.map((m) => m.id));

/** The starting dashboard — mirrors the original fixed home page. */
export const DEFAULT_LAYOUT: DashboardLayout = {
  tiles: [
    { id: 'market-brief', span: 'full' },
    { id: 'watchlist', span: 'full' },
    { id: 'market-regime', span: 'full' },
    { id: 'market-quotes', span: 'full' },
    { id: 'top-stories', span: 'full' },
  ],
};

/** Coerce arbitrary stored JSON into a safe layout (drop unknown/dup modules). */
export function sanitizeLayout(raw: unknown): DashboardLayout {
  const tilesIn = (raw as DashboardLayout | null)?.tiles;
  if (!Array.isArray(tilesIn)) return DEFAULT_LAYOUT;
  const seen = new Set<string>();
  const tiles: Tile[] = [];
  for (const t of tilesIn) {
    const id = (t as Tile)?.id;
    if (!VALID_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    tiles.push({ id, span: (t as Tile)?.span === 'half' ? 'half' : 'full' });
  }
  return { tiles };
}
