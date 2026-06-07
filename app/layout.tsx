import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import {Toaster} from "@/components/ui/sonner";
import "./globals.css";

// Match the main Feedcast app's typefaces (Inter body / Lora serif) so the
// two surfaces feel like one product. Variables are consumed in globals.css.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FeedCast Markets",
  description: "FeedCast Markets — track the markets (delayed data), set personalized alerts, and explore detailed company insights. A derivative of OpenStock by Open Dev Society, licensed AGPL-3.0.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`dark ${inter.variable} ${lora.variable}`}>
            <body
                className="font-sans antialiased"
            >
                {children}
                <Toaster/>
            </body>
        </html>
    );
}
