import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SignalDesk — Elite Crypto Trading Signals",
    short_name: "SignalDesk",
    description:
      "Public, open-source crypto trading signal dashboard with a pro multi-pane chart, market screener, sentiment gauge and elite signal engine. No login required.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}