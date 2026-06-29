import type { Metadata } from "next";
import TradingViewWidget from "@/components/TradingViewWidget";
import { Suspense } from "react";
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
import { getSupabaseServerClient } from '@/lib/supabase/server';
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
import CompanyScore from '@/components/stocks/CompanyScore';
import { getCompanyScore } from '@/lib/actions/company-score.actions';

/**
 * Per-stock SEO metadata. The page is public, so every company gets a unique
 * title/description/canonical for indexing. getCompanyProfile is cached, so
 * this shares the one upstream call the page already makes.
 */
export async function generateMetadata({ params }: StockDetailsPageProps): Promise<Metadata> {
    const { symbol } = await params;
    const sym = symbol.toUpperCase();
    const profile = await getCompanyProfile(symbol).catch(() => null);
    const name = profile?.name || sym;
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

export default async function StockDetails({ params }: StockDetailsPageProps) {
    const { symbol } = await params;
    const tvSymbol = formatSymbolForTradingView(symbol);
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const [sentimentInsights, profile, recommendationTrends, membership] = await Promise.all([
        getStockSentimentInsights(symbol),
        getCompanyProfile(symbol),
        getRecommendationTrends(symbol),
        user ? getGroupsWithMembership(symbol) : Promise.resolve({ groups: [], memberOf: [] }),
    ]);
    const companyName = profile?.name || symbol.toUpperCase();

    return (
        <div className="flex flex-col min-h-screen p-4 md:p-6 lg:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-white">{symbol.toUpperCase()}</h1>
                    {companyName !== symbol.toUpperCase() && (
                        <span className="text-sm text-gray-400">{companyName}</span>
                    )}
                </div>
                <WatchlistStar
                    symbol={symbol.toUpperCase()}
                    initialGroups={membership.groups}
                    initialMemberOf={membership.memberOf}
                    signedIn={!!user}
                />
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

                    <Suspense fallback={null}>
                        <TechSnapshot symbol={symbol.toUpperCase()} />
                    </Suspense>

                    <Suspense fallback={null}>
                        <StockNews symbol={symbol.toUpperCase()} />
                    </Suspense>
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <Suspense fallback={null}>
                        <CompanyBrief symbol={symbol.toUpperCase()} name={companyName} />
                    </Suspense>

                    <Suspense fallback={null}>
                        <CompanyScoreCard symbol={symbol.toUpperCase()} />
                    </Suspense>

                    <Suspense fallback={null}>
                        <PerformanceNote symbol={symbol.toUpperCase()} name={companyName} />
                    </Suspense>

                    <Suspense fallback={null}>
                        <Consensus symbol={symbol.toUpperCase()} name={companyName} />
                    </Suspense>

                    <Suspense fallback={null}>
                        <KeyStats symbol={symbol.toUpperCase()} />
                    </Suspense>

                    <AnalystRatings trends={recommendationTrends} />

                    <BullBear symbol={symbol.toUpperCase()} name={companyName} />

                    <Suspense fallback={null}>
                        <EarningsPanel symbol={symbol.toUpperCase()} />
                    </Suspense>

                    <Suspense fallback={null}>
                        <InsiderActivity symbol={symbol.toUpperCase()} />
                    </Suspense>

                    <Suspense fallback={null}>
                        <Peers symbol={symbol.toUpperCase()} />
                    </Suspense>

                    <StockSentimentCard insight={sentimentInsights} />

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
