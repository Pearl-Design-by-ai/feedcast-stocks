/** Display formatting for /my-portfolio. Money in USD, dates in Istanbul time. */

const usdFull = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function fmtUsd(n: number | null | undefined): string {
    if (n == null || !Number.isFinite(n)) return '—';
    return usdFull.format(n);
}

/** $2.52M / $350k / $900 — for KPIs, chart axes and tight columns. */
export function fmtUsdShort(n: number | null | undefined): string {
    if (n == null || !Number.isFinite(n)) return '—';
    const a = Math.abs(n);
    const sign = n < 0 ? '−' : '';
    if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
    if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}k`;
    return `${sign}$${a.toFixed(0)}`;
}

export function fmtSignedUsd(n: number): string {
    if (!Number.isFinite(n) || n === 0) return fmtUsdShort(0);
    return `${n > 0 ? '+' : ''}${fmtUsdShort(n)}`;
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
    if (n == null || !Number.isFinite(n)) return '—';
    return `${n < 0 ? '−' : ''}%${Math.abs(n).toFixed(digits)}`;
}

/** A 0..1 share as a Turkish-style percent: %32.7 */
export const fmtShare = (share: number) => fmtPct(share * 100);

export function fmtNum(n: number | null | undefined, digits = 0): string {
    if (n == null || !Number.isFinite(n)) return '—';
    return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: 'short', year: 'numeric' });
}

export const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/** Human labels for the leverage variants used in drawdown/scenario payloads. */
const VARIANT_LABELS: Record<string, string> = {
    unlevered: 'Kaldıraçsız',
    margin1m: 'Marj 1M',
    margin2m: 'Marj 2M',
};
export const variantLabel = (k: string) => VARIANT_LABELS[k] ?? k;
