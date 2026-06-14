/**
 * Curated asset catalog for the Portfolio Lab engine. Each asset is tagged with
 * the archetypes it suits, its sector/region/style, a role and a one-line
 * rationale. Tiers set base weight (1 = core). This is an editorial starter
 * universe, not a recommendation — extend or edit freely.
 */
import type { Asset } from './engine';

export const CATALOG: Asset[] = [
    // ---- Broad / core ETFs (conservative + balanced cores) ----
    { ticker: 'VTI', name: 'Vanguard Total US Market', type: 'etf', sector: 'Broad market', region: 'US', style: 'blend', role: 'Core', rationale: 'One-line ownership of the entire US market — the diversified base.', tier: 1, archetypes: ['conservative', 'income'] },
    { ticker: 'SPY', name: 'S&P 500 ETF', type: 'etf', sector: 'Broad market', region: 'US', style: 'blend', role: 'Core', rationale: 'Large-cap US beta; the benchmark most portfolios are measured against.', tier: 1, archetypes: ['conservative', 'growth'] },
    { ticker: 'QQQ', name: 'Nasdaq-100 ETF', type: 'etf', sector: 'Broad market', region: 'US', style: 'growth', role: 'Growth engine', rationale: 'Concentrated mega-cap growth/tech exposure in one ticker.', tier: 1, archetypes: ['growth', 'thematic'], themes: ['ai'] },
    { ticker: 'VUG', name: 'Vanguard Growth ETF', type: 'etf', sector: 'Broad market', region: 'US', style: 'growth', role: 'Growth engine', rationale: 'Large-cap growth factor tilt without single-name risk.', tier: 2, archetypes: ['growth'] },
    { ticker: 'VEA', name: 'Vanguard Developed ex-US', type: 'etf', sector: 'Broad market', region: 'DM', style: 'blend', role: 'Diversifier', rationale: 'Developed-market diversification outside the US.', tier: 2, archetypes: ['conservative', 'income'] },
    { ticker: 'GLD', name: 'Gold ETF', type: 'etf', sector: 'Commodities', region: 'Global', style: 'blend', role: 'Hedge', rationale: 'Non-correlated store of value; ballast against equity stress and inflation.', tier: 3, archetypes: ['conservative'] },

    // ---- Growth single names ----
    { ticker: 'NVDA', name: 'NVIDIA', type: 'stock', sector: 'Technology', region: 'US', style: 'growth', role: 'Growth engine', rationale: 'AI compute leader; the bellwether of the data-center build-out.', tier: 1, archetypes: ['growth', 'thematic'], themes: ['ai'] },
    { ticker: 'MSFT', name: 'Microsoft', type: 'stock', sector: 'Technology', region: 'US', style: 'growth', role: 'Core', rationale: 'Durable cloud + software compounder with an AI distribution edge.', tier: 1, archetypes: ['growth', 'conservative', 'thematic'], themes: ['ai'] },
    { ticker: 'AAPL', name: 'Apple', type: 'stock', sector: 'Technology', region: 'US', style: 'growth', role: 'Core', rationale: 'Cash-generative ecosystem; quality growth anchor.', tier: 1, archetypes: ['growth', 'conservative'] },
    { ticker: 'AMZN', name: 'Amazon', type: 'stock', sector: 'Consumer Discretionary', region: 'US', style: 'growth', role: 'Growth engine', rationale: 'E-commerce + AWS cloud; operating-leverage story.', tier: 1, archetypes: ['growth'] },
    { ticker: 'GOOGL', name: 'Alphabet', type: 'stock', sector: 'Communication', region: 'US', style: 'growth', role: 'Core', rationale: 'Search/ads cash machine funding AI and cloud optionality.', tier: 1, archetypes: ['growth', 'thematic'], themes: ['ai'] },
    { ticker: 'META', name: 'Meta Platforms', type: 'stock', sector: 'Communication', region: 'US', style: 'growth', role: 'Growth engine', rationale: 'Scaled ad engine reinvesting heavily in AI.', tier: 2, archetypes: ['growth', 'thematic'], themes: ['ai'] },
    { ticker: 'AVGO', name: 'Broadcom', type: 'stock', sector: 'Technology', region: 'US', style: 'growth', role: 'Growth engine', rationale: 'AI networking/custom-silicon + sticky software.', tier: 2, archetypes: ['growth', 'thematic'], themes: ['ai'] },
    { ticker: 'CRM', name: 'Salesforce', type: 'stock', sector: 'Technology', region: 'US', style: 'growth', role: 'Satellite', rationale: 'Enterprise SaaS leader leaning into AI agents.', tier: 3, archetypes: ['growth'] },
    { ticker: 'NOW', name: 'ServiceNow', type: 'stock', sector: 'Technology', region: 'US', style: 'growth', role: 'Satellite', rationale: 'Workflow-automation compounder with strong retention.', tier: 3, archetypes: ['growth'] },
    { ticker: 'LLY', name: 'Eli Lilly', type: 'stock', sector: 'Healthcare', region: 'US', style: 'growth', role: 'Growth engine', rationale: 'GLP-1 franchise driving rare large-cap pharma growth.', tier: 2, archetypes: ['growth', 'thematic'], themes: ['healthcare'] },
    { ticker: 'COST', name: 'Costco', type: 'stock', sector: 'Consumer Staples', region: 'US', style: 'growth', role: 'Core', rationale: 'Membership flywheel; defensive grower diversifying tech risk.', tier: 2, archetypes: ['growth', 'conservative'] },
    { ticker: 'V', name: 'Visa', type: 'stock', sector: 'Financials', region: 'US', style: 'growth', role: 'Core', rationale: 'Toll-booth on global payments; high-margin compounder.', tier: 2, archetypes: ['growth', 'conservative', 'thematic'], themes: ['fintech'] },

    // ---- Income single names ----
    { ticker: 'JNJ', name: 'Johnson & Johnson', type: 'stock', sector: 'Healthcare', region: 'US', style: 'dividend', role: 'Defensive anchor', rationale: 'Diversified healthcare; decades of dividend growth.', tier: 1, archetypes: ['income', 'conservative'] },
    { ticker: 'PG', name: 'Procter & Gamble', type: 'stock', sector: 'Consumer Staples', region: 'US', style: 'dividend', role: 'Defensive anchor', rationale: 'Staple brands; dividend king with low beta.', tier: 1, archetypes: ['income', 'conservative'] },
    { ticker: 'KO', name: 'Coca-Cola', type: 'stock', sector: 'Consumer Staples', region: 'US', style: 'dividend', role: 'Income generator', rationale: 'Global staple with a reliable, growing payout.', tier: 2, archetypes: ['income'] },
    { ticker: 'PEP', name: 'PepsiCo', type: 'stock', sector: 'Consumer Staples', region: 'US', style: 'dividend', role: 'Income generator', rationale: 'Snacks + beverages; defensive cash flows.', tier: 2, archetypes: ['income'] },
    { ticker: 'ABBV', name: 'AbbVie', type: 'stock', sector: 'Healthcare', region: 'US', style: 'dividend', role: 'Income generator', rationale: 'High-yield pharma with a deep immunology pipeline.', tier: 2, archetypes: ['income'] },
    { ticker: 'XOM', name: 'Exxon Mobil', type: 'stock', sector: 'Energy', region: 'US', style: 'dividend', role: 'Income generator', rationale: 'Integrated energy; inflation hedge with a strong payout.', tier: 2, archetypes: ['income'] },
    { ticker: 'VZ', name: 'Verizon', type: 'stock', sector: 'Communication', region: 'US', style: 'dividend', role: 'Income generator', rationale: 'High current yield from a defensive telecom.', tier: 3, archetypes: ['income'] },
    { ticker: 'HD', name: 'Home Depot', type: 'stock', sector: 'Consumer Discretionary', region: 'US', style: 'dividend', role: 'Core', rationale: 'Best-in-class retailer with steady dividend growth.', tier: 2, archetypes: ['income', 'conservative'] },
    { ticker: 'O', name: 'Realty Income', type: 'stock', sector: 'Real Estate', region: 'US', style: 'dividend', role: 'Income generator', rationale: 'Monthly-paying net-lease REIT; rate-sensitive yield.', tier: 3, archetypes: ['income'] },
    { ticker: 'NEE', name: 'NextEra Energy', type: 'stock', sector: 'Utilities', region: 'US', style: 'dividend', role: 'Income generator', rationale: 'Regulated utility + renewables growth; defensive yield.', tier: 3, archetypes: ['income'] },
    { ticker: 'SCHD', name: 'Schwab US Dividend Equity', type: 'etf', sector: 'Broad market', region: 'US', style: 'dividend', role: 'Core', rationale: 'Quality-screened dividend basket — the income core.', tier: 1, archetypes: ['income', 'conservative'] },
    { ticker: 'VYM', name: 'Vanguard High Dividend Yield', type: 'etf', sector: 'Broad market', region: 'US', style: 'dividend', role: 'Income generator', rationale: 'Broad high-yield equity exposure at low cost.', tier: 2, archetypes: ['income'] },

    // ---- Thematic: AI ----
    { ticker: 'AMD', name: 'Advanced Micro Devices', type: 'stock', sector: 'Technology', region: 'US', style: 'growth', role: 'Satellite', rationale: 'The #2 AI/datacenter GPU challenger.', tier: 2, archetypes: ['thematic'], themes: ['ai'] },
    { ticker: 'TSM', name: 'Taiwan Semiconductor', type: 'stock', sector: 'Technology', region: 'EM', style: 'growth', role: 'Core', rationale: 'Foundry that makes nearly every leading-edge AI chip.', tier: 1, archetypes: ['thematic'], themes: ['ai', 'em'] },
    { ticker: 'PLTR', name: 'Palantir', type: 'stock', sector: 'Technology', region: 'US', style: 'growth', role: 'Satellite', rationale: 'Applied-AI software with fast commercial growth (and rich valuation).', tier: 3, archetypes: ['thematic'], themes: ['ai'] },
    { ticker: 'BOTZ', name: 'Robotics & AI ETF', type: 'etf', sector: 'Technology', region: 'Global', style: 'growth', role: 'Diversifier', rationale: 'Basket exposure to robotics/AI to spread single-name risk.', tier: 2, archetypes: ['thematic'], themes: ['ai'] },

    // ---- Thematic: Fintech ----
    { ticker: 'MA', name: 'Mastercard', type: 'stock', sector: 'Financials', region: 'US', style: 'growth', role: 'Core', rationale: 'Payments network compounder; fintech backbone.', tier: 1, archetypes: ['thematic'], themes: ['fintech'] },
    { ticker: 'COIN', name: 'Coinbase', type: 'stock', sector: 'Financials', region: 'US', style: 'growth', role: 'Satellite', rationale: 'High-beta proxy on crypto adoption and trading volumes.', tier: 3, archetypes: ['thematic'], themes: ['fintech'] },
    { ticker: 'HOOD', name: 'Robinhood', type: 'stock', sector: 'Financials', region: 'US', style: 'growth', role: 'Satellite', rationale: 'Retail brokerage scaling into broader financial services.', tier: 3, archetypes: ['thematic'], themes: ['fintech'] },
    { ticker: 'FINX', name: 'FinTech ETF', type: 'etf', sector: 'Financials', region: 'Global', style: 'growth', role: 'Diversifier', rationale: 'Diversified fintech basket across payments and platforms.', tier: 2, archetypes: ['thematic'], themes: ['fintech'] },

    // ---- Thematic: Emerging markets ----
    { ticker: 'VWO', name: 'Vanguard Emerging Markets', type: 'etf', sector: 'Broad market', region: 'EM', style: 'blend', role: 'Core', rationale: 'Broad, low-cost EM equity exposure.', tier: 1, archetypes: ['thematic'], themes: ['em'] },
    { ticker: 'BABA', name: 'Alibaba', type: 'stock', sector: 'Consumer Discretionary', region: 'EM', style: 'value', role: 'Satellite', rationale: 'China e-commerce/cloud; deep-value EM bet with policy risk.', tier: 2, archetypes: ['thematic'], themes: ['em'] },
    { ticker: 'MELI', name: 'MercadoLibre', type: 'stock', sector: 'Consumer Discretionary', region: 'EM', style: 'growth', role: 'Growth engine', rationale: 'Latin-American e-commerce + fintech compounder.', tier: 2, archetypes: ['thematic'], themes: ['em', 'fintech'] },
    { ticker: 'INDA', name: 'MSCI India ETF', type: 'etf', sector: 'Broad market', region: 'EM', style: 'growth', role: 'Diversifier', rationale: 'Structural-growth EM exposure via India.', tier: 2, archetypes: ['thematic'], themes: ['em'] },

    // ---- Thematic: Energy / clean energy ----
    { ticker: 'ICLN', name: 'Clean Energy ETF', type: 'etf', sector: 'Energy', region: 'Global', style: 'growth', role: 'Core', rationale: 'Diversified clean-energy basket; rate-sensitive theme.', tier: 1, archetypes: ['thematic'], themes: ['energy'] },
    { ticker: 'FSLR', name: 'First Solar', type: 'stock', sector: 'Energy', region: 'US', style: 'growth', role: 'Satellite', rationale: 'US-made solar with policy tailwinds.', tier: 2, archetypes: ['thematic'], themes: ['energy'] },
    { ticker: 'ENPH', name: 'Enphase Energy', type: 'stock', sector: 'Energy', region: 'US', style: 'growth', role: 'Satellite', rationale: 'Solar micro-inverters; high-beta clean-energy name.', tier: 3, archetypes: ['thematic'], themes: ['energy'] },

    // ---- Thematic: Healthcare innovation ----
    { ticker: 'UNH', name: 'UnitedHealth', type: 'stock', sector: 'Healthcare', region: 'US', style: 'blend', role: 'Core', rationale: 'Scaled managed-care + Optum services.', tier: 1, archetypes: ['thematic'], themes: ['healthcare'] },
    { ticker: 'ISRG', name: 'Intuitive Surgical', type: 'stock', sector: 'Healthcare', region: 'US', style: 'growth', role: 'Growth engine', rationale: 'Robotic surgery leader with a razor/blade model.', tier: 2, archetypes: ['thematic'], themes: ['healthcare'] },
    { ticker: 'XLV', name: 'Health Care Select ETF', type: 'etf', sector: 'Healthcare', region: 'US', style: 'blend', role: 'Diversifier', rationale: 'Broad US healthcare basket to anchor the theme.', tier: 2, archetypes: ['thematic'], themes: ['healthcare'] },

    // ---- Bond / cash sleeves ----
    { ticker: 'BND', name: 'Vanguard Total Bond Market', type: 'etf', sector: 'Fixed income', region: 'US', style: 'bond', role: 'Bond sleeve', rationale: 'Broad investment-grade bonds; the core ballast.', tier: 1, archetypes: ['income', 'conservative'] },
    { ticker: 'TLT', name: '20+ Year Treasury ETF', type: 'etf', sector: 'Fixed income', region: 'US', style: 'bond', role: 'Bond sleeve', rationale: 'Long-duration Treasuries; convexity in risk-off shocks.', tier: 2, archetypes: ['conservative'] },
    { ticker: 'LQD', name: 'IG Corporate Bond ETF', type: 'etf', sector: 'Fixed income', region: 'US', style: 'bond', role: 'Bond sleeve', rationale: 'Investment-grade corporate credit for extra yield.', tier: 2, archetypes: ['income'] },
];
