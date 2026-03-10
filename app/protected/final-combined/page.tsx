"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Calendar, Users, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

type Row = {
  symbol: string;
  cot_score: number;
  pair_score: number;
  sentiment_score: number;
  seasonality_score: number;
  combined_total_score: number;
  overall_bias: string;
  instrument_type: string;
  // Additional metadata for display
  sentiment_data?: {
    long_percent: number;
    short_percent: number;
    is_contrarian: boolean;
    contrarian_signal: "bullish" | "bearish" | null;
  };
  seasonality_data?: {
    current_month_return: number | null;
    is_bullish_month: boolean;
  };
};

export default function CombinedTopSetupsPage() {
  const supabase = getSupabaseBrowserClient();

  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [biasFilter, setBiasFilter] = useState<string>("All");
  const [instrumentFilter, setInstrumentFilter] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [biasFilter, instrumentFilter, sortOrder]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch from new combined API that includes sentiment and seasonality
      const res = await fetch("/api/combined-scores");
      if (!res.ok) throw new Error("Failed to fetch");
      
      const json = await res.json();
      let processedData: Row[] = json.data || [];
      setLastUpdated(json.last_updated || new Date().toISOString());

      // Apply filters client-side (or move to API)
      if (biasFilter !== "All") {
        processedData = processedData.filter((row) => row.overall_bias === biasFilter);
      }

      if (instrumentFilter !== "All") {
        processedData = processedData.filter((row) => row.instrument_type === instrumentFilter);
      }

      // Sort by combined score
      processedData.sort((a, b) => 
        sortOrder === "asc" 
          ? a.combined_total_score - b.combined_total_score
          : b.combined_total_score - a.combined_total_score
      );

      setData(processedData);
    } catch (error) {
      console.error("Error fetching combined data:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setBiasFilter("All");
    setInstrumentFilter("All");
    setSortOrder("desc");
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Top Setups — <span className="text-yellow-400">Combined Score</span>
        </h1>
        <p className="text-sm text-blue-300">
          COT + Macro + Retail Sentiment (Contrarian) + Seasonality
        </p>
        {lastUpdated && (
          <p className="text-xs text-blue-400">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>
        )}
      </div>

      {/* Score Legend */}
      <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-3 text-xs space-y-2">
        <div className="flex flex-wrap gap-4 text-blue-300">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"/>
            <span>COT Score (Base)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"/>
            <span>Macro Score (Base)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"/>
            <span>Sentiment ±2 (Contrarian)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"/>
            <span>Seasonality ±2 (Monthly)</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-blue-950/80 border border-blue-800/50 rounded-2xl p-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
        
        {/* Filters Container */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Bias Filter */}
          <select
            value={biasFilter}
            onChange={(e) => setBiasFilter(e.target.value)}
            className="bg-blue-900/50 border border-blue-700/50 rounded-lg px-3 py-2.5 text-sm text-blue-100 focus:border-yellow-400 focus:outline-none transition-colors w-full sm:w-auto"
          >
            <option value="All">All Bias</option>
            <option value="Strong Bullish">Strong Bullish</option>
            <option value="Bullish">Bullish</option>
            <option value="Neutral">Neutral</option>
            <option value="Bearish">Bearish</option>
            <option value="Strong Bearish">Strong Bearish</option>
          </select>

          {/* Instrument Filter */}
          <select
            value={instrumentFilter}
            onChange={(e) => setInstrumentFilter(e.target.value)}
            className="bg-blue-900/50 border border-blue-700/50 rounded-lg px-3 py-2.5 text-sm text-blue-100 focus:border-yellow-400 focus:outline-none transition-colors w-full sm:w-auto"
          >
            <option value="All">All Instruments</option>
            <option value="Major">Major Pairs</option>
            <option value="Minor">Minor Pairs</option>
            <option value="Cross">Crosses</option>
            <option value="Commodity">Commodities</option>
            <option value="Index">Indices</option>
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="bg-blue-900/50 border border-blue-700/50 rounded-lg px-3 py-2.5 text-sm text-blue-100 focus:border-yellow-400 focus:outline-none transition-colors w-full sm:w-auto"
          >
            <option value="desc">Highest Score</option>
            <option value="asc">Lowest Score</option>
          </select>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap w-full sm:w-auto"
        >
          Reset Filters
        </button>
      </div>

      {/* MOBILE CARDS VIEW */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-blue-300">Loading...</div>
        ) : (
          data.map((row) => (
            <div 
              key={row.symbol} 
              className="bg-blue-950/50 border border-blue-800/30 rounded-xl p-4 space-y-3"
            >
              {/* Header: Symbol + Bias */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-lg">{row.symbol}</span>
                <BiasBadge bias={row.overall_bias} />
              </div>
              
              {/* Contrarian & Seasonality Tags */}
              <div className="flex flex-wrap gap-2">
                {row.sentiment_data?.is_contrarian && (
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    row.sentiment_data.contrarian_signal === "bullish" 
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  }`}>
                    <AlertTriangle size={10} className="inline mr-1"/>
                    Contrarian {row.sentiment_data.contrarian_signal}
                  </span>
                )}
                {row.seasonality_data?.is_bullish_month !== undefined && (
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    row.seasonality_data.is_bullish_month
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  }`}>
                    <Calendar size={10} className="inline mr-1"/>
                    {row.seasonality_data.is_bullish_month ? "Bullish" : "Bearish"} Month
                  </span>
                )}
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-blue-900/30 rounded-lg p-2">
                  <div className="text-xs text-blue-300 mb-1">COT</div>
                  <div className={`font-semibold ${getScoreColor(row.cot_score)}`}>
                    {row.cot_score > 0 ? "+" : ""}{row.cot_score}
                  </div>
                </div>
                <div className="bg-blue-900/30 rounded-lg p-2">
                  <div className="text-xs text-blue-300 mb-1">Macro</div>
                  <div className={`font-semibold ${getScoreColor(row.pair_score)}`}>
                    {row.pair_score > 0 ? "+" : ""}{row.pair_score}
                  </div>
                </div>
                <div className="bg-orange-900/30 rounded-lg p-2 border border-orange-500/20">
                  <div className="text-xs text-orange-300 mb-1">Sentiment</div>
                  <div className={`font-semibold ${row.sentiment_score > 0 ? "text-green-400" : row.sentiment_score < 0 ? "text-red-400" : "text-gray-400"}`}>
                    {row.sentiment_score > 0 ? "+" : ""}{row.sentiment_score}
                  </div>
                </div>
                <div className="bg-green-900/30 rounded-lg p-2 border border-green-500/20">
                  <div className="text-xs text-green-300 mb-1">Seasonality</div>
                  <div className={`font-semibold ${row.seasonality_score > 0 ? "text-green-400" : row.seasonality_score < 0 ? "text-red-400" : "text-gray-400"}`}>
                    {row.seasonality_score > 0 ? "+" : ""}{row.seasonality_score}
                  </div>
                </div>
              </div>

              {/* Total Score */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                <div className="text-xs text-yellow-400 mb-1">Combined Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(row.combined_total_score)}`}>
                  {row.combined_total_score > 0 ? "+" : ""}{row.combined_total_score}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-blue-950/50 rounded-2xl border border-blue-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-900/50 text-blue-200 uppercase text-xs">
              <tr>
                <th className="px-4 py-4 text-left font-semibold">Instrument</th>
                <th className="px-4 py-4 text-center font-semibold">COT</th>
                <th className="px-4 py-4 text-center font-semibold">Macro</th>
                <th className="px-4 py-4 text-center font-semibold">
                  <span className="flex items-center justify-center gap-1">
                    <Users size={12}/>
                    Sentiment
                  </span>
                </th>
                <th className="px-4 py-4 text-center font-semibold">
                  <span className="flex items-center justify-center gap-1">
                    <Calendar size={12}/>
                    Seasonality
                  </span>
                </th>
                <th className="px-4 py-4 text-center font-semibold">Total</th>
                <th className="px-4 py-4 text-left font-semibold">Bias</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-blue-300">Loading...</td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.symbol}
                    className="border-t border-blue-800/30 hover:bg-blue-900/30 transition"
                  >
                    <td className="px-4 py-4 font-semibold text-white">
                      {row.symbol}
                    </td>

                    <td className={`px-4 py-4 text-center ${getScoreColor(row.cot_score)}`}>
                      {row.cot_score > 0 ? "+" : ""}{row.cot_score}
                    </td>

                    <td className={`px-4 py-4 text-center ${getScoreColor(row.pair_score)}`}>
                      {row.pair_score > 0 ? "+" : ""}{row.pair_score}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className={`font-semibold ${row.sentiment_score > 0 ? "text-green-400" : row.sentiment_score < 0 ? "text-red-400" : "text-gray-400"}`}>
                        {row.sentiment_score > 0 ? "+" : ""}{row.sentiment_score}
                      </div>
                      {row.sentiment_data?.is_contrarian && (
                        <div className="text-[10px] text-orange-400 mt-1">
                          {row.sentiment_data.contrarian_signal === "bullish" ? "↗ Contrarian Long" : "↘ Contrarian Short"}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className={`font-semibold ${row.seasonality_score > 0 ? "text-green-400" : row.seasonality_score < 0 ? "text-red-400" : "text-gray-400"}`}>
                        {row.seasonality_score > 0 ? "+" : ""}{row.seasonality_score}
                      </div>
                      {row.seasonality_data && (
                        <div className="text-[10px] text-blue-400 mt-1">
                          {row.seasonality_data.is_bullish_month ? "Bullish Month" : "Bearish Month"}
                        </div>
                      )}
                    </td>

                    <td className={`px-4 py-4 text-center font-bold text-lg ${getScoreColor(row.combined_total_score)}`}>
                      {row.combined_total_score > 0 ? "+" : ""}{row.combined_total_score}
                    </td>

                    <td className="px-4 py-4">
                      <BiasBadge bias={row.overall_bias} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 10) return "text-green-400";
  if (score >= 6) return "text-green-300";
  if (score >= 2) return "text-green-200";
  if (score <= -10) return "text-red-500";
  if (score <= -6) return "text-red-400";
  if (score <= -2) return "text-red-300";
  return "text-gray-400";
}

function BiasBadge({ bias }: { bias: string }) {
  const styles: Record<string, string> = {
    "Strong Bullish": "bg-green-600/20 text-green-400 border border-green-600/30",
    "Bullish": "bg-green-500/20 text-green-300 border border-green-500/30",
    "Neutral": "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    "Bearish": "bg-red-500/20 text-red-300 border border-red-500/30",
    "Strong Bearish": "bg-red-600/20 text-red-500 border border-red-600/30",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles[bias] || styles.Neutral}`}>
      {bias}
    </span>
  );
}