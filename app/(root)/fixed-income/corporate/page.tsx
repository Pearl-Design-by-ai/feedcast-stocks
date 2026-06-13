import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import FixedIncomeTabs from '@/components/fixed-income/FixedIncomeTabs';
import CreditStress from '@/components/fixed-income/CreditStress';
import ReturnsTable from '@/components/markets/ReturnsTable';
import {
    IG_USD,
    IG_EUR,
    HY_USD,
    HY_EUR,
    EM_AGGREGATE,
    EM_COUNTRIES,
    BUCKET_TONE,
    CREDIT_SOURCES,
    type CreditEtf,
} from '@/lib/fixed-income-credit';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
    title: 'Corporate & Global Credit',
    description:
        'Investment-grade and high-yield bond selections in USD and EUR, eurobonds, and an emerging-market sovereign map by country — with live ETF returns and a credit-stress read.',
};

const TONE_CHIP: Record<'pos' | 'warn' | 'neg', string> = {
    pos: 'bg-emerald-400/10 text-emerald-400',
    warn: 'bg-amber-400/10 text-amber-400',
    neg: 'bg-red-400/10 text-red-400',
};

const rows = (etfs: CreditEtf[]) => etfs.map((e) => ({ symbol: e.symbol, label: `${e.name} (${e.code})` }));

function CcyBadge({ ccy }: { ccy: 'USD' | 'EUR' }) {
    return (
        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', ccy === 'USD' ? 'bg-sky-400/10 text-sky-400' : 'bg-violet-400/10 text-violet-400')}>
            {ccy}
        </span>
    );
}

function Selection({
    title,
    blurb,
    usd,
    eur,
}: {
    title: string;
    blurb: string;
    usd: CreditEtf[];
    eur: CreditEtf[];
}) {
    return (
        <section className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <div>
                <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
                <p className="mt-0.5 text-sm text-gray-400">{blurb}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                        <CcyBadge ccy="USD" /> US-dollar funds
                    </p>
                    <Suspense fallback={<Skeleton />}>
                        <ReturnsTable rows={rows(usd)} />
                    </Suspense>
                </div>
                <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                        <CcyBadge ccy="EUR" /> Euro-denominated (UCITS)
                    </p>
                    <Suspense fallback={<Skeleton />}>
                        <ReturnsTable rows={rows(eur)} />
                    </Suspense>
                    <p className="mt-2 text-[11px] text-gray-600">
                        EUR funds are UCITS listed in Europe and priced in euros; returns shown are
                        price returns and may reflect FX. Some feeds lag — “—” means unavailable.
                    </p>
                </div>
            </div>
        </section>
    );
}

function Skeleton() {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin text-teal-400" /> Loading returns…
        </div>
    );
}

export default function CorporateCreditPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Corporate &amp; Global Credit</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Investment-grade and high-yield selections in both US dollars and euros,
                        eurobonds, and an emerging-market sovereign map organized by country — with
                        live ETF returns and a credit-stress read derived from real prices.
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>

            <FixedIncomeTabs active="/fixed-income/corporate" />

            <Suspense fallback={null}>
                <CreditStress />
            </Suspense>

            <Selection
                title="Investment Grade"
                blurb="Bonds of financially strong governments and companies — modest credit risk, steadier income, the core ballast of a bond sleeve."
                usd={IG_USD}
                eur={IG_EUR}
            />

            <Selection
                title="High Yield"
                blurb="“Junk” credit — higher coupons to compensate for higher default risk. Spreads widen fast in stress, so size and timing matter."
                usd={HY_USD}
                eur={HY_EUR}
            />

            {/* Eurobonds explainer */}
            <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <h2 className="text-lg font-semibold text-gray-100">What’s a eurobond?</h2>
                <div className="mt-2 grid grid-cols-1 gap-4 text-sm leading-relaxed text-gray-400 md:grid-cols-2">
                    <p>
                        A <strong className="text-gray-200">eurobond</strong> is a bond issued in a
                        currency other than that of the country where it’s sold — e.g. a Brazilian or
                        Turkish government borrowing in <strong className="text-gray-200">US dollars</strong>,
                        or a US company issuing in <strong className="text-gray-200">euros</strong>.
                        “Euro” here means <em>external</em>, not the euro currency.
                    </p>
                    <p>
                        For an investor, the key split is the <strong className="text-gray-200">denomination
                        currency</strong>: a USD eurobond carries no local-FX risk (you’re paid back in
                        dollars), while local-currency debt adds the issuer’s exchange-rate swings on top
                        of credit risk. The selections above are the practical USD and EUR vehicles.
                    </p>
                </div>
            </section>

            {/* EM by country */}
            <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-100">Emerging Markets — by country</h2>
                    <span className="text-[11px] text-gray-500">Hard-currency sovereign issuers · mid-2026 reference</span>
                </div>
                <p className="mb-4 text-sm text-gray-400">
                    Most single-country eurobonds aren’t individually tradeable on free feeds, so the
                    access vehicles are the aggregate ETFs below. This map shows where the major USD
                    sovereign issuers sit by rating and the 2026 story for each.
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                <th className="px-3 py-2">Country</th>
                                <th className="px-3 py-2">Region</th>
                                <th className="px-3 py-2">Rating bucket</th>
                                <th className="px-3 py-2">2026 read</th>
                            </tr>
                        </thead>
                        <tbody>
                            {EM_COUNTRIES.map((c) => (
                                <tr key={c.country} className="border-b border-gray-800/60 align-top">
                                    <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-100">
                                        <span className="mr-1.5">{c.flag}</span>
                                        {c.country}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-400">{c.region}</td>
                                    <td className="whitespace-nowrap px-3 py-2.5">
                                        <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-semibold', TONE_CHIP[BUCKET_TONE[c.bucket]])}>
                                            {c.bucket}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-xs leading-relaxed text-gray-400">{c.note}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">EM access vehicles — live returns</p>
                    <Suspense fallback={<Skeleton />}>
                        <ReturnsTable rows={rows(EM_AGGREGATE)} />
                    </Suspense>
                </div>
            </section>

            {/* Sources + disclaimer */}
            <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
                <p className="text-[11px] leading-relaxed text-gray-500">
                    Curated reference and educational context — <strong>not investment advice</strong>,
                    and not a recommendation to buy any specific bond or fund. Ratings buckets are
                    approximate. Returns are EOD approximations and update about once per trading day.
                </p>
                <div className="mt-3 border-t border-gray-800 pt-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Research sources</p>
                    <ul className="flex flex-col gap-1.5">
                        {CREDIT_SOURCES.map((s) => (
                            <li key={s.url}>
                                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:underline">
                                    {s.label}
                                    <ExternalLink size={11} />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    );
}
