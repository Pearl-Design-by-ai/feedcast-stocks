'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Bell,
    BellRing,
    Trash2,
    RotateCcw,
    Pause,
    Play,
    Plus,
    Loader2,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';
import {
    createAlert,
    deleteAlert,
    toggleAlert,
    reactivateAlert,
    getSymbolPrice,
} from '@/lib/actions/alert.actions';

export interface AlertItem {
    id: number;
    symbol: string;
    name: string | null;
    targetPrice: number;
    condition: 'ABOVE' | 'BELOW';
    active: boolean;
    triggered: boolean;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}

interface AlertsManagerProps {
    alerts: AlertItem[];
    /** Current price per symbol (uppercase), null when the quote failed. */
    prices: Record<string, number | null>;
    /** Symbols from the member's watchlists, to suggest in the create form. */
    suggestions: string[];
}

/** A live read of how far the price is from the trigger — makes "how it works" tangible. */
function distance(alert: AlertItem, price: number | null | undefined) {
    if (price == null) return { text: 'Live price unavailable', met: false, muted: true };
    const pct = ((alert.targetPrice - price) / price) * 100;
    const now = formatCurrency(price);
    if (alert.condition === 'ABOVE') {
        if (price >= alert.targetPrice)
            return { text: `Now ${now} — at or above target`, met: true, muted: false };
        return { text: `Now ${now} — needs to rise ${pct.toFixed(1)}% to hit ${formatCurrency(alert.targetPrice)}`, met: false, muted: false };
    }
    if (price <= alert.targetPrice)
        return { text: `Now ${now} — at or below target`, met: true, muted: false };
    return { text: `Now ${now} — needs to fall ${Math.abs(pct).toFixed(1)}% to hit ${formatCurrency(alert.targetPrice)}`, met: false, muted: false };
}

function StatusBadge({ alert }: { alert: AlertItem }) {
    if (alert.triggered)
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-green-400">
                <BellRing className="h-3 w-3" /> Triggered
            </span>
        );
    if (!alert.active)
        return (
            <span className="rounded-full bg-gray-700/60 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
                Paused
            </span>
        );
    return (
        <span className="rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-400/90">
            Active
        </span>
    );
}

