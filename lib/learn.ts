/**
 * Learn — a self-contained financial-education library. Content is evergreen
 * and written in-house (no live data, nothing fabricated), organized by
 * category, with cross-links into FeedCast's live tools so reading flows into
 * doing. Rendered by /learn (hub) and /learn/[slug] (article).
 */

import type { LucideIcon } from 'lucide-react';
import {
    GraduationCap,
    Landmark,
    LayoutGrid,
    Coins,
    Receipt,
    ShieldAlert,
} from 'lucide-react';

export type CategoryId = 'basics' | 'economics' | 'etfs' | 'dividends' | 'bonds' | 'risk';

export interface Category {
    id: CategoryId;
    label: string;
    blurb: string;
    icon: LucideIcon;
    /** Static accent classes — one identity per category. */
    text: string;
    chip: string;
    grad: string; // gradient for the card/hero icon tile
    dot: string; // solid accent for list markers
}

export const CATEGORIES: Category[] = [
    {
        id: 'basics',
        label: 'Investing Basics',
        blurb: 'The foundations every investor should own.',
        icon: GraduationCap,
        text: 'text-teal-400',
        chip: 'bg-teal-400/10 text-teal-400',
        grad: 'from-teal-500/30 to-teal-500/5',
        dot: 'bg-teal-400',
    },
    {
        id: 'economics',
        label: 'Economics & Macro',
        blurb: 'Recessions, inflation, the Fed — the big forces.',
        icon: Landmark,
        text: 'text-amber-400',
        chip: 'bg-amber-400/10 text-amber-400',
        grad: 'from-amber-500/30 to-amber-500/5',
        dot: 'bg-amber-400',
    },
    {
        id: 'etfs',
        label: 'ETFs & Funds',
        blurb: 'Funds, index investing and what you really pay.',
        icon: LayoutGrid,
        text: 'text-sky-400',
        chip: 'bg-sky-400/10 text-sky-400',
        grad: 'from-sky-500/30 to-sky-500/5',
        dot: 'bg-sky-400',
    },
    {
        id: 'dividends',
        label: 'Dividends & Income',
        blurb: 'Getting paid to hold — yield, growth, payout.',
        icon: Coins,
        text: 'text-emerald-400',
        chip: 'bg-emerald-400/10 text-emerald-400',
        grad: 'from-emerald-500/30 to-emerald-500/5',
        dot: 'bg-emerald-400',
    },
    {
        id: 'bonds',
        label: 'Bonds & Rates',
        blurb: 'Fixed income, duration and the price-yield seesaw.',
        icon: Receipt,
        text: 'text-violet-400',
        chip: 'bg-violet-400/10 text-violet-400',
        grad: 'from-violet-500/30 to-violet-500/5',
        dot: 'bg-violet-400',
    },
    {
        id: 'risk',
        label: 'Risk & Strategy',
        blurb: 'Bubbles, position sizing and surviving drawdowns.',
        icon: ShieldAlert,
        text: 'text-rose-400',
        chip: 'bg-rose-400/10 text-rose-400',
        grad: 'from-rose-500/30 to-rose-500/5',
        dot: 'bg-rose-400',
    },
];

export function getCategory(id: CategoryId): Category {
    return CATEGORIES.find((c) => c.id === id)!;
}

export type Block =
    | { k: 'p'; text: string }
    | { k: 'h'; text: string }
    | { k: 'list'; items: string[] }
    | { k: 'note'; title: string; text: string };

export interface RelatedTool {
    label: string;
    href: string;
}

export interface Article {
    slug: string;
    title: string;
    category: CategoryId;
    excerpt: string;
    readMin: number;
    body: Block[];
    takeaways: string[];
    /** Links into FeedCast's live tools, so reading flows into doing. */
    tools?: RelatedTool[];
}

