"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

type Row = {
  symbol: string;
  cot_score: number;
  pair_score: number;
  combined_total_score: number;
  overall_bias: string;
  instrument_type: string;
};

export default function CombinedTopSetupsPage() {
  const supabase = getSupabaseBrowserClient();

  const [data, setData] = useState<Row[]>([]);
  const [biasFilter, setBiasFilter] = useState<string>("All");
  const [instrumentFilter, setInstrumentFilter] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchData();
  }, [biasFilter, instrumentFilter, sortOrder]);

  async function fetchData() {
    let query = supabase
      .from("combined_pair_total_scores")
      .select("*");

    if (biasFilter !== "All") {
      query = query.eq("overall_bias", biasFilter);
    }

    if (instrumentFilter !== "All") {
      query = query.eq("instrument_type", instrumentFilter);
    }

    query = query.order("combined_total_score", {
      ascending: sortOrder === "asc",
    });

    const { data, error } = await query;

    if (!error && data) {
      setData(data);
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
      <h1 className="text-xl sm:text-2xl font-bold text-white">
        Top Setups — <span className="text-yellow-400">Combined</span>
      </h1>

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
        {data.map((row) => (
          <div 
            key={row.symbol} 
            className="bg-blue-950/50 border border-blue-800/30 rounded-xl p-4 space-y-3"
          >
            {/* Header: Symbol + Bias */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-lg">{row.symbol}</span>
              <BiasBadge bias={row.overall_bias} />
            </div>
            
            {/* Scores Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-900/30 rounded-lg p-2">
                <div className="text-xs text-blue-300 mb-1">COT</div>
                <div className={`font-semibold ${getScoreColor(row.cot_score)}`}>
                  {row.cot_score}
                </div>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-2">
                <div className="text-xs text-blue-300 mb-1">Macro</div>
                <div className={`font-semibold ${getScoreColor(row.pair_score)}`}>
                  {row.pair_score}
                </div>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-2 border border-yellow-500/20">
                <div className="text-xs text-yellow-400 mb-1">Total</div>
                <div className={`font-bold text-lg ${getScoreColor(row.combined_total_score)}`}>
                  {row.combined_total_score}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-blue-950/50 rounded-2xl border border-blue-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-900/50 text-blue-200 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Instrument</th>
                <th className="px-6 py-4 text-left font-semibold">COT</th>
                <th className="px-6 py-4 text-left font-semibold">Macro</th>
                <th className="px-6 py-4 text-left font-semibold">Total</th>
                <th className="px-6 py-4 text-left font-semibold">Bias</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.symbol}
                  className="border-t border-blue-800/30 hover:bg-blue-900/30 transition"
                >
                  <td className="px-6 py-4 font-semibold text-white">
                    {row.symbol}
                  </td>

                  <td className={`px-6 py-4 ${getScoreColor(row.cot_score)}`}>
                    {row.cot_score}
                  </td>

                  <td className={`px-6 py-4 ${getScoreColor(row.pair_score)}`}>
                    {row.pair_score}
                  </td>

                  <td className={`px-6 py-4 font-bold ${getScoreColor(row.combined_total_score)}`}>
                    {row.combined_total_score}
                  </td>

                  <td className="px-6 py-4">
                    <BiasBadge bias={row.overall_bias} />
                  </td>
                </tr>
              ))}
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
  if (score <= -10) return "text-red-500";
  if (score <= -6) return "text-red-400";
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
    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles[bias]}`}>
      {bias}
    </span>
  );
}
