
import React from 'react';
import Link from 'next/link';
import { FeedcastLogo } from '@/components/FeedcastLogo';
import {
  Server,
  Cpu,
  ShieldCheck,
  Clock,
  Database,
  BarChart2,
  Zap,
  ArrowRight,
  CheckCircle2,
  Gem,
  Landmark,
  RefreshCw,
  Lock,
  HeartPulse,
} from 'lucide-react';

export const metadata = {
  title: 'API & Architecture | FeedCast Markets',
  description:
    'How FeedCast Markets is built — an AGPL public app over a private analysis engine on Cloudflare Workers, with proprietary AI scores, DeepSeek inference and a multi-provider data layer.',
};

export default function ApiDocsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-20">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-10">
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700 shadow-xl">
            <FeedcastLogo size={40} className="text-teal-400" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          FeedCast Markets Architecture
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          A transparent look at the AI-native, edge-deployed system powering your market intelligence.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Badge color="green">Cloudflare Workers</Badge>
          <Badge color="purple">DeepSeek AI</Badge>
          <Badge color="teal">Supabase</Badge>
          <Badge color="blue">Open Source AGPL-3.0</Badge>
        </div>
        <p className="text-sm text-gray-500 max-w-2xl mx-auto">
          Built on{' '}
          <a href="https://github.com/Open-Dev-Society/OpenStock" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
            OpenStock
          </a>{' '}
          by Open Dev Society — the open-source platform and data layer FeedCast layers its own modules on top of.
        </p>
      </section>

      {/* Two-program architecture */}
      <section className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Cpu className="text-teal-400 h-8 w-8" />
            <h2 className="text-3xl font-bold text-gray-100">Two-program design</h2>
          </div>
          <p className="text-gray-400 leading-relaxed">
            FeedCast Markets is two separate programs. The <span className="text-gray-200">public app</span> (this
            site, AGPL-3.0) is the presentation and interaction layer. The proprietary analysis — the AI prompts,
            the scoring math and the curated universes — lives in a <span className="text-gray-200">private engine</span>,
            reached only server-to-server over a token-gated HTTP/JSON API. The browser never sees the engine or its
            keys.
          </p>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-teal-500/10 p-2 rounded-lg text-teal-400">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  AI inference: DeepSeek
                  <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/20">OpenAI-compatible</span>
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Powers every AI feature — Consensus, Ask the Markets, briefs, bull/bear and grounded commentary.
                  Called only from the engine; features degrade gracefully if it is unavailable.
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-700 w-full" />

            <div className="flex items-start gap-4">
              <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  Engine boundary
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">Bearer token</span>
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Responses for shareable reads are cached in Cloudflare KV across isolates, so a page view rarely
                  spends an inference call.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diagram / Visual */}
        <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-8 flex flex-col justify-center items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm">
            <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm border border-gray-700 w-full text-center">
              Browser
            </div>
            <div className="h-5 w-px bg-gray-700" />
            <div className="bg-gray-800 text-gray-200 px-4 py-3 rounded-lg text-sm border border-gray-600 w-full text-center shadow-xl">
              <span className="text-xs font-mono text-teal-500">Public app · AGPL</span>
              <div className="text-gray-300 mt-0.5">Cloudflare Worker (OpenNext)</div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-blue-400">
              <Lock size={12} /> token-gated HTTPS
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-600 w-full flex flex-col gap-2 relative shadow-2xl">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-12 bg-teal-500 rounded-full" />
              <span className="text-xs font-mono text-teal-500">Private engine · Worker</span>
              <div className="flex items-center justify-between text-sm text-gray-200 bg-gray-900/40 p-2 rounded border border-gray-700">
                <span>Scores &amp; AI analysis</span>
                <CheckCircle2 size={14} className="text-teal-500" />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-200 bg-gray-900/40 p-2 rounded border border-gray-700">
                <span>KV cache</span>
                <ArrowRight size={14} className="text-gray-500" />
              </div>
            </div>
            <div className="h-5 w-px bg-gray-700" />
            <div className="bg-green-900/20 text-green-400 px-4 py-2 rounded-lg text-sm border border-green-900/50 w-full text-center font-medium">
              DeepSeek + data providers
            </div>
          </div>
        </div>
      </section>

      {/* Proprietary intelligence layers */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <Gem className="text-teal-400 h-8 w-8" />
          <h2 className="text-3xl font-bold text-gray-100">Proprietary intelligence layers</h2>
        </div>
        <p className="text-gray-400 leading-relaxed mb-6 max-w-3xl">
          FeedCast-exclusive scores and reports computed in the engine — not raw vendor data. Every score is
          explainable: each traces back to the inputs that drove it.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LayerCard icon={<Gem size={18} />} title="Company Score" desc="0–100 multi-factor rating: Quality, Growth, Valuation, Momentum, Financial Health." />
          <LayerCard icon={<ShieldCheck size={18} />} title="Crash Detector" desc="Cycle-risk composite from the curve, credit, breadth, volatility and froth." />
          <LayerCard icon={<BarChart2 size={18} />} title="Bubble Detector" desc="Per-asset bubble & pop-risk scores across themes." />
          <LayerCard icon={<Zap size={18} />} title="Buy & Sell Signals" desc="Graded trend/momentum calls for the major US indices." />
          <LayerCard icon={<Cpu size={18} />} title="Portfolio Labs" desc="Per-name 5-step Consensus + a portfolio-level Health Score." />
          <LayerCard icon={<Landmark size={18} />} title="Fund-Manager 13F" desc="Famous investors' latest public holdings, refreshed from SEC filings." />
        </div>
      </section>

      {/* Background Jobs */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Server className="text-purple-400 h-8 w-8" />
          <h2 className="text-3xl font-bold text-gray-100">Scheduled jobs (Cloudflare cron)</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <JobCard
            icon={<Clock size={20} />}
            title="Price Alerts"
            trigger="Cron: 5m"
            desc="Checks user price targets against live quotes and emails on a cross."
            color="yellow"
          />
          <JobCard
            icon={<RefreshCw size={20} />}
            title="Valuation Scan"
            trigger="Cron: 10m"
            desc="Engine job rebuilds the daily P/E valuation screen a chunk per tick."
            color="teal"
          />
          <JobCard
            icon={<Landmark size={20} />}
            title="Fund-Manager 13F"
            trigger="Cron: 10m"
            desc="Refreshes the stalest manager's holdings from SEC EDGAR + OpenFIGI."
            color="purple"
          />
          <JobCard
            icon={<HeartPulse size={20} />}
            title="Health Monitor"
            trigger="Cron: 4×/day"
            desc="Checks feed/EOD/cron health and emails a status report."
            color="red"
          />
        </div>
      </section>

      {/* Integration Stack */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Database className="text-blue-400 h-8 w-8" />
          <h2 className="text-3xl font-bold text-gray-100">Tech stack &amp; data</h2>
        </div>

        <div className="grid gap-4">
          <StackItem
            title="Cloudflare Workers + KV"
            desc="Edge hosting (OpenNext) for the app and engine, plus a cross-isolate KV cache."
            url="https://workers.cloudflare.com"
          />
          <StackItem
            title="Supabase"
            desc="Postgres, authentication and row-level security for watchlists, alerts and user data."
            url="https://supabase.com"
          />
          <StackItem
            title="Finnhub"
            desc="Real-time quotes, company fundamentals/metrics, and market news."
            url="https://finnhub.io"
          />
          <StackItem
            title="SEC EDGAR + OpenFIGI"
            desc="Official 13F filings for fund-manager portfolios, with CUSIP→ticker mapping."
            url="https://www.sec.gov/edgar"
          />
          <StackItem
            title="DeepSeek"
            desc="OpenAI-compatible inference behind every AI feature, called only from the engine."
            url="https://deepseek.com"
          />
        </div>

        <p className="text-xs text-gray-600 leading-relaxed pt-2">
          Data is delayed and provided for information only; AI output can be inaccurate. Nothing here is investment
          advice. The public app is free software under AGPL-3.0; the analysis engine is a separate, proprietary
          program reached over a generic API.
        </p>
      </section>
    </div>
  );
}

// Helper Components

function Badge({ children, color }: { children: React.ReactNode, color: 'green' | 'purple' | 'blue' | 'teal' }) {
  const colors = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
}

function LayerCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-5 rounded-xl border border-gray-800 bg-gray-900/40 hover:border-teal-500/30 transition-colors">
      <div className="mb-3 text-teal-400">{icon}</div>
      <h3 className="font-bold text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function JobCard({ icon, title, trigger, desc, color }: { icon: React.ReactNode; title: string; trigger: string; desc: string; color: string }) {
  const colorClasses: Record<string, string> = {
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40',
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20 hover:border-teal-500/40',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40',
    red: 'text-red-400 bg-red-500/10 border-red-500/20 hover:border-red-500/40',
  };

  return (
    <div className={`p-5 rounded-xl border transition-all duration-300 ${colorClasses[color]}`}>
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-gray-100 text-lg mb-1">{title}</h3>
      <div className="text-xs font-mono opacity-70 mb-3 uppercase tracking-wider">{trigger}</div>
      <p className="text-sm opacity-80 leading-relaxed">{desc}</p>
    </div>
  );
}

function StackItem({ title, desc, url }: { title: string; desc: string; url: string }) {
  return (
    <Link href={url} target="_blank" className="block group">
      <div className="bg-gray-800/40 hover:bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-200 group-hover:text-teal-400 transition-colors">{title}</h3>
          <p className="text-gray-500 mt-1">{desc}</p>
        </div>
        <ArrowRight className="text-gray-600 group-hover:text-teal-400 transition-colors" />
      </div>
    </Link>
  );
}
