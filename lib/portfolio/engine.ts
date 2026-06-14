/**
 * Portfolio Lab — a transparent, deterministic "biased portfolio" construction
 * engine. Given a mandate (archetype + risk + constraints), it selects assets
 * from a curated catalog and assigns constraint-aware target weights. Nothing
 * here predicts returns; it encodes textbook allocation heuristics so a
 * sophisticated user can read and adjust the logic. Educational only.
 */

import { CATALOG } from './catalog';

export type Archetype = 'growth' | 'income' | 'conservative' | 'thematic';
export type Theme = 'ai' | 'fintech' | 'em' | 'energy' | 'healthcare';
export type Region = 'US' | 'DM' | 'EM' | 'Global';
export type Style = 'growth' | 'value' | 'blend' | 'dividend' | 'bond' | 'cash';
export type AssetType = 'stock' | 'etf' | 'cash';
export type Universe = 'us' | 'dm' | 'global' | 'em';
export type Concentration = 'concentrated' | 'balanced' | 'diversified';
export type Vehicle = 'etf' | 'stock' | 'mixed';

export interface Asset {
    ticker: string;
    name: string;
    type: AssetType;
    sector: string;
    region: Region;
    style: Style;
    role: string;
    rationale: string;
    tier: 1 | 2 | 3; // 1 = core/highest base weight
    archetypes: Archetype[];
    themes?: Theme[];
}

export interface PortfolioInputs {
    currency: string;
    capital: number;
    horizon: 'short' | 'medium' | 'long';
    risk: 'low' | 'medium' | 'high';
    bias: Archetype;
    theme: Theme;
    universe: Universe;
    sectorCap: number; // %
    singleNameMax: number; // %
    vehicle: Vehicle;
    concentration: Concentration;
}

export interface Holding {
    ticker: string;
    name: string;
    type: AssetType;
    sector: string;
    region: Region;
    role: string;
    rationale: string;
    weight: number; // % 0–100
    sleeve: 'equity' | 'bond' | 'cash';
}

