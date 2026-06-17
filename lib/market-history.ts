/**
 * Curated market-history context — public type contract.
 *
 * The curated drawdown/recovery statistics and the long-run "why markets rise"
 * case now live in the PRIVATE markets-engine and are served as part of the
 * Buy & Sell Signals report (see lib/signals-scan.ts). Only the row shapes the
 * UI renders with remain here.
 */

export interface DrawdownStat {
    band: string;
    frequency: string;
    avgDecline: string;
    recovery: string;
    note: string;
    /** Tone for the row. */
    tone: 'pos' | 'neutral' | 'warn' | 'neg';
}

export interface WhyUp {
    title: string;
    body: string;
}
