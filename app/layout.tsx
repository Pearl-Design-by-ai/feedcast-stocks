import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import {Toaster} from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face — page titles and section headers only. The squared, slightly
// technical letterforms give headings a voice of their own while Geist keeps
// body text and data quiet. Wired to h1/h2 in globals.css.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const SITE_URL = "https://markets.feedcast.news";
const SITE_NAME = "FeedCast Markets";
const SITE_DESCRIPTION =
  "FeedCast Markets — track the markets (delayed data), set personalized alerts, and explore detailed company insights. A derivative of OpenStock by Open Dev Society, licensed AGPL-3.0.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Per-page `title: 'Watchlists'` renders as "Watchlists · FeedCast Markets".
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  // Public for SEO — let crawlers index everything they can reach. Members-only
  // pages self-gate at the server (redirect / notFound), so they never render
  // indexable content to a crawler anyway.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
            >
                {children}
                <Toaster/>
            </body>
        </html>
    );
}