export const ARTICLES: Article[] = [
    {
        slug: 'economic-recessions',
        title: 'A Guide to Economic Recessions',
        category: 'economics',
        excerpt:
            'A recession is a broad, sustained decline in economic activity. Here’s how they start, how they’re called, and what they mean for your portfolio.',
        readMin: 6,
        body: [
            { k: 'p', text: 'A recession is a significant, widespread and sustained decline in economic activity. The popular shorthand is “two consecutive quarters of falling GDP,” but the official US arbiter — the National Bureau of Economic Research (NBER) — looks wider: real income, employment, industrial production and spending, not just GDP.' },
            { k: 'h', text: 'What causes them' },
            { k: 'p', text: 'Recessions usually arrive when something tips a late-cycle economy off balance: an aggressive interest-rate hiking campaign to fight inflation, a financial shock (2008), an external shock (an oil spike or a pandemic), or simply the unwinding of an asset bubble that pulled spending forward.' },
            { k: 'list', items: [
                'Monetary tightening — rates rise until something breaks.',
                'Credit crunch — lending freezes, investment and hiring stall.',
                'Shocks — wars, pandemics, commodity spikes.',
                'Bubbles deflating — wealth evaporates, spending contracts.',
            ] },
            { k: 'h', text: 'What it means for markets' },
            { k: 'p', text: 'Stocks usually fall before the recession is official and bottom before it ends — the market is a forward-looking discounting machine. Defensive sectors (staples, utilities, healthcare) and high-quality bonds tend to hold up better, while cyclicals and high-debt companies suffer most.' },
            { k: 'note', title: 'The investor’s edge', text: 'You can’t reliably time the exact bottom, but you can prepare: hold an emergency cash buffer, keep quality high, and treat deep drawdowns as the market putting good assets on sale for long-horizon buyers.' },
        ],
        takeaways: [
            'A recession is a broad, sustained drop across income, jobs, production and spending — not just two down GDP quarters.',
            'Most are triggered by rate hikes, credit crunches, shocks or deflating bubbles.',
            'Markets lead the economy: they fall early and recover before the data does.',
            'Quality and defensives cushion the blow; leverage and cyclicality amplify it.',
        ],
        tools: [
            { label: 'Check the current Market Regime', href: '/market-regime' },
            { label: 'Ask the Markets about risk', href: '/ask' },
        ],
    },
    {
        slug: 'inflation-explained',
        title: 'Inflation: What It Is and How It Erodes Returns',
        category: 'economics',
        excerpt:
            'Inflation is the rate at which prices rise and money loses purchasing power. Understand the drivers, the cures and how to protect a portfolio.',
        readMin: 6,
        body: [
            { k: 'p', text: 'Inflation is the rate at which the general price level rises, which means each unit of currency buys a little less over time. A steady 2% is healthy; runaway double-digit inflation is corrosive, and outright deflation (falling prices) can be just as dangerous.' },
            { k: 'h', text: 'Demand-pull vs. cost-push' },
            { k: 'list', items: [
                'Demand-pull: too much money chasing too few goods — a hot economy, stimulus, easy credit.',
                'Cost-push: input costs jump — energy spikes, supply-chain breaks, wage spirals.',
                'Expectations: if people expect higher prices, they act in ways that create them.',
            ] },
            { k: 'h', text: 'How it’s fought' },
            { k: 'p', text: 'Central banks raise interest rates to cool demand and tighten money. Higher rates slow borrowing and spending — and often the economy with it, which is why inflation fights sometimes end in recessions.' },
            { k: 'h', text: 'Protecting a portfolio' },
            { k: 'p', text: 'Cash is the biggest loser to inflation. Historically, equities (real businesses that can raise prices), TIPS (inflation-linked bonds whose principal adjusts), real assets and sometimes commodities or gold offer more protection than nominal cash and long fixed-rate bonds.' },
            { k: 'note', title: 'Real vs. nominal', text: 'Always think in real (after-inflation) terms. A 5% return when inflation is 6% is a 1% loss of purchasing power, even though the number is positive.' },
        ],
        takeaways: [
            'Inflation steadily erodes the purchasing power of cash and fixed payments.',
            'It comes from excess demand, rising costs, or self-fulfilling expectations.',
            'Central banks fight it with higher rates — sometimes at the cost of growth.',
            'TIPS, equities and real assets historically protect better than cash.',
        ],
        tools: [
            { label: 'TIPS & inflation-protected bonds', href: '/fixed-income' },
            { label: 'Commodities & gold', href: '/commodities' },
        ],
    },
    {
        slug: 'stagflation',
        title: 'Stagflation: Definition, Causes & Consequences',
        category: 'economics',
        excerpt:
            'The worst of both worlds — stagnant growth and high unemployment alongside stubborn inflation. Why it’s so hard to fight.',
        readMin: 5,
        body: [
            { k: 'p', text: 'Stagflation is the rare, painful combination of stagnant growth (and high unemployment) with persistent inflation. It breaks the usual playbook: normally weak growth cools prices, so policymakers can cut rates to help. In stagflation, cutting rates feeds inflation and raising rates deepens the slump.' },
            { k: 'h', text: 'Why it happens' },
            { k: 'p', text: 'The classic trigger is a supply shock — the 1970s oil embargoes are the textbook case. Costs surge across the economy even as output falls. Loose policy and wage-price spirals can entrench it.' },
            { k: 'h', text: 'Why it’s so hard to escape' },
            { k: 'p', text: 'Central banks face a genuine dilemma with no clean tool: every lever helps one problem and worsens the other. Escaping usually requires painful, sustained tight policy to break inflation expectations — the Volcker era in the early 1980s.' },
            { k: 'note', title: 'For investors', text: 'Stagflation is historically tough for both stocks and bonds at once. Real assets, commodities, value and pricing-power businesses have tended to fare relatively better.' },
        ],
        takeaways: [
            'Stagflation = weak growth + high unemployment + high inflation, all together.',
            'It’s usually born from a supply shock, then entrenched by expectations.',
            'Policymakers have no clean fix — every tool helps one side and hurts the other.',
            'Both stocks and bonds can struggle; real assets and pricing power help.',
        ],
        tools: [{ label: 'Read the current regime', href: '/market-regime' }],
    },
    {
        slug: 'quantitative-easing',
        title: 'Quantitative Easing & Tightening Explained',
        category: 'economics',
        excerpt:
            'When rates are already near zero, central banks turn to QE — buying bonds to push money into the system. Here’s how it works, and what reversing it does.',
        readMin: 5,
        body: [
            { k: 'p', text: 'Quantitative easing (QE) is an unconventional tool central banks use when short-term rates are already near zero and they want to ease further. The bank creates new reserves and buys longer-dated bonds, pushing their prices up and yields down, and pumping liquidity into the financial system.' },
            { k: 'h', text: 'What it’s meant to do' },
            { k: 'list', items: [
                'Lower long-term borrowing costs (mortgages, corporate debt).',
                'Push investors out of safe bonds into riskier assets — the “portfolio balance” effect.',
                'Signal that policy will stay easy, supporting confidence.',
            ] },
            { k: 'h', text: 'Quantitative tightening (QT)' },
            { k: 'p', text: 'QT is the reverse: the bank lets bonds mature without replacing them (or sells them), shrinking its balance sheet and draining liquidity. It tends to push yields up and acts as a headwind for risk assets — a slow, quiet form of tightening that runs alongside rate policy.' },
            { k: 'note', title: 'Why markets watch it', text: 'QE has coincided with strong bull markets in stocks; QT removes that tailwind. “Don’t fight the Fed” cuts both ways — easing supports prices, tightening pressures them.' },
        ],
        takeaways: [
            'QE = a central bank creating money to buy bonds, lowering long yields and adding liquidity.',
            'It pushes investors toward riskier assets and supports prices.',
            'QT reverses it — shrinking the balance sheet drains liquidity and lifts yields.',
            'Liquidity direction is a major backdrop for risk assets.',
        ],
    },
    {
        slug: 'fed-interest-rates',
        title: 'How the Fed Sets Interest Rates — and Why Markets Care',
        category: 'economics',
        excerpt:
            'The federal funds rate is the most important number in finance. Understand the dual mandate, the transmission to markets, and why one rate moves everything.',
        readMin: 6,
        body: [
            { k: 'p', text: 'The Federal Reserve sets a target for the federal funds rate — the overnight rate banks charge each other. It’s a single short-term rate, but it ripples through every loan, bond and valuation in the economy. The Fed adjusts it to pursue its dual mandate: stable prices and maximum employment.' },
            { k: 'h', text: 'The transmission' },
            { k: 'list', items: [
                'Higher rates → costlier borrowing → slower spending and investment → cooler inflation.',
                'Higher rates also raise the “discount rate” on future profits, which lowers what investors will pay for growth stocks today.',
                'Bonds reprice instantly: when rates rise, existing bond prices fall.',
            ] },
            { k: 'h', text: 'Why every word matters' },
            { k: 'p', text: 'Markets price the future, so they move on the expected path of rates, not just today’s level. That’s why the Fed’s statements, the “dot plot,” and the Chair’s tone can move trillions in seconds — they reshape expectations.' },
            { k: 'note', title: 'Rates and valuation', text: 'When the “risk-free” rate is 5%, every risky asset must clear a higher bar. That’s why rising rates pressure expensive, long-duration growth stocks the most.' },
        ],
        takeaways: [
            'The fed funds rate is one overnight rate that anchors all other borrowing costs.',
            'The Fed moves it to balance inflation and employment — its dual mandate.',
            'Higher rates cool the economy and lower the present value of future profits.',
            'Markets trade the expected path of rates, so guidance matters as much as the move.',
        ],
        tools: [
            { label: 'Treasury yields & the curve', href: '/fixed-income' },
            { label: 'Economic calendar', href: '/economic-calendar' },
        ],
    },
    {
        slug: 'yield-curve',
        title: 'The Yield Curve and What Inversion Signals',
        category: 'economics',
        excerpt:
            'Plot bond yields across maturities and you get the yield curve — one of the most-watched recession indicators in finance.',
        readMin: 5,
        body: [
            { k: 'p', text: 'The yield curve plots the yields of bonds (usually US Treasuries) from short to long maturities. Its shape is a real-time poll of what the bond market expects from growth, inflation and Fed policy.' },
            { k: 'h', text: 'Reading the shape' },
            { k: 'list', items: [
                'Normal (upward-sloping): long yields above short — healthy expansion, term premium intact.',
                'Flat: the market is unsure; a transition signal.',
                'Inverted: short yields above long — the market expects rate cuts because growth is slowing.',
            ] },
            { k: 'h', text: 'Why inversion gets attention' },
            { k: 'p', text: 'A persistent inversion of the 10-year minus 2-year (or 10-year minus 3-month) spread has preceded most modern US recessions, typically by several months to two years. It’s a warning, not a stopwatch — and the re-steepening after a deep inversion has often been the more immediate recession tell.' },
            { k: 'note', title: 'Not a timing tool', text: 'Inversions have produced false alarms and long lead times. Treat the curve as one input in a regime read, not a trade trigger.' },
        ],
        takeaways: [
            'The yield curve maps bond yields across maturities — a market forecast of growth and rates.',
            'Upward slope = healthy; inverted (short > long) = expected slowdown.',
            '10y–2y inversion has preceded most US recessions, with a long, variable lead.',
            'Use it as a signal in context, never as a precise timer.',
        ],
        tools: [{ label: 'See the live curve & spreads', href: '/fixed-income' }],
    },
    {
        slug: 'risk-vs-reward',
        title: 'Risk vs. Reward: The Core Tradeoff',
        category: 'basics',
        excerpt:
            'There’s no return without risk. Understanding the tradeoff — and the difference between volatility and permanent loss — is the start of investing well.',
        readMin: 5,
        body: [
            { k: 'p', text: 'Every investment return is compensation for bearing some risk. Cash is nearly risk-free and pays little; stocks swing hard and have paid the most over long horizons. The central job of an investor isn’t to avoid risk — it’s to take the right risks at the right price.' },
            { k: 'h', text: 'Two very different “risks”' },
            { k: 'list', items: [
                'Volatility — prices bounce around. Uncomfortable, but temporary and survivable if your time horizon is long.',
                'Permanent loss of capital — the business fails, the bubble bursts, you’re forced to sell at the bottom. This is the one that actually matters.',
            ] },
            { k: 'h', text: 'Risk-adjusted thinking' },
            { k: 'p', text: 'A higher return earned by taking wildly more risk isn’t obviously better. Professionals judge returns per unit of risk (ratios like Sharpe). The goal is durable compounding, not the biggest single year.' },
            { k: 'note', title: 'Time is the great risk-reducer', text: 'Over one year stocks are a coin-flip; over 15–20 years their range of outcomes narrows dramatically. A long horizon turns volatility from an enemy into an opportunity.' },
        ],
        takeaways: [
            'Return is the reward for risk — the skill is choosing which risks, at what price.',
            'Volatility (temporary) is very different from permanent loss (what to avoid).',
            'Judge returns per unit of risk, not in isolation.',
            'A long time horizon shrinks the danger of volatility.',
        ],
    },
    {
        slug: 'diversification',
        title: 'Diversification & Asset Allocation',
        category: 'basics',
        excerpt:
            'The only “free lunch” in investing — spreading bets across assets that don’t move together lowers risk without necessarily lowering return.',
        readMin: 5,
        body: [
            { k: 'p', text: 'Diversification means owning a mix of investments that don’t all rise and fall together. When holdings are imperfectly correlated, the portfolio’s ups and downs partly cancel out — reducing risk without proportionally reducing expected return. It’s the closest thing investing has to a free lunch.' },
            { k: 'h', text: 'Asset allocation does the heavy lifting' },
            { k: 'p', text: 'Studies consistently find that the split across asset classes — stocks, bonds, cash, real assets — explains most of a portfolio’s risk and return over time, far more than individual stock picks. Get the allocation right first.' },
            { k: 'list', items: [
                'Across asset classes: stocks vs. bonds vs. cash vs. real assets.',
                'Within stocks: sectors, sizes, geographies, styles.',
                'Across time: rebalancing back to targets sells high and buys low automatically.',
            ] },
            { k: 'note', title: 'Diversification has limits', text: 'In a panic, correlations can jump toward 1 — nearly everything falls together for a while. Diversification reduces risk; it doesn’t abolish it.' },
        ],
        takeaways: [
            'Combining uncorrelated assets lowers risk without a matching cut to return.',
            'Asset allocation drives most of long-run risk and return — set it first.',
            'Diversify across classes, within stocks, and rebalance over time.',
            'Correlations spike in crises, so it’s a cushion, not a force field.',
        ],
        tools: [
            { label: 'Sector heat & rotation', href: '/sectors' },
            { label: 'Build a watchlist', href: '/watchlist' },
        ],
    },
    {
        slug: 'bull-and-bear-markets',
        title: 'Bull & Bear Markets (and Bear Traps)',
        category: 'basics',
        excerpt:
            'A bull market climbs; a bear market falls 20%+. Knowing the rhythm — and the head-fakes — keeps you from selling bottoms and chasing tops.',
        readMin: 5,
        body: [
            { k: 'p', text: 'A bull market is a sustained rise in prices and optimism; a bear market is conventionally a decline of 20% or more from a recent peak. Both can last from months to years, and both feel permanent while you’re in them — which is exactly the trap.' },
            { k: 'h', text: 'The emotional cycle' },
            { k: 'p', text: 'Bull markets climb a “wall of worry” and end in euphoria; bear markets fall through denial and end in capitulation. The best long-term opportunities usually appear when sentiment is bleakest, and the biggest risks build when everyone is sure it only goes up.' },
            { k: 'h', text: 'Bear traps' },
            { k: 'p', text: 'A bear trap is a false reversal — a sharp bounce in a downtrend (or a brief drop in an uptrend) that lures traders into the wrong side before the original trend resumes. Sharp “rip your face off” rallies are actually characteristic of bear markets, not proof they’re over.' },
            { k: 'note', title: 'Don’t trade the head-fake', text: 'Confirm trend changes with breadth and follow-through, not a single dramatic candle. One green day is not a new bull market.' },
        ],
        takeaways: [
            'Bull = sustained rise; bear = a 20%+ drop from the peak.',
            'Sentiment peaks at tops and bottoms — best buys feel worst.',
            'Bear traps are false reversals; violent rallies are common within bear markets.',
            'Confirm turns with breadth and follow-through, not one big day.',
        ],
        tools: [{ label: 'Trend & breadth in Market Regime', href: '/market-regime' }],
    },
    {
        slug: 'etfs-vs-mutual-funds',
        title: 'ETFs vs. Mutual Funds',
        category: 'etfs',
        excerpt:
            'Both pool money to buy a basket of assets — but how they trade, what they cost, and how they’re taxed differ in ways that matter.',
        readMin: 5,
        body: [
            { k: 'p', text: 'Both ETFs (exchange-traded funds) and mutual funds let you buy a diversified basket in a single ticket. The differences are mechanical but meaningful for cost and convenience.' },
            { k: 'h', text: 'Key differences' },
            { k: 'list', items: [
                'Trading: ETFs trade all day on an exchange like a stock; mutual funds price once daily after the close.',
                'Cost: ETFs (especially index ETFs) usually carry lower expense ratios and no sales loads.',
                'Tax: ETFs’ “in-kind” creation/redemption mechanism typically generates fewer taxable capital-gains distributions.',
                'Minimums: ETFs cost the price of one share; many mutual funds require a minimum investment.',
            ] },
            { k: 'h', text: 'When a mutual fund still fits' },
            { k: 'p', text: 'Automatic recurring investments in exact dollar amounts, certain active strategies, and some retirement-plan menus still favor mutual funds. For most index exposure, low-cost ETFs are hard to beat.' },
            { k: 'note', title: 'Watch the expense ratio', text: 'A 1% annual fee can quietly consume a quarter or more of your lifetime returns to compounding. Cheap, broad index funds keep that fee tiny.' },
        ],
        takeaways: [
            'Both bundle a diversified basket into one purchase.',
            'ETFs trade intraday, usually cost less, and are often more tax-efficient.',
            'Mutual funds suit exact-dollar recurring buys and some plan menus.',
            'Fees compound against you — minimize the expense ratio.',
        ],
        tools: [{ label: 'Explore the screener', href: '/screener' }],
    },
    {
        slug: 'dividends-explained',
        title: 'How Dividends Work: Yield, Payout & Growth',
        category: 'dividends',
        excerpt:
            'Dividends are a share of profits paid to owners. Understand yield, the payout ratio, and why growth often beats a high headline number.',
        readMin: 5,
        body: [
            { k: 'p', text: 'A dividend is a portion of a company’s profit paid out to shareholders, usually quarterly. They’re a way to earn a return without selling, and a long history of dividends signals a mature, cash-generative business.' },
            { k: 'h', text: 'The three numbers that matter' },
            { k: 'list', items: [
                'Dividend yield = annual dividend ÷ price. A 4% yield pays $4 a year per $100 invested.',
                'Payout ratio = dividends ÷ earnings. Low leaves room to grow and a safety margin; very high (>80–100%) can be a warning.',
                'Dividend growth = how fast the payout rises. Steady growth compounds your yield-on-cost over time.',
            ] },
            { k: 'h', text: 'Why a very high yield can be a trap' },
            { k: 'p', text: 'Yield rises when price falls. An unusually high yield often means the market expects a cut — a “yield trap.” A moderate, growing, well-covered dividend usually beats a fat one that isn’t sustainable.' },
            { k: 'note', title: 'Key dates', text: 'To receive a dividend you must own the stock before the ex-dividend date. On that date the price typically drops by roughly the dividend amount.' },
        ],
        takeaways: [
            'Dividends pay you a slice of profits, usually quarterly.',
            'Yield, payout ratio and growth rate together tell the real story.',
            'A sky-high yield often signals an expected cut — beware yield traps.',
            'You must own before the ex-dividend date to get paid.',
        ],
        tools: [{ label: 'Track income names on a watchlist', href: '/watchlist' }],
    },
    {
        slug: 'bonds-101',
        title: 'Bonds 101: Duration, Credit & the Price-Yield Seesaw',
        category: 'bonds',
        excerpt:
            'A bond is a loan with a coupon. Master three ideas — the price-yield seesaw, duration, and credit risk — and you understand fixed income.',
        readMin: 6,
        body: [
            { k: 'p', text: 'A bond is a loan to a government or company. You lend the principal, collect regular interest (the coupon), and get your principal back at maturity. Three concepts explain almost everything about how bonds behave.' },
            { k: 'h', text: '1. The price-yield seesaw' },
            { k: 'p', text: 'Bond prices move opposite to interest rates. If new bonds pay 5% and you hold one paying 3%, yours is worth less — its price falls until its yield is competitive. Rates up, prices down; rates down, prices up.' },
            { k: 'h', text: '2. Duration = rate sensitivity' },
            { k: 'p', text: 'Duration measures how much a bond’s price moves when rates change. A duration of 7 means roughly a 7% price drop if rates rise 1 point. Long bonds (e.g. 20-year Treasuries) have high duration and swing hard; T-bills barely move.' },
            { k: 'h', text: '3. Credit risk' },
            { k: 'p', text: 'Will you be paid back? Investment-grade issuers are financially strong and pay less; high-yield (“junk”) issuers pay more to compensate for higher default risk. The extra yield over Treasuries is the “credit spread,” and it widens in stress.' },
            { k: 'note', title: 'Two dials, one bond', text: 'Every bond’s risk is a blend of rate risk (duration) and credit risk (spread). Treasuries are almost all duration; junk bonds add a big dose of credit.' },
        ],
        takeaways: [
            'A bond pays coupons and returns principal at maturity.',
            'Prices move opposite to rates — the price-yield seesaw.',
            'Duration measures rate sensitivity: long bonds swing, bills don’t.',
            'Credit risk and its spread reward you for default risk and widen in stress.',
        ],
        tools: [
            { label: 'Fixed Income dashboard', href: '/fixed-income' },
            { label: 'Corporate & global credit', href: '/fixed-income/corporate' },
        ],
    },
    {
        slug: 'market-bubbles',
        title: 'Understanding Market Bubbles',
        category: 'risk',
        excerpt:
            'Every bubble shares a shape: a real story, parabolic prices, euphoria, then a violent unwind. Learn the anatomy so you can recognize it live.',
        readMin: 6,
        body: [
            { k: 'p', text: 'A bubble is when an asset’s price detaches from any reasonable estimate of its value, driven by a feedback loop of rising prices and rising expectations. From tulips in 1637 to dot-com stocks in 2000, they rhyme — and understanding the pattern is the best defense.' },
            { k: 'h', text: 'The anatomy' },
            { k: 'list', items: [
                'A real, exciting story (the internet, AI) that justifies the early rise.',
                'Easy money and leverage that fund the speculation.',
                'Parabolic prices far above any trend or fundamental anchor.',
                'Euphoria — “this time is different,” new buyers chasing, skeptics mocked.',
                'A trigger, then a rush for the exits — the unwind is faster than the climb.',
            ] },
            { k: 'h', text: 'What pops them' },
            { k: 'p', text: 'Usually rising rates (the cost of the leverage fueling it), a failure that breaks the story, or simply running out of new buyers. The deflation is rarely orderly: history’s great bubbles fell 78–90% from their peaks.' },
            { k: 'note', title: 'Bubbles can run far longer than seems possible', text: 'Being early is indistinguishable from being wrong for a long time. Recognizing froth is about sizing and risk control, not precise timing.' },
        ],
        takeaways: [
            'A bubble is price detaching from value via a price/expectations feedback loop.',
            'The shape repeats: real story → leverage → parabola → euphoria → unwind.',
            'Rising rates, a broken narrative, or no new buyers tend to pop them.',
            'They can last absurdly long — manage risk, don’t try to time the top.',
        ],
        tools: [{ label: 'Open the Bubble Detector', href: '/bubble-detector' }],
    },
    {
        slug: 'dollar-cost-averaging',
        title: 'Dollar-Cost Averaging vs. Lump Sum',
        category: 'basics',
        excerpt:
            'Invest a fixed amount on a schedule, or deploy it all at once? Both are valid — the right answer depends on math and on your nerves.',
        readMin: 4,
        body: [
            { k: 'p', text: 'Dollar-cost averaging (DCA) means investing a fixed amount at regular intervals regardless of price. You automatically buy more shares when prices are low and fewer when they’re high, smoothing your entry and removing the urge to time the market.' },
            { k: 'h', text: 'The honest tradeoff' },
            { k: 'p', text: 'Because markets rise more often than they fall, investing a lump sum immediately has historically beaten DCA most of the time — time in the market beats timing. But DCA reduces regret and the risk of putting everything in right before a drop, which makes it easier to actually stay invested.' },
            { k: 'list', items: [
                'Lump sum: higher expected return on average (markets trend up).',
                'DCA: lower variance of outcomes, far less emotional stress.',
                'For ongoing income (a paycheck), you’re naturally dollar-cost averaging anyway.',
            ] },
            { k: 'note', title: 'The best plan is the one you’ll keep', text: 'A slightly “suboptimal” strategy you stick with beats an optimal one you abandon in a panic. Automate it and let compounding work.' },
        ],
        takeaways: [
            'DCA invests a fixed sum on a schedule, smoothing your entry price.',
            'Lump-sum usually wins on average because markets trend upward.',
            'DCA wins on emotional consistency and downside-regret control.',
            'Consistency beats optimization — pick the plan you’ll actually keep.',
        ],
    },
];

export function getArticle(slug: string): Article | undefined {
    return ARTICLES.find((a) => a.slug === slug);
}

export function articlesByCategory(id: CategoryId): Article[] {
    return ARTICLES.filter((a) => a.category === id);
}
