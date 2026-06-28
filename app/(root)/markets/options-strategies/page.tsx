import type { Metadata } from 'next';
import {
    BookOpen,
    Layers,
    Table2,
    SlidersHorizontal,
    Activity,
    AlertTriangle,
    HelpCircle,
    BookA,
    ShieldAlert,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Shield,
    Gauge,
    Zap,
} from 'lucide-react';
import DataDisclaimer from '@/components/DataDisclaimer';
import Collapsible from '@/components/common/Collapsible';
import StrategyExplorer from '@/components/options/StrategyExplorer';
import Simulator from '@/components/options/Simulator';
import Glossary from '@/components/options/Glossary';
import PayoffChart from '@/components/options/PayoffChart';
import { analyze } from '@/lib/options/payoff';
import { CONCEPTS, WHY_OPTIONS, GREEKS, MISTAKES, FAQ } from '@/lib/options/content';

export const metadata: Metadata = {
    title: 'Options Strategies | FeedCast Markets',
    description:
        'Master options trading with institutional-quality guides, strategy comparisons, payoff diagrams, the Greeks, and an interactive payoff simulator. Free, for investors of every level.',
};

const SCN = { spot: 100, vol: 0.3, days: 30, rate: 0.04 };
const callExample = analyze([{ type: 'call', dir: 'long', strike: 105, premium: 2 }], SCN);
const putExample = analyze([{ type: 'put', dir: 'long', strike: 95, premium: 2 }], SCN);

const NAV = [
    { href: '#overview', label: 'Overview' },
    { href: '#basics', label: 'Basics' },
    { href: '#strategies', label: 'Strategy Explorer' },
    { href: '#matrix', label: 'Matrix' },
    { href: '#greeks', label: 'Greeks' },
    { href: '#simulator', label: 'Simulator' },
    { href: '#faq', label: 'FAQ' },
    { href: '#glossary', label: 'Glossary' },
];

const WHY_ICONS = [TrendingUp, Shield, DollarSign, Zap, ShieldAlert, Gauge];

