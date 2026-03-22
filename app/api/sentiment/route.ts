import { NextResponse } from "next/server";
import { getSentimentData } from "@/lib/sentiment/fetcher";

const CACHE_DURATION_MS = 5 * 60 * 1000;
let cache: { data: any; timestamp: number } | null = null;

export async function GET() {
  try {
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_DURATION_MS) {
      return NextResponse.json(cache.data, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Age': `${Math.round((now - cache.timestamp) / 1000)}s`,
        },
      });
    }

    const sentiment = await getSentimentData();
    
    const response = {
      last_updated: new Date().toISOString(),
      data: sentiment,
    };

    cache = { data: response, timestamp: now };

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': `public, max-age=${CACHE_DURATION_MS / 1000}`,
      },
    });

  } catch (error) {
    console.error("Sentiment API error:", error);
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}
