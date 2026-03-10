"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Search, RotateCcw, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Row = {
  pair: string;
  base_currency: string;
  quote_currency: string;
  base_rate: number;
  quote_rate: number;
  rate_differential: number;
};

export default function CarryTradePage() {
  const supabase = getSupabaseBrowserClient();

  const [data, setData] = useState<Row[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchData();
  }, [searchQuery, sortOrder]);

  async function fetchData() {
    let query = supabase
      .from("interest_rate_pairs")
      .select("*")
      .order("rate_differential", { ascending: sortOrder === "asc" });

    if (searchQuery.trim() !== "") {
      query = query.ilike("pair", `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setData(data);
    }
  }

  function resetFilters() {
    setSearchQuery("");
    setSortOrder("desc");
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0">
      
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold text-white">
        Carry Trade <span className="text-yellow-400">Scanner</span>
      </h1>

      {/* FILTER BAR */}
      <div className="bg-blue-950/80 border border-blue-800/50 rounded-2xl p-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
        
        {/* Controls Container */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
            <input
              type="text"
              placeholder="Search pair..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-blue-900/50 border border-blue-700/50 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-blue-400/70 focus:border-yellow-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="bg-blue-900/50 border border-blue-700/50 rounded-lg px-3 py-2.5 text-sm text-blue-100 focus:border-yellow-400 focus:outline-none transition-colors w-full sm:w-auto"
          >
            <option value="desc">Highest Differential</option>
            <option value="asc">Lowest Differential</option>
          </select>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap w-full sm:w-auto"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
      </div>

      {/* MOBILE CARDS VIEW */}
      <div className="lg:hidden space-y-3">
        {data.map((row) => (
          <div 
            key={row.pair}
            className="bg-blue-950/50 border border-blue-800/30 rounded-xl p-4 space-y-3"
          >
            {/* Header: Pair + Differential */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-lg block">{row.pair}</span>
                <span className="text-xs text-blue-300">{row.base_currency}/{row.quote_currency}</span>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${getDifferentialBadgeColor(row.rate_differential)}`}>
                {row.rate_differential > 0 ? <TrendingUp size={14} /> : row.rate_differential < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                {row.rate_differential > 0 ? "+" : ""}{row.rate_differential}%
              </div>
            </div>
            
            {/* Rates Grid */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-blue-900/30 rounded-lg p-3">
                <div className="text-xs text-blue-300 mb-1 uppercase tracking-wider">Base Rate</div>
                <div className={`font-semibold text-lg ${getRateColor(row.base_rate)}`}>
                  {row.base_rate}%
                </div>
                <div className="text-xs text-blue-400 mt-1">{row.base_currency}</div>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-3">
                <div className="text-xs text-blue-300 mb-1 uppercase tracking-wider">Quote Rate</div>
                <div className={`font-semibold text-lg ${getRateColor(row.quote_rate)}`}>
                  {row.quote_rate}%
                </div>
                <div className="text-xs text-blue-400 mt-1">{row.quote_currency}</div>
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
                <th className="px-6 py-4 text-left font-semibold">Pair</th>
                <th className="px-6 py-4 text-left font-semibold">Base</th>
                <th className="px-6 py-4 text-left font-semibold">Quote</th>
                <th className="px-6 py-4 text-left font-semibold">Base Rate</th>
                <th className="px-6 py-4 text-left font-semibold">Quote Rate</th>
                <th className="px-6 py-4 text-left font-semibold">Rate Differential</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.pair}
                  className="border-t border-blue-800/30 hover:bg-blue-900/30 transition"
                >
                  <td className="px-6 py-4 font-semibold text-white">{row.pair}</td>
                  <td className="px-6 py-4 text-blue-200">{row.base_currency}</td>
                  <td className="px-6 py-4 text-blue-200">{row.quote_currency}</td>
                  <td className={`px-6 py-4 ${getRateColor(row.base_rate)}`}>{row.base_rate}%</td>
                  <td className={`px-6 py-4 ${getRateColor(row.quote_rate)}`}>{row.quote_rate}%</td>
                  <td className={`px-6 py-4 font-bold ${getRateColor(row.rate_differential)}`}>
                    {row.rate_differential > 0 ? "+" : ""}{row.rate_differential}%
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

// Color coding for rates
function getRateColor(rate: number) {
  if (rate > 0) return "text-green-400";
  if (rate < 0) return "text-red-400";
  return "text-gray-400";
}

// Badge styling for differential in mobile view
function getDifferentialBadgeColor(diff: number) {
  if (diff > 0) return "bg-green-500/20 text-green-400 border border-green-500/30";
  if (diff < 0) return "bg-red-500/20 text-red-400 border border-red-500/30";
  return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
}