export interface PortfolioPlan {
    archetype: Archetype;
    mandate: string[];
    design: string[];
    holdings: Holding[];
    equityPct: number;
    bondPct: number;
    cashPct: number;
    bySector: { name: string; pct: number }[];
    byRegion: { name: string; pct: number }[];
    risk: {
        volatility: string;
        drawdown: string;
        outperform: string;
        underperform: string;
        clusters: string;
    };
    positions: number;
    singleNameMax: number;
    sectorCap: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const ARCHETYPE = {
    growth: { equity: 92, bond: 0, cash: 8, favStyle: ['growth'] as Style[], sectorCap: 35, singleMax: 10 },
    income: { equity: 66, bond: 24, cash: 10, favStyle: ['dividend', 'value'] as Style[], sectorCap: 30, singleMax: 8 },
    conservative: { equity: 46, bond: 39, cash: 15, favStyle: ['blend', 'dividend'] as Style[], sectorCap: 30, singleMax: 8 },
    thematic: { equity: 92, bond: 0, cash: 8, favStyle: ['growth'] as Style[], sectorCap: 60, singleMax: 12 },
} as const;

const POSITIONS: Record<Concentration, number> = { concentrated: 12, balanced: 20, diversified: 30 };

function regionOK(a: Asset, u: Universe): boolean {
    if (u === 'us') return a.region === 'US' || a.region === 'Global';
    if (u === 'dm') return a.region === 'US' || a.region === 'DM' || a.region === 'Global';
    if (u === 'em') return a.region === 'EM' || a.region === 'Global';
    return true; // global incl. EM
}

function vehicleOK(a: Asset, v: Vehicle): boolean {
    if (a.type === 'cash' || a.style === 'bond') return true; // sleeves always allowed
    if (v === 'etf') return a.type === 'etf';
    if (v === 'stock') return a.type === 'stock';
    return true;
}

/** Cap each weight at `cap`, redistributing the overflow across the rest
 *  proportionally (conserves the total). A few passes converge. */
function capSingleNames(weights: number[], cap: number): number[] {
    const w = [...weights];
    for (let pass = 0; pass < 6; pass++) {
        const over = w.map((x) => Math.max(0, x - cap));
        const excess = over.reduce((s, x) => s + x, 0);
        if (excess < 1e-6) break;
        for (let i = 0; i < w.length; i++) if (w[i] > cap) w[i] = cap;
        const room = w.map((x) => (x < cap ? cap - x : 0));
        const totalRoom = room.reduce((s, x) => s + x, 0);
        if (totalRoom < 1e-6) break;
        for (let i = 0; i < w.length; i++) w[i] += excess * (room[i] / totalRoom);
    }
    return w;
}

/** Scale any sector above `cap` down to it, pushing the freed weight to
 *  holdings in other sectors proportionally. */
function capSectors(holdings: { sector: string; weight: number }[], cap: number, total: number): number[] {
    const w = holdings.map((h) => h.weight);
    for (let pass = 0; pass < 4; pass++) {
        const bySector = new Map<string, number>();
        holdings.forEach((h, i) => bySector.set(h.sector, (bySector.get(h.sector) ?? 0) + w[i]));
        let freed = 0;
        const overSectors = new Set<string>();
        for (const [sec, sum] of bySector) {
            if (sum > cap + 1e-6) {
                overSectors.add(sec);
                const scale = cap / sum;
                holdings.forEach((h, i) => {
                    if (h.sector === sec) {
                        freed += w[i] * (1 - scale);
                        w[i] *= scale;
                    }
                });
            }
        }
        if (freed < 1e-6) break;
        const room = holdings.map((h, i) => (overSectors.has(h.sector) ? 0 : w[i]));
        const roomTotal = room.reduce((s, x) => s + x, 0);
        if (roomTotal < 1e-6) break;
        holdings.forEach((_, i) => (w[i] += freed * (room[i] / roomTotal)));
    }
    // Keep the sleeve total intact.
    const sum = w.reduce((s, x) => s + x, 0) || 1;
    return w.map((x) => (x / sum) * total);
}

function aggregate(holdings: Holding[], key: 'sector' | 'region'): { name: string; pct: number }[] {
    const map = new Map<string, number>();
    for (const h of holdings) {
        const k = h.sleeve === 'cash' ? 'Cash' : h.sleeve === 'bond' ? 'Bonds' : (h[key] as string);
        map.set(k, (map.get(k) ?? 0) + h.weight);
    }
    return [...map.entries()]
        .map(([name, pct]) => ({ name, pct: round1(pct) }))
        .sort((a, b) => b.pct - a.pct);
}

const RISK_NOTES: Record<Archetype, PortfolioPlan['risk']> = {
    growth: {
        volatility: 'High — concentrated in growth equities with elevated betas.',
        drawdown: 'Expect deep drawdowns (30–50%+ in a bear market); recoveries can be sharp.',
        outperform: 'Bull markets, falling/again-cheap rates, strong earnings and risk-on regimes.',
        underperform: 'Rate shocks, recessions and risk-off rotations into value/defensives.',
        clusters: 'Heavy technology/secular-growth, large-cap US, long-duration growth factor.',
    },
    income: {
        volatility: 'Low-to-medium — dividend payers and a bond sleeve dampen swings.',
        drawdown: 'Shallower than the market; income cushions total return in downturns.',
        outperform: 'Range-bound or falling-rate markets, risk-off periods, late cycle.',
        underperform: 'Fast bull runs led by non-payers; rising rates pressure bond-proxy yields.',
        clusters: 'Defensives, dividend/value factor, rate sensitivity via bonds and utilities/REITs.',
    },
    conservative: {
        volatility: 'Low — bond and cash sleeves anchor a quality-equity core.',
        drawdown: 'Modest; capital preservation is the priority over upside capture.',
        outperform: 'Volatile, uncertain or falling markets where drawdown control matters.',
        underperform: 'Strong equity bull markets — it deliberately gives up upside for stability.',
        clusters: 'Duration risk from bonds, quality factor, broad-market beta (muted).',
    },
    thematic: {
        volatility: 'Very high — a deliberate, concentrated bet on one theme.',
        drawdown: 'Can be severe and prolonged if the theme falls out of favor.',
        outperform: 'When the chosen theme is in a strong adoption/hype cycle.',
        underperform: 'Theme busts, rotations away from the narrative, single-name blowups.',
        clusters: 'Single-theme concentration — most diversification benefit is intentionally given up.',
    },
};

const HORIZON_LABEL = { short: 'short (<3y)', medium: 'medium (3–7y)', long: 'long (>7y)' };
const UNIVERSE_LABEL = { us: 'US only', dm: 'Global developed', global: 'Global incl. EM', em: 'Emerging markets' };

export function buildPortfolio(inp: PortfolioInputs): PortfolioPlan {
    const arch = inp.bias;
    const cfg = ARCHETYPE[arch];

    // Equity / bond / cash split — archetype base nudged by risk + horizon.
    let equity: number = cfg.equity;
    if (inp.risk === 'high') equity += 6;
    if (inp.risk === 'low') equity -= 8;
    if (inp.horizon === 'long') equity += 3;
    if (inp.horizon === 'short') equity -= 5;
    equity = clamp(equity, 30, 100);
    const bondBase = cfg.bond;
    let bond = bondBase > 0 ? clamp(bondBase + (inp.risk === 'low' ? 5 : inp.risk === 'high' ? -5 : 0), 0, 60) : 0;
    let cash = clamp(100 - equity - bond, 4, 30);
    // Re-derive equity so the three sum to 100 exactly.
    equity = 100 - bond - cash;
    if (equity < 25) {
        cash = clamp(cash, 4, 12);
        bond = clamp(100 - equity - cash, 0, 60);
        equity = 100 - bond - cash;
    }

    const sectorCap = clamp(inp.sectorCap || cfg.sectorCap, 15, 100);
    const singleMax = clamp(inp.singleNameMax || cfg.singleMax, 3, 30);
    const targetPositions = POSITIONS[inp.concentration];

    // Candidate pools.
    const pool = CATALOG.filter((a) => a.archetypes.includes(arch) && regionOK(a, inp.universe) && vehicleOK(a, inp.vehicle));
    const equityPool = pool.filter((a) => a.style !== 'bond' && a.style !== 'cash');
    const bondPool = CATALOG.filter((a) => a.style === 'bond');

    const score = (a: Asset) => {
        let s = a.tier === 1 ? 3 : a.tier === 2 ? 2 : 1;
        if (cfg.favStyle.includes(a.style)) s *= 1.4;
        if (arch === 'thematic' && a.themes?.includes(inp.theme)) s *= 1.8;
        return s;
    };

    // For thematic, prioritise theme members; for others rank by score.
    const ranked = [...equityPool].sort((a, b) => score(b) - score(a));
    const chosen = ranked.slice(0, Math.min(targetPositions, ranked.length));

    // Equity weights → normalize to the equity sleeve, then enforce caps.
    const rawScores = chosen.map(score);
    const rawSum = rawScores.reduce((s, x) => s + x, 0) || 1;
    let eqW = rawScores.map((x) => (x / rawSum) * equity);
    eqW = capSingleNames(eqW, singleMax);
    eqW = capSectors(chosen.map((a, i) => ({ sector: a.sector, weight: eqW[i] })), sectorCap, equity);
    eqW = capSingleNames(eqW, singleMax);

    const holdings: Holding[] = chosen.map((a, i) => ({
        ticker: a.ticker, name: a.name, type: a.type, sector: a.sector, region: a.region,
        role: a.role, rationale: a.rationale, weight: round1(eqW[i]), sleeve: 'equity',
    }));

    // Bond sleeve.
    if (bond > 0 && bondPool.length) {
        const bonds = bondPool.sort((a, b) => a.tier - b.tier).slice(0, 2);
        const bw = bonds.map((b) => (b.tier === 1 ? 2 : 1));
        const bwSum = bw.reduce((s, x) => s + x, 0);
        bonds.forEach((b, i) =>
            holdings.push({
                ticker: b.ticker, name: b.name, type: b.type, sector: b.sector, region: b.region,
                role: b.role, rationale: b.rationale, weight: round1((bw[i] / bwSum) * bond), sleeve: 'bond',
            })
        );
    }

    // Cash plug — absorbs rounding so the book totals exactly 100%.
    const allocated = holdings.reduce((s, h) => s + h.weight, 0);
    holdings.push({
        ticker: 'CASH', name: `Cash (${inp.currency})`, type: 'cash', sector: 'Cash', region: 'US',
        role: 'Dry powder / buffer', rationale: 'Liquidity buffer to cut volatility and fund rebalances or dips.',
        weight: round1(100 - allocated), sleeve: 'cash',
    });

    const bySector = aggregate(holdings, 'sector');
    const byRegion = aggregate(holdings, 'region');

    const mandate = [
        `${arch[0].toUpperCase() + arch.slice(1)}${arch === 'thematic' ? ` · ${inp.theme.toUpperCase()}` : ''} mandate, biased on purpose toward ${cfg.favStyle.join('/') || 'the chosen theme'}.`,
        `${new Intl.NumberFormat('en-US').format(inp.capital)} ${inp.currency} · ${HORIZON_LABEL[inp.horizon]} horizon · ${inp.risk} risk tolerance.`,
        `Universe: ${UNIVERSE_LABEL[inp.universe]} · ${inp.vehicle === 'mixed' ? 'stocks + ETFs' : inp.vehicle === 'etf' ? 'ETF-heavy' : 'stock-heavy'} · ${inp.concentration} (${holdings.filter((h) => h.sleeve === 'equity').length} equity positions).`,
        `Guardrails: ≤ ${singleMax}% per name, ≤ ${sectorCap}% per sector.`,
        `Split: ~${round1(equity)}% equities${bond > 0 ? `, ~${round1(bond)}% bonds` : ''}, ~${round1(cash)}% cash.`,
    ];

    const design = [
        `Equity sleeve (~${round1(equity)}%) carries the return engine; weights are score-ranked (core tier-1 names heaviest) then trimmed to the caps.`,
        bond > 0 ? `Bond sleeve (~${round1(bond)}%) adds ballast and lowers drawdown.` : `No bond sleeve — this archetype expresses risk through equities and cash only.`,
        `Cash (~${round1(cash)}%) is intentional dry powder, not leftover.`,
        `Style tilt: overweight ${cfg.favStyle.join(' / ')}; single-name cap ${singleMax}% and sector cap ${sectorCap}% stop any one bet from dominating.`,
    ];

    return {
        archetype: arch, mandate, design, holdings,
        equityPct: round1(equity), bondPct: round1(bond), cashPct: round1(100 - allocated),
        bySector, byRegion, risk: RISK_NOTES[arch], positions: holdings.filter((h) => h.sleeve === 'equity').length,
        singleNameMax: singleMax, sectorCap,
    };
}
