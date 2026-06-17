/**
 * Market Indicators — public type contract.
 *
 * The curated 62-indicator catalog (symbol mappings + blurbs) now lives in the
 * PRIVATE markets-engine and is fetched via lib/actions/indicators.actions.ts.
 * Only the shapes the UI renders with remain here.
 */

export type TVStudy = string | { id: string; inputs?: Record<string, unknown> };

export type IndicatorWidget =
    | {
          kind: 'chart';
          symbol: string;
          studies?: TVStudy[];
          interval?: string;
          compareSymbols?: Array<{ symbol: string; position: string }>;
      }
    | { kind: 'external'; source: string; url: string; note?: string };

export interface MarketIndicator {
    num: number;
    name: string;
    blurb: string;
    widget: IndicatorWidget;
}

export interface IndicatorCategory {
    id: string;
    label: string;
    blurb: string;
    indicators: MarketIndicator[];
}
