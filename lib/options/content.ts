/**
 * Static educational content for the Options Strategies hub — concepts, reasons
 * to use options, the Greeks, common mistakes, FAQ and glossary. Kept as data so
 * the page renders from a single source and stays easy to extend. Educational
 * only; not investment advice.
 */

export interface Concept {
    term: string;
    def: string;
    why: string;
    example: string;
}

export const CONCEPTS: Concept[] = [
    { term: 'Strike Price', def: 'The fixed price at which the option can be exercised.', why: 'Defines where the option starts to have intrinsic value.', example: 'A $105 call lets you buy at $105 no matter how high the stock goes.' },
    { term: 'Expiration Date', def: 'The date the option contract ceases to exist.', why: 'After it, the option is settled or expires worthless.', example: 'A Jan-17 call is gone after the Jan-17 close.' },
    { term: 'Premium', def: 'The price paid (or received) for the option.', why: 'It is the buyer’s max loss and the seller’s max gain.', example: 'A $2.00 premium costs $200 for one contract (×100).' },
    { term: 'Intrinsic Value', def: 'The in-the-money portion of the premium.', why: 'It is real, exercisable value — not time.', example: 'With the stock at $108, a $105 call has $3 of intrinsic value.' },
    { term: 'Extrinsic Value', def: 'Premium beyond intrinsic value — time + volatility.', why: 'It decays to zero by expiration.', example: 'A $4 premium with $3 intrinsic has $1 of extrinsic value.' },
    { term: 'Time Value', def: 'The part of extrinsic value attributable to time left.', why: 'More time = more chance to move = more value.', example: 'A 90-day call costs more than a 7-day call, all else equal.' },
    { term: 'Exercise', def: 'Using the option to buy/sell the underlying at the strike.', why: 'Converts the contract into stock.', example: 'Exercising a $105 call buys 100 shares at $105.' },
    { term: 'Assignment', def: 'The obligation that lands on a seller when a buyer exercises.', why: 'Short options can force you to deliver/buy stock.', example: 'A short $105 call can be assigned — you sell 100 shares at $105.' },
    { term: 'Contract Multiplier', def: 'One equity option controls 100 shares.', why: 'Every per-share quote is ×100 in dollars.', example: 'A $1.50 option = $150 per contract.' },
    { term: 'Open Interest', def: 'Total outstanding contracts at a strike.', why: 'A gauge of liquidity and positioning.', example: 'High open interest usually means tighter spreads.' },
    { term: 'Volume', def: 'Contracts traded during the session.', why: 'Shows current activity and interest.', example: 'A volume spike can flag unusual options activity.' },
    { term: 'Liquidity', def: 'How easily you can trade at a fair price.', why: 'Illiquid options cost you on entry and exit.', example: 'Prefer names with tight bid/ask and high open interest.' },
    { term: 'Bid/Ask Spread', def: 'The gap between the best buy and sell prices.', why: 'A wide spread is a hidden cost.', example: 'A $0.10 spread is far better than a $0.80 one.' },
    { term: 'Implied Volatility (IV)', def: 'The market’s expectation of future movement, priced into options.', why: 'Higher IV = pricier options.', example: 'IV jumps before earnings, then "crushes" after.' },
    { term: 'Historical Volatility', def: 'How much the stock has actually moved in the past.', why: 'A reference point for whether IV looks rich or cheap.', example: 'IV well above HV can signal expensive options.' },
    { term: 'Expected Move', def: 'The range the options market implies by an expiration.', why: 'Frames realistic targets and break-evens.', example: 'A ±$8 expected move suggests most outcomes land in that band.' },
];

export interface WhyCard {
    title: string;
    desc: string;
}
export const WHY_OPTIONS: WhyCard[] = [
    { title: 'Directional Trading', desc: 'Express a bullish or bearish view with leverage and defined risk.' },
    { title: 'Hedging', desc: 'Protect a stock portfolio against downside with puts or collars.' },
    { title: 'Income Generation', desc: 'Collect recurring premium with covered calls and cash-secured puts.' },
    { title: 'Volatility Trading', desc: 'Profit from rising or falling implied volatility, not just direction.' },
    { title: 'Defined Risk', desc: 'Cap your downside to a known amount versus owning the stock outright.' },
    { title: 'Capital Efficiency', desc: 'Control a larger exposure with far less capital deployed.' },
];

