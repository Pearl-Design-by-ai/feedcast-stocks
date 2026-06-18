/**
 * Public type definitions for the Leverage Rotation screen. The scoring, the
 * pair set and the volatility blend all run in the PRIVATE markets-engine — the
 * public app only renders the LeverageReport JSON it returns. See
 * lib/actions/leverage.actions.ts (shim) and markets-engine/lib/leverage.ts.
 */

export type LevAction = 'lever-up' | 'hold' | 'trim' | 'de-lever';
export type SubState = 'bull' | 'neutral' | 'bear';

export interface LevSubSignal {
    label: string;
    state: SubState;
    detail: string;
}

export interface LevStep {
    scenario: string;
    level: number | null;
    movePct: number | null;
    action: LevAction;
    leveragedPct: number;
    basePct: number;
    note: string;
}

export interface LeveragePair {
    key: string;
    market: string;
    blurb: string;
    baseSymbol: string;
    leveragedSymbol: string;
    leverageX: number;
    last: number | null;
    dayChangePct: number | null;
    score: number;
    leveragedPct: number;
    basePct: number;
    effExposure: number;
    stance: string;
    tone: 'pos' | 'neutral' | 'neg';
    rationale: string;
    subs: LevSubSignal[];
    ladder: LevStep[];
    limited: boolean;
}

export interface BtLeg {
    value: number;
    retPct: number;
    maxDdPct: number;
}

export interface BtPoint {
    date: string;
    strat: number;
    flat: number;
    lev3x: number;
}

export interface PairBacktest {
    key: string;
    market: string;
    baseSymbol: string;
    leveragedSymbol: string;
    leverageX: number;
    startValue: number;
    startDate: string;
    endDate: string;
    days: number;
    avgLeveragedPct: number;
    strategy: BtLeg;
    flat: BtLeg;
    lev3x: BtLeg;
    curve: BtPoint[];
}

export interface LeverageBacktest {
    year: number;
    range: string;
    label: string;
    costBps: number;
    pairs: PairBacktest[];
}

export interface LeverageReport {
    asOf: string;
    dataDate: string;
    vix: number | null;
    vixNote: string;
    pairs: LeveragePair[];
    backtest: LeverageBacktest | null;
    disclaimer: string;
}
