/**
 * Defensive payload parsing for private_portfolio_documents. The sync script
 * lives off-repo and its output can drift, so nothing here throws: unknown
 * fields are ignored, wrong types fall back to null/empty, and rows that can't
 * be identified (a holding with no name, a diff row with no action) are
 * dropped instead of crashing the page.
 */

import type {
    Account,
    DiffAction,
    DiffRow,
    DrawdownEpisode,
    Holding,
    Plan,
    PlanDrawdown,
    PlanSummary,
    PortfolioDocumentRow,
    PrivatePortfolioData,
    Projection,
    Scenario,
    Snapshot,
} from './types';

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function num(v: unknown): number | null {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function str(v: unknown): string | null {
    if (typeof v === 'string') return v.trim() === '' ? null : v;
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    return null;
}

const strList = (v: unknown): string[] => arr(v).map(str).filter((s): s is string => s !== null);

function numRecord(v: unknown): Record<string, number> {
    const out: Record<string, number> = {};
    if (!isObj(v)) return out;
    for (const [k, raw] of Object.entries(v)) {
        const n = num(raw);
        if (n !== null) out[k] = n;
    }
    return out;
}

/** Exactly 12 finite values (Jan..Dec), or null when the input isn't a list. */
export function parseMonthly(v: unknown): number[] | null {
    if (!Array.isArray(v)) return null;
    return Array.from({ length: 12 }, (_, i) => num(v[i]) ?? 0);
}

export function parseHolding(v: unknown): Holding | null {
    if (!isObj(v)) return null;
    const name = str(v.name);
    if (!name) return null;
    return {
        name,
        isin: str(v.isin),
        ticker: str(v.ticker),
        ccy: str(v.ccy) ?? 'USD',
        nominal: num(v.nominal),
        units: num(v.units),
        price: num(v.price),
        valueLocal: num(v.valueLocal),
        valueUsd: num(v.valueUsd) ?? 0,
        couponPct: num(v.couponPct),
        maturity: str(v.maturity),
        ytmPct: num(v.ytmPct),
        durationYrs: num(v.durationYrs),
        annualIncomeUsd: num(v.annualIncomeUsd),
        group: str(v.group) ?? 'Diğer',
        custodian: str(v.custodian) ?? 'Diğer',
        account: str(v.account),
        role: str(v.role),
        source: str(v.source),
    };
}

const holdings = (v: unknown): Holding[] => arr(v).map(parseHolding).filter((h): h is Holding => h !== null);

function parseAccount(v: unknown, i: number): Account | null {
    if (!isObj(v)) return null;
    const hs = holdings(v.holdings);
    const custodian = str(v.custodian) ?? hs[0]?.custodian ?? 'Diğer';
    return {
        id: str(v.id) ?? `account-${i + 1}`,
        name: str(v.name) ?? str(v.id) ?? `Hesap ${i + 1}`,
        custodian,
        totalUsd: num(v.totalUsd) ?? hs.reduce((s, h) => s + h.valueUsd, 0),
        holdings: hs,
    };
}

export function parseSnapshot(v: unknown, fallbackAsOf?: string): Snapshot | null {
    if (!isObj(v)) return null;
    const accounts = arr(v.accounts)
        .map(parseAccount)
        .filter((a): a is Account => a !== null);
    const totals = isObj(v.totals) ? v.totals : {};
    const sources = isObj(v.sources) ? v.sources : {};
    const marketFromAccounts = accounts.reduce((s, a) => s + a.totalUsd, 0);
    const allocation = arr(v.allocation)
        .filter(isObj)
        .map((a) => ({ group: str(a.group) ?? 'Diğer', valueUsd: num(a.valueUsd) ?? 0, share: num(a.share) ?? 0 }));
    const accrued = num(totals.accruedUsd);
    return {
        asOf: str(v.asOf) ?? fallbackAsOf ?? '',
        sources: {
            excelModified: str(sources.excelModified),
            ibkrAsOf: str(sources.ibkrAsOf),
            pricesNote: str(sources.pricesNote) ?? undefined,
        },
        fx: numRecord(v.fx),
        totals: {
            marketUsd: num(totals.marketUsd) ?? marketFromAccounts,
            maturityUsd: num(totals.maturityUsd) ?? 0,
            annualIncomeUsd: num(totals.annualIncomeUsd) ?? 0,
            ...(accrued !== null ? { accruedUsd: accrued } : {}),
        },
        accounts,
        allocation,
        monthlyIncome: parseMonthly(v.monthlyIncome) ?? Array(12).fill(0),
        notes: strList(v.notes),
    };
}

const DIFF_ACTIONS: DiffAction[] = ['buy', 'sell', 'keep', 'transfer'];

export function parseDiffRow(v: unknown): DiffRow | null {
    if (!isObj(v)) return null;
    const action = str(v.action)?.toLowerCase() as DiffAction | undefined;
    const name = str(v.name);
    if (!action || !DIFF_ACTIONS.includes(action) || !name) return null;
    return {
        action,
        name,
        isin: str(v.isin),
        ticker: str(v.ticker),
        custodian: str(v.custodian) ?? 'Diğer',
        amountUsd: Math.abs(num(v.amountUsd) ?? 0),
        nominal: num(v.nominal),
        note: str(v.note),
    };
}

function parseSummary(v: unknown): PlanSummary {
    const out: PlanSummary = {};
    if (!isObj(v)) return out;
    for (const [k, raw] of Object.entries(v)) {
        if (Array.isArray(raw) && raw.length === 2) {
            const a = num(raw[0]);
            const b = num(raw[1]);
            if (a !== null && b !== null) out[k] = [a, b];
        } else {
            const n = num(raw);
            if (n !== null) out[k] = n;
        }
    }
    return out;
}

function parseProjection(v: unknown): Projection | null {
    if (!isObj(v)) return null;
    const policy = str(v.policy);
    if (!policy) return null;
    const points = arr(v.points)
        .filter(isObj)
        .map((p) => ({ year: num(p.year), incomePortfolioUsd: num(p.incomePortfolioUsd), cspxUsd: num(p.cspxUsd) }))
        .filter((p): p is { year: number; incomePortfolioUsd: number; cspxUsd: number | null } =>
            p.year !== null && p.incomePortfolioUsd !== null)
        .sort((a, b) => a.year - b.year);
    return { policy, points, depletionYear: num(v.depletionYear) };
}

function parseEpisode(v: unknown): DrawdownEpisode | null {
    if (!isObj(v)) return null;
    const peak = str(v.peak);
    const trough = str(v.trough);
    const ddPct = num(v.ddPct);
    if (!peak || !trough || ddPct === null) return null;
    return {
        peak,
        trough,
        recovery: str(v.recovery),
        ddPct,
        fallMonths: num(v.fallMonths) ?? 0,
        recoveryMonths: num(v.recoveryMonths),
        totalMonths: num(v.totalMonths),
    };
}

function parseDrawdown(v: unknown): PlanDrawdown | undefined {
    if (!isObj(v)) return undefined;
    const series: PlanDrawdown['series'] = {};
    if (isObj(v.series)) {
        for (const [k, raw] of Object.entries(v.series)) {
            const pts = arr(raw)
                .filter(isObj)
                .map((p) => ({ month: str(p.month), value: num(p.value) }))
                .filter((p): p is { month: string; value: number } => p.month !== null && p.value !== null);
            if (pts.length) series[k] = pts;
        }
    }
    const episodes: PlanDrawdown['episodes'] = {};
    if (isObj(v.episodes)) {
        for (const [k, raw] of Object.entries(v.episodes)) {
            episodes[k] = arr(raw).map(parseEpisode).filter((e): e is DrawdownEpisode => e !== null);
        }
    }
    return { series, maxDdPct: numRecord(v.maxDdPct), episodes };
}

function parseScenario(v: unknown): Scenario | null {
    if (!isObj(v)) return null;
    const name = str(v.name);
    if (!name) return null;
    return { name, lossUsd: numRecord(v.lossUsd), recovery: str(v.recovery) ?? '—' };
}

export function parsePlan(v: unknown, fallback?: { slug?: string; asOf?: string }): Plan | null {
    if (!isObj(v)) return null;
    const slug = str(v.slug) ?? fallback?.slug ?? null;
    if (!slug) return null;
    const account = str(v.account);
    const documents = arr(v.documents)
        .filter(isObj)
        .map((d) => ({ title: str(d.title), path: str(d.path) }))
        .filter((d): d is { title: string; path: string } => d.title !== null && d.path !== null);
    // A bare string is read as a one-item list; blanks are dropped.
    const scopeAccounts = strList(typeof v.scopeAccounts === 'string' ? [v.scopeAccounts] : v.scopeAccounts)
        .map((s) => s.trim())
        .filter(Boolean);
    return {
        slug,
        title: str(v.title) ?? slug,
        subtitle: str(v.subtitle) ?? undefined,
        asOf: str(v.asOf) ?? fallback?.asOf ?? '',
        account: account === 'personal' || account === 'company' ? account : 'both',
        ...(scopeAccounts.length ? { scopeAccounts } : {}),
        summary: parseSummary(v.summary),
        targetHoldings: holdings(v.targetHoldings),
        diff: arr(v.diff).map(parseDiffRow).filter((d): d is DiffRow => d !== null),
        monthlyIncome: parseMonthly(v.monthlyIncome) ?? undefined,
        projections: arr(v.projections).map(parseProjection).filter((p): p is Projection => p !== null),
        drawdown: parseDrawdown(v.drawdown),
        scenarios: arr(v.scenarios).map(parseScenario).filter((s): s is Scenario => s !== null),
        risks: strList(v.risks),
        steps: strList(v.steps),
        assumptions: strList(v.assumptions),
        documents,
    };
}

/** Turn the raw table rows into the page model. Never throws. */
export function parseDocuments(rows: unknown): PrivatePortfolioData {
    let snapshot: Snapshot | null = null;
    const plans: Plan[] = [];
    for (const row of arr(rows)) {
        if (!isObj(row)) continue;
        const r = row as Partial<PortfolioDocumentRow>;
        const slug = str(r.slug);
        const asOf = str(r.as_of) ?? undefined;
        if (r.kind === 'snapshot' && slug === 'current') {
            snapshot = parseSnapshot(r.payload, asOf) ?? snapshot;
        } else if (r.kind === 'plan') {
            const plan = parsePlan(r.payload, { slug: slug ?? undefined, asOf });
            if (plan) plans.push(plan);
        }
    }
    plans.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    return { snapshot, plans };
}
