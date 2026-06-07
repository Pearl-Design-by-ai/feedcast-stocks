import Link from "next/link";
import { FeedcastLogo } from "@/components/FeedcastLogo";

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white border-t border-gray-800">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <FeedcastLogo size={28} className="text-teal-400" />
                            <span className="text-lg font-semibold text-white">FeedCast <span className="text-teal-400">Stocks</span></span>
                        </Link>
                        <p className="text-gray-400 mb-6 max-w-md">
                            FeedCast Markets tracks the markets, sets personalized alerts, and surfaces detailed company insights — part of the FeedCast platform.
                        </p>
                        <div className="mb-8">
                            <Link href="/about" className="text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1 group">
                                Learn about our mission
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                        <div className="flex space-x-6">
                            <Link
                                href="https://github.com/Pearl-Design-by-ai/feedcast-stocks"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors duration-200 relative group"
                            >
                                <span className="relative">
                                    Source code
                                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Resources</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/help" className="text-gray-400 hover:text-white transition-colors duration-200 relative group">
                                    <span className="relative">
                                        Help Center
                                        <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-200 relative group">
                                    <span className="relative">
                                        Terms of Service
                                        <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                                    </span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 mt-8 pt-8">
                    {/* Delayed-data disclaimer — shown site-wide */}
                    <p className="text-gray-500 text-xs mb-6 text-center md:text-left">
                        Market data is delayed (typically ~15 minutes) and provided for
                        informational purposes only — not real-time, and not financial advice.
                    </p>
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        {/* Copyright — AGPL-3.0; no "all rights reserved" */}
                        <div className="text-gray-400 text-sm mb-4 md:mb-0">
                            © {new Date().getFullYear()} FeedCast. Free software, licensed under{" "}
                            <a
                                href="https://github.com/Pearl-Design-by-ai/feedcast-stocks/blob/main/LICENSE"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-gray-200"
                            >
                                AGPL-3.0
                            </a>
                            .
                        </div>

                        {/* Upstream attribution + AGPL §13 source offer */}
                        <div className="flex items-center space-x-2">
                            <p className="text-gray-500 text-xs">
                                Built on{" "}
                                <a href="https://github.com/Open-Dev-Society/OpenStock" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">OpenStock</a>
                                {" "}by Open Dev Society ·{" "}
                                <a href="https://github.com/Pearl-Design-by-ai/feedcast-stocks" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">Get the source</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
