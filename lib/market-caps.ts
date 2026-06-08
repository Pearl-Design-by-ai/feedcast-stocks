/**
 * Approximate market caps (in USD billions) for the large/mega-cap US names that
 * show up in the live heatmap. Used to size treemap tiles by "weight" so the
 * heatmap reads like a real market-cap heatmap (bigger company → bigger box).
 *
 * These are rough, intentionally static reference values — relative ordering is
 * what matters for tile sizing, not precision. If the engine ever returns a real
 * `marketCap`, prefer that (see capWeightB()).
 */
export const MARKET_CAP_B: Record<string, number> = {
  // Technology
  AAPL: 3300, MSFT: 3100, NVDA: 3000, AVGO: 800, ORCL: 480, AMD: 230,
  ADBE: 240, CRM: 270, CSCO: 200, INTC: 110, QCOM: 190, TXN: 170,
  IBM: 200, MU: 130, AMAT: 150, NOW: 200, INTU: 180, LRCX: 110,
  // Communication services
  GOOGL: 2100, META: 1300, NFLX: 320, DIS: 200, CMCSA: 160, T: 150,
  VZ: 175, TMUS: 250, CHTR: 50,
  // Consumer discretionary
  AMZN: 1900, TSLA: 800, HD: 380, MCD: 210, NKE: 110, SBUX: 100,
  LOW: 140, BKNG: 160, TJX: 130, ORLY: 70,
  // Financials
  JPM: 620, V: 560, MA: 430, BAC: 300, WFC: 230, GS: 160, MS: 170,
  BRK: 900, AXP: 200, BLK: 140, C: 120, SCHW: 130,
  // Health care
  LLY: 720, UNH: 480, JNJ: 380, MRK: 300, ABBV: 330, PFE: 150,
  TMO: 220, ABT: 200, DHR: 180, AMGN: 150, BMY: 110,
  // Consumer staples
  WMT: 600, PG: 390, KO: 270, PEP: 230, COST: 380, MDLZ: 90,
  PM: 180, MO: 95, CL: 75,
  // Energy
  XOM: 520, CVX: 280, COP: 130, SLB: 60, EOG: 70,
  // Industrials
  GE: 200, CAT: 180, RTX: 160, HON: 130, UNP: 140, BA: 110, UPS: 110,
  LMT: 110, DE: 110,
  // Utilities / materials / real estate
  NEE: 160, DUK: 90, SO: 95, LIN: 220, SHW: 90, AMT: 90, PLD: 110,
};

/** Fallback weight (billions) for symbols not in the table. */
export const DEFAULT_CAP_B = 60;

/**
 * Resolve a tile "weight" in billions. Prefers a real market cap (USD, converted
 * to billions) if one is supplied, otherwise the static reference, otherwise the
 * default. Always returns a positive number so treemap math stays well-behaved.
 */
export function capWeightB(symbol: string, marketCap?: number | null): number {
  if (marketCap != null && marketCap > 0) {
    // Engine value is assumed to be in USD; normalise to billions.
    return marketCap > 1e6 ? marketCap / 1e9 : marketCap;
  }
  return MARKET_CAP_B[symbol] ?? DEFAULT_CAP_B;
}
