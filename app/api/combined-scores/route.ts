import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Supabase environment variables are missing");
    }
    // Dummy client for build time/development
    return createClient("https://dummy.supabase.co", "dummy-key");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

const MYFXBOOK_EMAIL = process.env.MYFXBOOK_EMAIL!;
const MYFXBOOK_PASSWORD = process.env.MYFXBOOK_PASSWORD!;

// Symbol mapping: Myfxbook/Seasonality API -> Your combined scores table
const SENTIMENT_SYMBOL_MAP: Record<string, string> = {
  "XAUUSD": "GOLD",
  "XAGUSD": "SILVER"
};

// Reverse mapping for lookup
const REVERSE_SYMBOL_MAP: Record<string, string> = {
  "GOLD": "XAUUSD",
  "SILVER": "XAGUSD"
};

const TRACKED_SYMBOLS = [
  "AUDCAD", "AUDCHF", "AUDJPY", "AUDNZD", "AUDUSD",
  "CADCHF", "CADJPY", "CHFJPY",
  "EURAUD", "EURCAD", "EURCHF", "EURGBP", "EURJPY", "EURNZD", "EURUSD",
  "GBPAUD", "GBPCAD", "GBPCHF", "GBPJPY", "GBPNZD", "GBPUSD",
  "NZDCAD", "NZDCHF", "NZDJPY", "NZDUSD",
  "USDCAD", "USDCHF", "USDJPY",
  "XAGUSD", "XAUUSD"
];

const CACHE_DURATION_MS = 5 * 60 * 1000;
let cache: { data: any; timestamp: number } | null = null;