export interface GreekInfo {
    name: string;
    symbol: string;
    tagline: string;
    body: string;
    example: string;
    advanced?: boolean;
}
export const GREEKS: GreekInfo[] = [
    { name: 'Delta', symbol: 'Δ', tagline: 'Directional exposure', body: 'How much the option price changes for each $1 move in the underlying. Also a rough probability of finishing in the money.', example: 'A 0.50 delta call gains ~$0.50 if the stock rises $1.' },
    { name: 'Gamma', symbol: 'Γ', tagline: 'Speed of delta', body: 'How fast delta changes as the stock moves. Highest near the money and near expiration.', example: 'High gamma means your delta — and risk — shifts quickly on a move.' },
    { name: 'Theta', symbol: 'Θ', tagline: 'Time decay', body: 'The $ the option loses per day from time passing, all else equal. Negative for buyers, positive for sellers.', example: 'A −$0.05 theta loses ~$5/day per contract.' },
    { name: 'Vega', symbol: 'V', tagline: 'Volatility sensitivity', body: 'How much the price moves per 1-point change in implied volatility. Long options are long vega.', example: 'A 0.10 vega gains ~$10 per contract if IV rises 1 point.' },
    { name: 'Rho', symbol: 'Ρ', tagline: 'Rate sensitivity', body: 'How much the price changes per 1% change in interest rates. Matters most for long-dated options.', example: 'Higher rates lift calls and weigh on puts, modestly.' },
    { name: 'Charm', symbol: '', tagline: 'Delta decay over time', body: 'How delta drifts as time passes — important when managing hedges into expiration.', example: 'An OTM option’s delta bleeds toward zero as expiry nears.', advanced: true },
    { name: 'Vanna', symbol: '', tagline: 'Delta vs. volatility', body: 'How delta changes when implied volatility changes. Key for vol traders and dealers.', example: 'A vol spike can shift your effective directional exposure.', advanced: true },
    { name: 'Vomma', symbol: '', tagline: 'Vega convexity', body: 'How vega changes as volatility changes — the "vol of vol" sensitivity.', example: 'Matters for large vega books in fast-moving vol.', advanced: true },
    { name: 'Speed', symbol: '', tagline: 'Gamma decay', body: 'The rate of change of gamma with the underlying — a third-order risk.', example: 'Relevant for precise gamma hedging near expiry.', advanced: true },
    { name: 'Color', symbol: '', tagline: 'Gamma over time', body: 'How gamma changes as time passes — used to manage hedges into expiration.', example: 'Gamma can balloon for ATM options on expiration day.', advanced: true },
];

export const MISTAKES: WhyCard[] = [
    { title: 'Buying too close to expiration', desc: 'Short-dated options decay fast and need an immediate move to pay off.' },
    { title: 'Ignoring implied volatility', desc: 'Buying when IV is high (e.g. before earnings) often means overpaying into a crush.' },
    { title: 'Overpaying the premium', desc: 'Chasing rich options destroys your risk/reward before the trade even starts.' },
    { title: 'Trading illiquid contracts', desc: 'Wide bid/ask spreads quietly eat returns on entry and exit.' },
    { title: 'Not understanding assignment', desc: 'Short options can be assigned early, turning into an unexpected stock position.' },
    { title: 'Ignoring earnings volatility crush', desc: 'IV collapses after the report — a directional bet can be right and still lose.' },
    { title: 'Overleveraging', desc: 'The 100× multiplier makes it easy to take far more risk than intended.' },
    { title: 'Poor position sizing', desc: 'Without sizing rules, one bad options trade can dominate the account.' },
];

export interface Faq {
    q: string;
    a: string;
}
export const FAQ: Faq[] = [
    { q: 'What happens if an option expires worthless?', a: 'You simply lose the premium you paid (as a buyer). As a seller, you keep the full premium. Out-of-the-money options expire with no value.' },
    { q: 'Can I lose more than my premium?', a: 'As a buyer, no — your loss is capped at the premium. As a seller of uncovered (naked) options, losses can far exceed the premium and, for short calls, are theoretically unlimited.' },
    { q: 'What is assignment?', a: 'When an option buyer exercises, a seller is "assigned" the obligation — to sell shares (short call) or buy shares (short put) at the strike. American-style options can be assigned any time before expiry.' },
    { q: 'Can I close a position before expiration?', a: 'Yes. Most options are closed before expiry by trading an offsetting contract — you rarely need to exercise to realize a gain or loss.' },
    { q: 'Should beginners sell options?', a: 'Start with defined-risk strategies (long calls/puts, covered calls, cash-secured puts, spreads). Avoid naked short options until you fully understand assignment and unlimited-risk profiles.' },
    { q: 'What are weekly options?', a: 'Options that expire every week rather than monthly. They offer precision and fast theta, but decay quickly and can be less liquid.' },
    { q: 'What are LEAPS?', a: 'Long-dated options (typically 1–3 years to expiration). They behave more like stock, with less time decay per day, and are used for long-horizon directional bets.' },
    { q: 'What is IV crush?', a: 'A sharp drop in implied volatility — most famously right after earnings. It deflates option premiums quickly, hurting option buyers even when the direction is right.' },
];

