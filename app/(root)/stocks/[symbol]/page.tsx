import TradingViewWidget from "@/components/TradingViewWidget";
import { Suspense } from "react";
import WatchlistButton from "@/components/WatchlistButton";
import StockSentimentCard from "@/components/stocks/StockSentimentCard";
import AnalystRatings from "@/components/stocks/AnalystRatings";
import CompanyBrief from "@/components/stocks/CompanyBrief";
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

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isStockInWatchlist } from '@/lib/actions/watchlist.actions';
import { getStockSentimentInsights } from '@/lib/actions/adanos.actions';
import { getCompanyProfile } from '@/lib/actions/finnhub.actions';
import { getRecommendationTrends } from '@/lib/actions/stock-insights.actions';
import { formatSymbolForTradingView } from '@/lib/utils';

export default async function StockDetails({ params }: StockDetailsPageProps) {
    const { symbol } = await params;
    const tvSymbol = formatSymbolForTradingView(symbol);
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    const [isInWatchlist, sentimentInsights, profile, recommendationTrends] = await Promise.all([
        userId ? isStockInWatchlist(userId, symbol) : Promise.resolve(false),
        getStockSentimentInsights(symbol),
        getCompanyProfile(symbol),
        getRecommendationTrends(symbol),
    ]);
    const companyName = profile?.name || symbol.toUpperCase();

    return (
        <div className="flex flex-col min-h-screen p-4 md:p-6 lg:p-8">
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
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <WatchlistButton
                            symbol={symbol.toUpperCase()}
                            company={companyName}
                            isInWatchlist={isInWatchlist}
                            userId={userId}
                        />
                    </div>

                    <Suspense fallback={null}>
                        <CompanyBrief symbol={symbol.toUpperCase()} name={companyName} />
                    </Suspense>

                    <AnalystRatings trends={recommendationTrends} />

                    <BullBear symbol={symbol.toUpperCase()} name={companyName} />

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