export default function AlertsManager({ alerts, prices, suggestions }: AlertsManagerProps) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [actingId, setActingId] = useState<number | null>(null);

    // Create-form state
    const [symbol, setSymbol] = useState('');
    const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
    const [price, setPrice] = useState('');
    const [name, setName] = useState('');
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [quoting, setQuoting] = useState(false);

    // When the ticker settles, pull its live price and pre-fill the target so
    // the threshold can be set relative to where it trades now. Debounced, and
    // cancelled on each keystroke so partial tickers don't fire stale fetches.
    useEffect(() => {
        const sym = symbol.trim().toUpperCase();
        if (!sym) {
            setCurrentPrice(null);
            setQuoting(false);
            return;
        }
        let cancelled = false;
        setQuoting(true);
        const t = setTimeout(async () => {
            const p = await getSymbolPrice(sym);
            if (cancelled) return;
            setCurrentPrice(p);
            setQuoting(false);
            if (p != null) setPrice(p.toFixed(2));
        }, 450);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [symbol]);

    const { triggered, active, paused } = useMemo(() => {
        return {
            triggered: alerts.filter((a) => a.triggered),
            active: alerts.filter((a) => !a.triggered && a.active),
            paused: alerts.filter((a) => !a.triggered && !a.active),
        };
    }, [alerts]);

    const submitCreate = () =>
        start(async () => {
            const sym = symbol.trim().toUpperCase();
            const target = parseFloat(price);
            if (!sym) { toast.error('Enter a ticker symbol'); return; }
            if (!Number.isFinite(target) || target <= 0) { toast.error('Enter a target price above 0'); return; }
            try {
                await createAlert({ symbol: sym, targetPrice: target, condition, name: name.trim() || undefined });
                toast.success(`Alert set for ${sym}`);
                setSymbol('');
                setPrice('');
                setName('');
                router.refresh();
            } catch {
                toast.error('Could not create that alert');
            }
        });

    const run = (id: number, fn: () => Promise<unknown>, ok: string, err: string) =>
        start(async () => {
            setActingId(id);
            try {
                await fn();
                toast.success(ok);
                router.refresh();
            } catch {
                toast.error(err);
            } finally {
                setActingId(null);
            }
        });

    const renderCard = (alert: AlertItem) => {
        const d = distance(alert, prices[alert.symbol.toUpperCase()]);
        const busy = pending && actingId === alert.id;
        return (
            <div
                key={alert.id}
                className={cn(
                    'flex items-start justify-between gap-3 rounded-xl border p-3.5 transition-colors',
                    alert.triggered ? 'border-green-500/40 bg-green-500/[0.06]' : 'border-gray-800 bg-gray-900/50',
                    busy && 'opacity-50'
                )}
            >
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/stocks/${alert.symbol}`} className="font-bold text-gray-100 hover:text-teal-400">
                            {alert.symbol}
                        </Link>
                        <span
                            className={cn(
                                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                                alert.condition === 'ABOVE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            )}
                        >
                            {alert.condition === 'ABOVE' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                            {alert.condition === 'ABOVE' ? '≥' : '≤'} {formatCurrency(alert.targetPrice)}
                        </span>
                        <StatusBadge alert={alert} />
                    </div>
                    {alert.name && <p className="mt-1 truncate text-xs text-gray-400">{alert.name}</p>}
                    <p className={cn('mt-1.5 text-xs', d.met ? 'text-green-400' : d.muted ? 'text-gray-500' : 'text-gray-400')}>
                        {d.text}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    {alert.triggered && (
                        <button
                            type="button"
                            onClick={() => run(alert.id, () => reactivateAlert(alert.id), 'Alert re-armed', 'Could not re-arm')}
                            disabled={busy}
                            title="Re-arm to watch again"
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-green-400"
                        >
                            <RotateCcw size={15} />
                        </button>
                    )}
                    {!alert.triggered && (
                        <button
                            type="button"
                            onClick={() => run(alert.id, () => toggleAlert(alert.id, !alert.active), alert.active ? 'Alert paused' : 'Alert resumed', 'Could not update')}
                            disabled={busy}
                            title={alert.active ? 'Pause alert' : 'Resume alert'}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-yellow-400"
                        >
                            {alert.active ? <Pause size={15} /> : <Play size={15} />}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => run(alert.id, () => deleteAlert(alert.id), 'Alert deleted', 'Could not delete')}
                        disabled={busy}
                        title="Delete alert"
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                        {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                </div>
            </div>
        );
    };

    const section = (label: string, list: AlertItem[], tone: string) =>
        list.length > 0 && (
            <div>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span className={cn('h-2 w-2 rounded-full', tone)} /> {label}
                    <span className="text-gray-600">({list.length})</span>
                </h3>
                <div className="space-y-2">{list.map(renderCard)}</div>
            </div>
        );

    return (
        <div className="space-y-6">
            {/* How alerts work */}
            <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-100">
                    <Bell size={16} className="text-yellow-500" /> How price alerts work
                </h2>
                <ol className="mt-3 grid gap-3 text-sm text-gray-400 sm:grid-cols-2 lg:grid-cols-4">
                    <li className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                        <span className="font-semibold text-gray-200">1. Set a target.</span> Pick a stock, a price, and whether to fire when it rises above or falls below.
                    </li>
                    <li className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                        <span className="font-semibold text-gray-200">2. We watch it.</span> Live prices are checked about every 5 minutes during market hours.
                    </li>
                    <li className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                        <span className="font-semibold text-gray-200">3. You get pinged.</span> The moment your condition is met we email you and mark it <span className="text-green-400">Triggered</span> here.
                    </li>
                    <li className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
                        <span className="font-semibold text-gray-200">4. Re-arm or retire.</span> Alerts auto-expire after 90 days; re-arm a triggered one to watch again.
                    </li>
                </ol>
            </section>

            {/* Create an alert */}
            <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="mb-3 text-base font-semibold text-gray-100">New alert</h2>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Ticker</label>
                        <input
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            list="alert-symbol-suggestions"
                            placeholder="e.g. NVDA"
                            maxLength={12}
                            className="w-28 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-yellow-500/60 focus:outline-none"
                        />
                        <datalist id="alert-symbol-suggestions">
                            {suggestions.map((s) => (
                                <option key={s} value={s} />
                            ))}
                        </datalist>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">When price is</label>
                        <div className="inline-flex overflow-hidden rounded-lg border border-gray-700">
                            <button
                                type="button"
                                onClick={() => setCondition('ABOVE')}
                                className={cn('flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors', condition === 'ABOVE' ? 'bg-green-500/15 text-green-400' : 'bg-gray-800 text-gray-400 hover:text-gray-200')}
                            >
                                <ArrowUp size={14} /> Above
                            </button>
                            <button
                                type="button"
                                onClick={() => setCondition('BELOW')}
                                className={cn('flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors', condition === 'BELOW' ? 'bg-red-500/15 text-red-400' : 'bg-gray-800 text-gray-400 hover:text-gray-200')}
                            >
                                <ArrowDown size={14} /> Below
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Target price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitCreate()}
                                placeholder={currentPrice != null ? currentPrice.toFixed(2) : '140.00'}
                                className="w-32 rounded-lg border border-gray-700 bg-gray-800 py-2 pl-7 pr-3 text-sm text-gray-100 placeholder:text-gray-600 focus:border-yellow-500/60 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-1">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Label <span className="text-gray-600">(optional)</span></label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submitCreate()}
                            placeholder="e.g. Add on the dip"
                            maxLength={80}
                            className="min-w-0 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-yellow-500/60 focus:outline-none"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={submitCreate}
                        disabled={pending}
                        className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-yellow-400 disabled:opacity-50"
                    >
                        {pending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add alert
                    </button>
                </div>

                {symbol.trim() && (
                    <p className="mt-2.5 text-[11px] text-gray-500">
                        {quoting ? (
                            <span className="inline-flex items-center gap-1.5">
                                <Loader2 size={11} className="animate-spin" /> Fetching {symbol.trim().toUpperCase()} price…
                            </span>
                        ) : currentPrice != null ? (
                            <>
                                {symbol.trim().toUpperCase()} is trading around{' '}
                                <span className="font-semibold text-gray-300">{formatCurrency(currentPrice)}</span> now —
                                target pre-filled, adjust as you like.
                            </>
                        ) : (
                            <>Couldn&apos;t fetch a live price for {symbol.trim().toUpperCase()} — enter a target manually.</>
                        )}
                    </p>
                )}
            </section>

            {/* Existing alerts */}
            {alerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/30 p-10 text-center text-sm text-gray-500">
                    No alerts yet. Set your first one above, or add one straight from any{' '}
                    <Link href="/watchlist" className="text-teal-400 hover:underline">watchlist</Link> row.
                </div>
            ) : (
                <div className="space-y-6">
                    {section('Triggered', triggered, 'bg-green-400')}
                    {section('Active', active, 'bg-yellow-400')}
                    {section('Paused', paused, 'bg-gray-500')}
                </div>
            )}
        </div>
    );
}