export async function GET(request: Request) {
  try {
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_DURATION_MS) {
      return NextResponse.json(cache.data, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    // 1. Fetch base scores
    const { data: baseScores, error: baseError } = await getSupabaseAdmin()
      .from("combined_pair_total_scores")
      .select("*");

    if (baseError) throw baseError;
    if (!baseScores || baseScores.length === 0) {
      return NextResponse.json({ error: "No base data found" }, { status: 404 });
    }

    // 2. Fetch sentiment
    const sentimentData = await fetchSentimentData();

    // 3. Fetch seasonality from DATABASE
    const seasonalityData = await fetchSeasonalityFromDB(baseScores.map((r: any) => r.symbol));

    // 4. Calculate scores
    const currentMonth = new Date().getMonth(); // 0-11
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const processedData = baseScores.map((row: any) => {
      const symbol = row.symbol;
      
      // Map symbol for sentiment lookup (GOLD -> XAUUSD)
      const sentimentSymbol = REVERSE_SYMBOL_MAP[symbol] || symbol;
      
      // SENTIMENT SCORING
      const sentiment = sentimentData.find((s: any) => s.pair === sentimentSymbol);
      let sentimentScore = 0;
      let sentimentMeta = null;
      
      if (sentiment) {
        if (sentiment.long_percent >= 70) {
          sentimentScore = 2;
          sentimentMeta = {
            long_percent: sentiment.long_percent,
            short_percent: sentiment.short_percent,
            is_contrarian: true,
            contrarian_signal: "bullish"
          };
        } else if (sentiment.short_percent >= 70) {
          sentimentScore = -2;
          sentimentMeta = {
            long_percent: sentiment.long_percent,
            short_percent: sentiment.short_percent,
            is_contrarian: true,
            contrarian_signal: "bearish"
          };
        } else {
          sentimentMeta = {
            long_percent: sentiment.long_percent,
            short_percent: sentiment.short_percent,
            is_contrarian: false,
            contrarian_signal: null
          };
        }
      }

      // SEASONALITY SCORING (from DB)
      const seasonality = seasonalityData[symbol];
      let seasonalityScore = 0;
      let seasonalityMeta = null;

      if (seasonality && seasonality.monthly && Array.isArray(seasonality.monthly)) {
        const monthData = seasonality.monthly[currentMonth];
        
        if (monthData && typeof monthData.avg_return === 'number') {
          const avgReturn = monthData.avg_return;
          seasonalityScore = avgReturn > 0 ? 2 : -2;
          seasonalityMeta = {
            current_month_return: avgReturn,
            is_bullish_month: avgReturn > 0,
            current_month_name: monthData.month,
            month_index: currentMonth
          };
        }
      }

      // Calculate total
      const combinedTotalScore = 
        (row.cot_score || 0) + 
        (row.pair_score || 0) + 
        sentimentScore + 
        seasonalityScore;

      let overallBias = "Neutral";
      if (combinedTotalScore >= 10) overallBias = "Strong Bullish";
      else if (combinedTotalScore >= 5) overallBias = "Bullish";
      else if (combinedTotalScore <= -10) overallBias = "Strong Bearish";
      else if (combinedTotalScore <= -5) overallBias = "Bearish";

      return {
        symbol,
        cot_score: row.cot_score,
        pair_score: row.pair_score,
        sentiment_score: sentimentScore,
        seasonality_score: seasonalityScore,
        combined_total_score: combinedTotalScore,
        overall_bias: overallBias,
        instrument_type: row.instrument_type,
        sentiment_data: sentimentMeta,
        seasonality_data: seasonalityMeta
      };
    });

    processedData.sort((a: any, b: any) => b.combined_total_score - a.combined_total_score);

    const response = {
      last_updated: new Date().toISOString(),
      data: processedData
    };

    cache = { data: response, timestamp: now };

    // Save to history
    saveToHistory(processedData).catch(console.error);

    return NextResponse.json(response, {
      headers: { 'X-Cache': 'MISS' }
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Server error", message: String(error) },
      { status: 500 }
    );
  }
}

// Fetch seasonality from DATABASE (not HTTP API)
async function fetchSeasonalityFromDB(symbols: string[]) {
  const { data: seasonalityRows, error } = await getSupabaseAdmin()
    .from("seasonality_data")
    .select("*")
    .in("symbol", symbols);

  if (error) {
    console.error("Error fetching seasonality:", error);
    return {};
  }

  const seasonalityMap: Record<string, any> = {};
  seasonalityRows?.forEach((row: any) => {
    seasonalityMap[row.symbol] = {
      symbol: row.symbol,
      monthly: row.monthly_data
    };
  });

  console.log(`Loaded ${Object.keys(seasonalityMap).length} seasonality records from DB`);
  return seasonalityMap;
}

async function fetchSentimentData() {
  try {
    // Check cache first
    const { data: cached } = await getSupabaseAdmin()
      .from("retail_sentiment_cache")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (cached && (new Date().getTime() - new Date(cached.created_at).getTime()) < 5 * 60 * 1000) {
      return cached.data;
    }

    // Fetch from Myfxbook
    const loginRes = await fetch(
      `https://www.myfxbook.com/api/login.json?email=${encodeURIComponent(MYFXBOOK_EMAIL)}&password=${encodeURIComponent(MYFXBOOK_PASSWORD)}`
    );
    const loginJson = await loginRes.json();

    if (loginJson.error) throw new Error("Myfxbook login failed");

    const dataRes = await fetch(
      `https://www.myfxbook.com/api/get-community-outlook.json?session=${loginJson.session}`
    );
    const dataJson = await dataRes.json();

    fetch(`https://www.myfxbook.com/api/logout.json?session=${loginJson.session}`).catch(() => {});

    if (dataJson.error) throw new Error("Myfxbook data fetch failed");

    const sentiment = dataJson.symbols
      .filter((sym: any) => TRACKED_SYMBOLS.includes(sym.name))
      .map((sym: any) => ({
        pair: sym.name,
        long_percent: sym.longPercentage,
        short_percent: sym.shortPercentage,
        long_positions: sym.longPositions,
        short_positions: sym.shortPositions,
      }));

    await getSupabaseAdmin().from("retail_sentiment_cache").insert({
      data: sentiment,
      created_at: new Date().toISOString()
    });

    return sentiment;
  } catch (error) {
    console.error("Sentiment fetch error:", error);
    return [];
  }
}

async function saveToHistory(data: any[]) {
  const records = data.map(row => ({
    symbol: row.symbol,
    cot_score: row.cot_score,
    pair_score: row.pair_score,
    sentiment_score: row.sentiment_score,
    seasonality_score: row.seasonality_score,
    combined_total_score: row.combined_total_score,
    overall_bias: row.overall_bias,
    sentiment_data: row.sentiment_data,
    seasonality_data: row.seasonality_data,
    snapshot_date: new Date().toISOString()
  }));

  await getSupabaseAdmin().from("combined_scores_history").insert(records);
}