export interface GlossaryTerm {
    term: string;
    def: string;
}
export const GLOSSARY: GlossaryTerm[] = [
    { term: 'ATM (At the Money)', def: 'Strike approximately equal to the current stock price.' },
    { term: 'Assignment', def: 'Obligation delivered to an option seller when the buyer exercises.' },
    { term: 'American Option', def: 'An option exercisable any time before expiration.' },
    { term: 'Ask', def: 'The lowest price a seller will accept.' },
    { term: 'Bid', def: 'The highest price a buyer will pay.' },
    { term: 'Break-even', def: 'The stock price at which a position neither gains nor loses at expiration.' },
    { term: 'Call Option', def: 'The right to buy the underlying at the strike.' },
    { term: 'Cash-Secured Put', def: 'A short put fully backed by cash to buy the shares if assigned.' },
    { term: 'Collar', def: 'Long stock + protective put + short call, defining a range.' },
    { term: 'Contract Multiplier', def: 'Shares controlled per contract — 100 for US equity options.' },
    { term: 'Covered Call', def: 'A short call backed by 100 shares of the underlying.' },
    { term: 'Credit Spread', def: 'A spread opened for a net credit (you receive premium).' },
    { term: 'Debit Spread', def: 'A spread opened for a net debit (you pay premium).' },
    { term: 'Delta', def: 'Price sensitivity to a $1 move in the underlying.' },
    { term: 'European Option', def: 'An option exercisable only at expiration.' },
    { term: 'Exercise', def: 'Invoking the right to buy/sell at the strike.' },
    { term: 'Expiration', def: 'The date the contract ceases to exist.' },
    { term: 'Extrinsic Value', def: 'Premium beyond intrinsic value — time and volatility.' },
    { term: 'Gamma', def: 'The rate of change of delta.' },
    { term: 'Gamma Risk', def: 'Rapid delta (and P/L) swings, acute near expiration.' },
    { term: 'Hedge', def: 'A position that offsets risk in another holding.' },
    { term: 'Historical Volatility', def: 'Realized past volatility of the underlying.' },
    { term: 'Implied Volatility', def: 'Market-implied expected volatility priced into options.' },
    { term: 'In the Money (ITM)', def: 'An option with intrinsic value.' },
    { term: 'Intrinsic Value', def: 'The in-the-money portion of an option’s price.' },
    { term: 'Iron Condor', def: 'A short OTM put spread + short OTM call spread.' },
    { term: 'IV Crush', def: 'A sharp drop in implied volatility, often post-earnings.' },
    { term: 'LEAPS', def: 'Long-dated options (~1–3 years to expiration).' },
    { term: 'Leg', def: 'One option/stock position within a multi-part strategy.' },
    { term: 'Liquidity', def: 'Ease of trading at a fair price.' },
    { term: 'Margin', def: 'Collateral required to hold certain (often short) positions.' },
    { term: 'Mid', def: 'The midpoint between the bid and ask.' },
    { term: 'Naked Option', def: 'A short option without an offsetting hedge or stock.' },
    { term: 'Open Interest', def: 'Total outstanding contracts at a strike.' },
    { term: 'Out of the Money (OTM)', def: 'An option with no intrinsic value.' },
    { term: 'Pin Risk', def: 'Uncertainty when the stock sits right at the strike at expiry.' },
    { term: 'Premium', def: 'The price of an option.' },
    { term: 'Protective Put', def: 'A long put held against owned shares as insurance.' },
    { term: 'Put Option', def: 'The right to sell the underlying at the strike.' },
    { term: 'Rho', def: 'Sensitivity to interest-rate changes.' },
    { term: 'Roll', def: 'Closing an option and opening a similar one at a new strike/date.' },
    { term: 'Spread', def: 'A position combining two or more options of the same type.' },
    { term: 'Straddle', def: 'A call and a put at the same strike and expiration.' },
    { term: 'Strangle', def: 'An OTM call and OTM put at different strikes.' },
    { term: 'Strike Price', def: 'The price at which an option can be exercised.' },
    { term: 'Synthetic Position', def: 'Options combined to mimic a stock position.' },
    { term: 'Theta', def: 'Daily time decay of an option’s price.' },
    { term: 'Theta Decay', def: 'The erosion of extrinsic value as expiration nears.' },
    { term: 'Vega', def: 'Sensitivity to a 1-point change in implied volatility.' },
    { term: 'Volatility', def: 'The magnitude of price movement of the underlying.' },
    { term: 'Volume', def: 'Contracts traded during the session.' },
    { term: 'Writer', def: 'The seller of an option who takes on the obligation.' },
];
