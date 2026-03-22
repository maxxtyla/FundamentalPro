import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSentimentData } from "@/lib/sentiment/fetcher";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Supabase environment variables are missing");
    }
    return createClient("https://dummy.supabase.co", "dummy-key");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Symbol mapping: Your DB symbols -> Myfxbook API symbols
const REVERSE_SYMBOL_MAP: Record<string, string> = {
  "GOLD": "XAUUSD",
  "SILVER": "XAGUSD"
};

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

    // 2. Fetch sentiment from YOUR sentiment API
    const sentimentData = await fetchSentimentData();
    console.log(`Fetched ${sentimentData.length} sentiment records`);

    // 3. Fetch seasonality from DATABASE
    const seasonalityData = await fetchSeasonalityFromDB(baseScores.map((r: any) => r.symbol));

    // 4. Calculate scores
    const currentMonth = new Date().getMonth();
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const processedData = baseScores.map((row: any) => {
      const symbol = row.symbol;
      
      // Map symbol for sentiment lookup (GOLD -> XAUUSD, SILVER -> XAGUSD, others stay same)
      const sentimentSymbol = REVERSE_SYMBOL_MAP[symbol] || symbol;
      
      // DEBUG: Log the lookup
      console.log(`Looking up sentiment for ${symbol} -> ${sentimentSymbol}`);
      
      // SENTIMENT SCORING - Contrarian logic
      const sentiment = sentimentData.find((s: any) => s.pair === sentimentSymbol);
      let sentimentScore = 0;
      let sentimentMeta = null;
      
      if (sentiment) {
        const longPercent = sentiment.long_percent;
        const shortPercent = sentiment.short_percent;
        
        console.log(`Found sentiment for ${sentimentSymbol}: ${longPercent}% long, ${shortPercent}% short`);
        
        // CONTRARIAN SIGNALS (Retail is wrong at extremes)
        if (longPercent >= 70) {
          // Retail is extremely long → Market will likely drop → BEARISH signal
          sentimentScore = -2;
          sentimentMeta = {
            long_percent: longPercent,
            short_percent: shortPercent,
            is_contrarian: true,
            contrarian_signal: "bearish",
            signal_strength: longPercent >= 80 ? "extreme" : "strong",
            reasoning: `Retail ${longPercent}% long - contrarian bearish signal`
          };
        } else if (shortPercent >= 70) {
          // Retail is extremely short → Market will likely rise → BULLISH signal
          sentimentScore = 2;
          sentimentMeta = {
            long_percent: longPercent,
            short_percent: shortPercent,
            is_contrarian: true,
            contrarian_signal: "bullish",
            signal_strength: shortPercent >= 80 ? "extreme" : "strong",
            reasoning: `Retail ${shortPercent}% short - contrarian bullish signal`
          };
        } else {
          // Not extreme - follow retail sentiment (momentum)
          sentimentScore = longPercent > shortPercent ? 1 : -1;
          sentimentMeta = {
            long_percent: longPercent,
            short_percent: shortPercent,
            is_contrarian: false,
            contrarian_signal: null,
            signal_strength: "moderate",
            reasoning: `Retail mixed ${longPercent}%/${shortPercent}% - momentum follow`
          };
        }
      } else {
        console.log(`No sentiment found for ${sentimentSymbol}`);
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
            current_month_name: monthData.month || monthNames[currentMonth],
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

    // Save to history (async, don't wait)
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

// Fetch seasonality from DATABASE
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
    return await getSentimentData();
  } catch (error) {
    console.error("Failed to get sentiment:", error);
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
