/**
 * Public type mirror for the Admin diagnostics console. The probes and the
 * freshness logic run in the PRIVATE markets-engine (lib/diagnostics.ts) — the
 * public app only renders the DiagnosticsReport JSON it returns. See
 * lib/actions/admin.actions.ts (shim).
 */

export type ProbeStatus = 'ok' | 'stale' | 'down' | 'unconfigured';
export type Overall = 'healthy' | 'degraded' | 'down';

export interface FeedProbe {
    key: string;
    label: string;
    status: ProbeStatus;
    detail: string;
    latencyMs: number | null;
}

export interface SymbolHealth {
    symbol: string;
    asset: string;
    lastDate: string | null;
    lastClose: number | null;
    sessionsBehind: number | null;
    status: 'ok' | 'stale' | 'down';
}

export interface DiagnosticsReport {
    generatedAt: string;
    session: string;
    overall: Overall;
    feeds: FeedProbe[];
    eod: {
        expectedSession: string;
        staleCount: number;
        downCount: number;
        symbols: SymbolHealth[];
    };
    valuation: {
        built: boolean;
        complete: boolean;
        asOf: string | null;
        session: string | null;
        scanned: number | null;
        universe: number | null;
    };
    config: {
        engineToken: boolean;
        deepseek: boolean;
        finnhub: boolean;
        adanos: boolean;
        kvCache: boolean;
    };
    notes: string[];
}