export default function OptionsStrategiesPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-8 p-4 md:p-8">
            {/* Hero */}
            <header id="overview" className="overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-teal-500/10 via-gray-900/40 to-gray-900/40 p-6 md:p-10">
                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-300">
                            <Layers size={12} /> Options Learning Center
                        </span>
                        <h1 className="mt-3 text-4xl font-bold text-gray-100 md:text-5xl">Options Strategies</h1>
                        <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-300">
                            Learn how options work, compare strategies, understand risk, and discover the right approach for
                            every market condition.
                        </p>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                            Options let you express directional opinions, hedge portfolios, generate income, and trade
                            volatility with flexible risk profiles — explore institutional-grade education for every level.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <Cta href="#strategies" primary>Explore Strategies</Cta>
                            <Cta href="#basics">Learn the Basics</Cta>
                            <Cta href="#matrix">Compare Strategies</Cta>
                            <Cta href="#simulator">Open Simulator</Cta>
                        </div>
                    </div>
                    <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-4">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Long call payoff</p>
                        <PayoffChart curve={callExample.curve} breakevens={callExample.breakevens} spot={100} height={190} />
                    </div>
                </div>
            </header>

            {/* Sticky in-page nav */}
            <nav className="sticky top-0 z-20 -mx-4 overflow-x-auto border-y border-gray-800 bg-gray-900/90 px-4 py-2 backdrop-blur md:-mx-8 md:px-8">
                <div className="flex gap-1.5">
                    {NAV.map((n) => (
                        <a key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-teal-300">
                            {n.label}
                        </a>
                    ))}
                </div>
            </nav>

            <DataDisclaimer className="w-fit" />

            {/* Basics */}
            <section id="basics" className="flex flex-col gap-5">
                <SectionTitle icon={<BookOpen className="text-teal-400" />} title="What are options?" />
                <p className="max-w-3xl text-sm leading-relaxed text-gray-400">
                    An option is a contract giving the buyer the <span className="text-gray-200">right — but not the obligation</span>{' '}
                    — to buy or sell an asset at a set price (the strike) before a set date (expiration). One US equity option
                    controls 100 shares.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                    <BasicCard
                        icon={<TrendingUp size={16} className="text-emerald-400" />}
                        title="Call Option"
                        blurb="The right to buy at the strike. Bought when you expect the price to rise."
                        rows={[['Stock', '$100'], ['Buy', '$105 call'], ['Premium', '$2 ($200)'], ['Break-even', '$107'], ['Max loss', '$200'], ['Upside', 'Unlimited']]}
                        curve={callExample.curve}
                        breakevens={callExample.breakevens}
                    />
                    <BasicCard
                        icon={<TrendingDown size={16} className="text-red-400" />}
                        title="Put Option"
                        blurb="The right to sell at the strike. Bought to profit from a decline or to hedge."
                        rows={[['Stock', '$100'], ['Buy', '$95 put'], ['Premium', '$2 ($200)'], ['Break-even', '$93'], ['Max loss', '$200'], ['Max profit', 'Down to $0']]}
                        curve={putExample.curve}
                        breakevens={putExample.breakevens}
                    />
                </div>

                {/* Key concepts */}
                <h3 className="mt-2 text-sm font-semibold text-gray-200">Key concepts</h3>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {CONCEPTS.map((c) => (
                        <div key={c.term} className="rounded-xl border border-gray-800 bg-gray-900/40 p-3.5">
                            <p className="text-sm font-semibold text-gray-100">{c.term}</p>
                            <p className="mt-1 text-xs leading-relaxed text-gray-400">{c.def}</p>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500"><span className="text-gray-400">Why: </span>{c.why}</p>
                            <p className="mt-1 text-[11px] italic leading-relaxed text-gray-600">{c.example}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why options */}
            <section className="flex flex-col gap-5">
                <SectionTitle icon={<Zap className="text-teal-400" />} title="Why investors use options" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {WHY_OPTIONS.map((w, i) => {
                        const Icon = WHY_ICONS[i] ?? Zap;
                        return (
                            <div key={w.title} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 transition-colors hover:border-teal-400/30">
                                <Icon size={18} className="text-teal-400" />
                                <h3 className="mt-2.5 font-semibold text-gray-100">{w.title}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-gray-400">{w.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Strategy explorer + matrix */}
            <section id="strategies" className="flex flex-col gap-5">
                <SectionTitle icon={<Table2 className="text-teal-400" />} title="Strategy Explorer" subtitle="Filter by market view, sort the matrix, and expand any strategy for its payoff, risks and Greeks." />
                <div id="matrix" className="scroll-mt-24">
                    <StrategyExplorer />
                </div>
            </section>

            {/* Greeks */}
            <section id="greeks" className="flex flex-col gap-5">
                <SectionTitle icon={<Activity className="text-teal-400" />} title="Understanding the Greeks" subtitle="The sensitivities that drive an option's price." />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {GREEKS.filter((g) => !g.advanced).map((g) => (
                        <div key={g.name} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                            <div className="flex items-center gap-2">
                                {g.symbol && <span className="text-lg font-bold text-teal-400">{g.symbol}</span>}
                                <h3 className="font-semibold text-gray-100">{g.name}</h3>
                                <span className="text-[11px] text-gray-500">{g.tagline}</span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-gray-400">{g.body}</p>
                            <p className="mt-1.5 text-[11px] italic text-gray-600">{g.example}</p>
                        </div>
                    ))}
                </div>
                <Collapsible className="rounded-xl border border-gray-800 bg-gray-900/40" header={<h3 className="text-sm font-semibold text-gray-200">Advanced (higher-order) Greeks</h3>}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {GREEKS.filter((g) => g.advanced).map((g) => (
                            <div key={g.name}>
                                <p className="text-sm font-semibold text-gray-200">{g.name} <span className="text-[11px] font-normal text-gray-500">— {g.tagline}</span></p>
                                <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{g.body}</p>
                            </div>
                        ))}
                    </div>
                </Collapsible>
            </section>

            {/* Simulator */}
            <section id="simulator" className="flex flex-col gap-5 scroll-mt-24">
                <SectionTitle icon={<SlidersHorizontal className="text-teal-400" />} title="Interactive payoff simulator" subtitle="Pick a strategy, dial in the inputs, and watch the payoff and Greeks update live." />
                <Simulator />
            </section>

            {/* Common mistakes */}
            <section className="flex flex-col gap-5">
                <SectionTitle icon={<AlertTriangle className="text-amber-400" />} title="Common mistakes" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {MISTAKES.map((m) => (
                        <div key={m.title} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                            <h3 className="text-sm font-semibold text-gray-100">{m.title}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-gray-400">{m.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="flex flex-col gap-3 scroll-mt-24">
                <SectionTitle icon={<HelpCircle className="text-teal-400" />} title="FAQ" />
                <div className="flex flex-col gap-2">
                    {FAQ.map((f) => (
                        <Collapsible key={f.q} className="rounded-xl border border-gray-800 bg-gray-900/40" header={<h3 className="text-sm font-semibold text-gray-200">{f.q}</h3>}>
                            <p className="text-sm leading-relaxed text-gray-400">{f.a}</p>
                        </Collapsible>
                    ))}
                </div>
            </section>

            {/* Glossary */}
            <section id="glossary" className="flex flex-col gap-4 scroll-mt-24">
                <SectionTitle icon={<BookA className="text-teal-400" />} title="Glossary" />
                <Glossary />
            </section>

            {/* Risk disclosure */}
            <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-gray-100">
                    <ShieldAlert size={16} className="text-amber-400" /> Risk disclosure
                </h2>
                <ul className="mt-2 flex flex-col gap-1 text-xs leading-relaxed text-gray-400">
                    <li>• Options involve substantial risk and are not suitable for all investors.</li>
                    <li>• Some strategies — especially selling uncovered (naked) options — carry large or theoretically unlimited losses.</li>
                    <li>• Time decay and changes in implied volatility can materially affect option prices.</li>
                    <li>• All examples, premiums and Greeks here are model estimates for education only — not live quotes.</li>
                    <li>• This content is educational and is <span className="text-gray-300">not investment advice</span>. Do your own research and consider a licensed advisor.</li>
                </ul>
            </section>
        </div>
    );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
    return (
        <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-100">
                {icon} {title}
            </h2>
            {subtitle && <p className="mt-1 max-w-3xl text-sm text-gray-400">{subtitle}</p>}
        </div>
    );
}

function Cta({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
    return (
        <a
            href={href}
            className={
                primary
                    ? 'rounded-lg bg-teal-500 px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-teal-400'
                    : 'rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-teal-400/40 hover:text-teal-300'
            }
        >
            {children}
        </a>
    );
}

function BasicCard({
    icon,
    title,
    blurb,
    rows,
    curve,
    breakevens,
}: {
    icon: React.ReactNode;
    title: string;
    blurb: string;
    rows: [string, string][];
    curve: [number, number][];
    breakevens: number[];
}) {
    return (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4 md:p-5">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-100">{icon} {title}</h3>
            <p className="mt-1 text-sm text-gray-400">{blurb}</p>
            <div className="mt-3"><PayoffChart curve={curve} breakevens={breakevens} spot={100} height={170} /></div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                {rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-gray-800/60 py-1">
                        <dt className="text-gray-500">{k}</dt>
                        <dd className="font-medium text-gray-200">{v}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
