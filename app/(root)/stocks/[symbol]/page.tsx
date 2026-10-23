import type { Metadata } from "next";
import TradingViewWidget from "@/components/TradingViewWidget";
import { Suspense, cache } from "react";
import StockSentimentCard from "@/components/stocks/StockSentimentCard";
import AnalystRatings from "@/components/stocks/AnalystRatings";
import CompanyBrief from "@/components/stocks/CompanyBrief";
import PerformanceNote from "@/components/stocks/PerformanceNote";
import Consensus from "@/components/stocks/Consensus";
import BullBear from "@/components/stocks/BullBear";
import DataDisclaimer from "@/components/DataDisclaimer";
import {
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";

import { getStockSentimentInsights } from '@/lib/actions/adanos.actions';
import { getCompanyProfile } from '@/lib/actions/finnhub.actions';
import { getRecommendationTrends } from '@/lib/actions/stock-insights.actions';
import { getGroupsWithMembership } from '@/lib/actions/watchlist-groups.actions';
import { getCurrentUser } from '@/lib/supabase/server';
import WatchlistStar from '@/components/stocks/WatchlistStar';
import {
    KeyStats,
    EarningsPanel,
    Peers,
    InsiderActivity,
    StockNews,
    TechSnapshot,
} from '@/components/stocks/InsightPanels';
import { formatSymbolForTradingView } from '@/lib/utils';
import BackButton from '@/components/common/BackButton';
import CompanyScore from '@/components/stocks/CompanyScore';
import { getCompanyScore } from '@/lib/actions/company-score.actions';
import CardSkeleton from '@/components/stocks/CardSkeleton';

/**
 * Per-stock SEO metadata. The page is public, so every company gets a unique
 * title/description/canonical for indexing. Shares the page's (SWR-cached,
 * ≤2.5s) profile read; falls back to the bare ticker when it's slow.
 */
export async function generateMetadata({ params }: StockDetailsPageProps): Promise<Metadata> {
    const { symbol } = await params;
    const sym = symbol.toUpperCase();
    const name = await companyNameOf(symbol);
    const title = `${name} (${sym}) Stock`;
    const description = `${name} (${sym}) — live (delayed) price, charts, analyst ratings, key stats, news and AI insights on FeedCast Markets.`;
    return {
        title,
        description,
        alternates: { canonical: `/stocks/${sym}` },
        openGraph: { title: `${title} · FeedCast Markets`, description, url: `/stocks/${sym}`, type: 'website' },
    };
}

/** Lazily-loaded proprietary FeedCast Company Score card. */
async function CompanyScoreCard({ symbol }: { symbol: string }) {
    const data = await getCompanyScore(symbol);
    if (!data) return null;
    return <CompanyScore data={data} />;
}

// Per-request memo over the SWR-cached profile — the header, metadata and the
// AI cards all need the company name; this is one upstream read at most.
const profileOf = cache((symbol: string) => getCompanyProfile(symbol));
async function companyNameOf(symbol: string): Promise<string> {
    const profile = await profileOf(symbol).catch(() => null);
    return profile?.name || symbol.toUpperCase();
}

/*
 * Every upstream read on this page lives inside its own Suspense slot, so the
 * shell (title, disclaimer, TradingView embeds, skeletons) flushes without
 * waiting on Finnhub / Adanos / the engine / Supabase. Each read is SWR-cached
 * with a ≤2.5s cold-miss wait (lib/swr-cache.ts), so one slow upstream only
 * delays its own card — and a cold card fills in on the next view.
 */

async function CompanyName({ symbol }: { symbol: string }) {
    const name = await companyNameOf(symbol);
    if (name === symbol.toUpperCase()) return null;
    return <span className="text-sm text-gray-400">{name}</span>;
}

async function WatchlistControl({ symbol }: { symbol: string }) {
    const user = await getCurrentUser();
    const membership = user ? await getGroupsWithMembership(symbol) : { groups: [], memberOf: [] };
    return (
        <WatchlistStar
            symbol={symbol}
            initialGroups={membership.groups}
            initialMemberOf={membership.memberOf}
            signedIn={!!user}
        />
    );
}

async function AnalystRatingsCard({ symbol }: { symbol: string }) {
    return <AnalystRatings trends={await getRecommendationTrends(symbol)} />;
}

async function SentimentCard({ symbol }: { symbol: string }) {
    return <StockSentimentCard insight={await getStockSentimentInsights(symbol)} />;
}

async function CompanyBriefCard({ symbol }: { symbol: string }) {
    return <CompanyBrief symbol={symbol} name={await companyNameOf(symbol)} />;
}

async function PerformanceNoteCard({ symbol }: { symbol: string }) {
    return <PerformanceNote symbol={symbol} name={await companyNameOf(symbol)} />;
}

async function ConsensusCard({ symbol }: { symbol: string }) {
    return <Consensus symbol={symbol} name={await companyNameOf(symbol)} />;
}

async function BullBearCard({ symbol }: { symbol: string }) {
    return <BullBear symbol={symbol} name={await companyNameOf(symbol)} />;
}

export default async function StockDetails({ params }: StockDetailsPageProps) {
    const { symbol: rawSymbol } = await params;
    const symbol = rawSymbol.toUpperCase();
    const tvSymbol = formatSymbolForTradingView(rawSymbol);
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    return (
        <div className="flex flex-col min-h-screen p-4 md:p-6 lg:p-8">
            <BackButton fallback="/stocks" />
            <div className="mb-6 mt-3 flex items-start justify-between gap-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-white">{symbol}</h1>
                    <Suspense fallback={<span className="mt-1 h-4 w-32 rounded bg-gray-800 motion-safe:animate-pulse" />}>
                        <CompanyName symbol={symbol} />
                    </Suspense>
                </div>
                <Suspense fallback={<span aria-hidden="true" className="h-9 w-9 rounded-md bg-gray-800/60" />}>
                    <WatchlistControl symbol={symbol} />
                </Suspense>
            </div>
            <DataDisclaimer className="mb-6 w-fit" />
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Left column */}
                <div className="flex flex-col gap-6">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}symbol-info.js`}
                        config={SYMBOL_INFO_WIDGET_CONFIG(tvSymbol)}
                        height={170}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}advanced-chart.js`}
                        config={CANDLE_CHART_WIDGET_CONFIG(tvSymbol)}
                        className="custom-chart"
                        height={600}
                        allowExpand={true}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}advanced-chart.js`}
                        config={BASELINE_WIDGET_CONFIG(tvSymbol)}
                        className="custom-chart"
                        height={600}
                        allowExpand={true}
                    />

                    <Suspense fallback={<CardSkeleton lines={4} />}>
                        <TechSnapshot symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={6} />}>
                        <StockNews symbol={symbol} />
                    </Suspense>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <Suspense fallback={<CardSkeleton lines={3} />}>
                        <CompanyBriefCard symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={4} />}>
                        <CompanyScoreCard symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={3} />}>
                        <PerformanceNoteCard symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={5} />}>
                        <ConsensusCard symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={4} />}>
                        <KeyStats symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={2} />}>
                        <AnalystRatingsCard symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={2} />}>
                        <BullBearCard symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={2} />}>
                        <EarningsPanel symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={4} />}>
                        <InsiderActivity symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={1} />}>
                        <Peers symbol={symbol} />
                    </Suspense>

                    <Suspense fallback={<CardSkeleton lines={3} />}>
                        <SentimentCard symbol={symbol} />
                    </Suspense>

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}technical-analysis.js`}
                        config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(tvSymbol)}
                        height={400}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}company-profile.js`}
                        config={COMPANY_PROFILE_WIDGET_CONFIG(tvSymbol)}
                        height={440}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}financials.js`}
                        config={COMPANY_FINANCIALS_WIDGET_CONFIG(tvSymbol)}
                        height={800}
                    />
                </div>
            </section>
        </div>
    );
}
