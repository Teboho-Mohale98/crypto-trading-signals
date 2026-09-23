import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "SignalDesk — Real-Time Crypto Trading Signals",
  description:
    "Public, open-source crypto trading signal dashboard. Live BUY/SELL/NEUTRAL signals for BTC, ETH and SOL powered by RSI, EMA and MACD — no login, no API keys.",
  keywords: [
    "trading signals",
    "crypto signals",
    "RSI",
    "MACD",
    "EMA",
    "BTC",
    "Ethereum",
    "Solana",
    "Binance",
    "open source",
  ],
  openGraph: {
    title: "SignalDesk — Real-Time Crypto Trading Signals",
    description:
      "Live BUY/SELL/NEUTRAL signals for BTC, ETH and SOL powered by RSI, EMA and MACD. No login, no API keys.",
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