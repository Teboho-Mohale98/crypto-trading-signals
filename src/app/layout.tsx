import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SignalDesk — Elite Crypto, Forex & Index Signals",
  description:
    "Public, open-source trading signal dashboard for crypto, forex and global indices. Pro multi-pane chart, market screener, Fear & Greed sentiment and an elite signal engine (RSI, EMA, MACD, Bollinger, StochRSI, ADX, ATR) across 12 pairs, 20 forex pairs and 20 indices. No login, no API keys.",
  keywords: [
    "trading signals",
    "crypto signals",
    "forex signals",
    "index signals",
    "RSI",
    "MACD",
    "EMA",
    "Bollinger Bands",
    "Stochastic RSI",
    "ADX",
    "BTC",
    "EURUSD",
    "S&P 500",
    "Nasdaq",
    "Binance",
    "Yahoo Finance",
    "open source",
    "market screener",
    "fear and greed",
  ],
  applicationName: "SignalDesk",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SignalDesk",
  },
  openGraph: {
    title: "SignalDesk — Elite Crypto, Forex & Index Signals",
    description:
      "Pro multi-pane chart, market screener, Fear & Greed sentiment and a 7-indicator signal engine across 12 crypto pairs, 20 forex pairs and 20 global indices. No login, no API keys.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${geistMono.variable} min-h-full bg-slate-950 font-sans`}>
        {children}
      </body>
    </html>
  );
}