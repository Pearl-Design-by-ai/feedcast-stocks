import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "FeedCast Stocks",
  description: "FeedCast Stocks — track the markets (delayed data), set personalized alerts, and explore detailed company insights. A derivative of OpenStock by Open Dev Society, licensed AGPL-3.0.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {children}
                <Toaster/>
            </body>
        </html>
    );
}
