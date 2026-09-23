import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";
import type { SentimentResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FNG_URL = "https://api.alternative.me/fng/?limit=10";
const FNG_TTL_MS = 60_000;

interface FngEntry {
  value: string;
  value_classification: string;
  timestamp: string;
}

export async function GET() {
  try {
    const data = await cached("fng", FNG_TTL_MS, async () => {
      const res = await fetch(FNG_URL, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`Fear & Greed API responded HTTP ${res.status}`);
      }
      const json = (await res.json()) as { data: FngEntry[] };
      return json.data ?? [];
    });

    if (data.length === 0) {
      throw new Error("Fear & Greed API returned no data");
    }

    const current = data[0];
    const response: SentimentResponse = {
      value: Number(current.value),
      classification: current.value_classification,
      updatedAt: Number(current.timestamp) * 1000,
      history: data.map((entry) => ({
        value: Number(entry.value),
        classification: entry.value_classification,
        timestamp: Number(entry.timestamp) * 1000,
      })),
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Fear & Greed sentiment is temporarily unavailable. " +
          (err instanceof Error ? err.message : String(err)),
        data: null,
      },
      { status: 502 },
    );
  }
}