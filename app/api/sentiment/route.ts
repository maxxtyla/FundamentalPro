// app/api/sentiment/route.ts
import { NextResponse } from "next/server";

const EMAIL = process.env.MYFXBOOK_EMAIL!;
const PASSWORD = process.env.MYFXBOOK_PASSWORD!;

const TRACKED_SYMBOLS = [
  "AUDCAD", "AUDCHF", "AUDJPY", "AUDNZD", "AUDUSD",
  "CADCHF", "CADJPY", "CHFJPY",
  "EURAUD", "EURCAD", "EURCHF", "EURGBP", "EURJPY", "EURNZD", "EURUSD",
  "GBPAUD", "GBPCAD", "GBPCHF", "GBPJPY", "GBPNZD", "GBPUSD",
  "NZDCAD", "NZDCHF", "NZDJPY", "NZDUSD",
  "USDCAD", "USDCHF", "USDJPY",
  "XAGUSD", "XAUUSD"
];

// Cache configuration
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
let cache: {
  data: any;
  timestamp: number;
} | null = null;

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_DURATION_MS) {
      return NextResponse.json(cache.data, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Age': `${Math.round((now - cache.timestamp) / 1000)}s`,
        },
      });
    }

    // 1️⃣ Log into Myfxbook
    const loginRes = await fetch(
      `https://www.myfxbook.com/api/login.json?email=${encodeURIComponent(
        EMAIL
      )}&password=${encodeURIComponent(PASSWORD)}`
    );
    const loginJson = await loginRes.json();

    if (loginJson.error) {
      return NextResponse.json(
        { error: "Login failed", message: loginJson.message },
        { status: 500 }
      );
    }

    const sessionId = loginJson.session;

    // 2️⃣ Fetch community outlook
    const dataRes = await fetch(
      `https://www.myfxbook.com/api/get-community-outlook.json?session=${sessionId}`
    );
    const dataJson = await dataRes.json();

    // 3️⃣ Logout (fire and forget)
    fetch(
      `https://www.myfxbook.com/api/logout.json?session=${sessionId}`
    ).catch(() => {});

    if (dataJson.error) {
      return NextResponse.json(
        { error: "Data fetch failed", message: dataJson.message },
        { status: 500 }
      );
    }

    // Filter and map data with average prices
    const sentiment = dataJson.symbols
      .filter((sym: any) => TRACKED_SYMBOLS.includes(sym.name))
      .map((sym: any) => ({
        pair: sym.name,
        long_percent: sym.longPercentage,
        short_percent: sym.shortPercentage,
        long_positions: sym.longPositions,
        short_positions: sym.shortPositions,
        // Average prices
        avg_long_price: sym.avgLongPrice || null,
        avg_short_price: sym.avgShortPrice || null,
        // Price distance from current (if available)
        long_price_distance: sym.longPriceDistance || null,
        short_price_distance: sym.shortPriceDistance || null,
      }));

    const response = {
      last_updated: new Date().toISOString(),
      data: sentiment,
    };

    // Update cache
    cache = {
      data: response,
      timestamp: now,
    };

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': `public, max-age=${CACHE_DURATION_MS / 1000}`,
      },
    });

  } catch (error) {
    console.error("Myfxbook API error:", error);
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}