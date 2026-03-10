"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Search, RotateCcw } from "lucide-react";

type Row = {
  instrument: string;
  base_score: number;
  quote_score: number;
  final_score: number;
};

export default function MacroTopSetupsPage() {
  const supabase = getSupabaseBrowserClient();

  const [data, setData] = useState<Row[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [sortOrder, searchQuery]);

  async function fetchData() {
    let query = supabase
      .from("eco_pair_total_scores")
      .select("*");

    // Sort
    query = query.order("final_score", {
      ascending: sortOrder === "asc",
    });

    // Search filter
    if (searchQuery.trim() !== "") {
      query = query.ilike("instrument", `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setData(data);
    }
  }

  function resetFilters() {
    setSortOrder("desc");
    setSearchQuery("");
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0">
      
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold text-white">
        Macro — <span className="text-yellow-400">Economic Pair Scores</span>
      </h1>

      {/* CONTROL BAR */}
      <div className="bg-blue-950/80 border border-blue-800/50 rounded-2xl p-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
        
        {/* Controls Container */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="bg-blue-900/50 border border-blue-700/50 rounded-lg px-3 py-2.5 text-sm text-blue-100 focus:border-yellow-400 focus:outline-none transition-colors w-full sm:w-auto"
          >
            <option value="desc">Highest Score</option>
            <option value="asc">Lowest Score</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
            <input
              type="text"
              placeholder="Search instrument..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-blue-900/50 border border-blue-700/50 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-blue-400/70 focus:border-yellow-400 focus:outline-none transition-colors"
            />
          </div>
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
            key={row.instrument} 
            className="bg-blue-950/50 border border-blue-800/30 rounded-xl p-4 space-y-3"
          >
            {/* Header: Instrument */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-lg">{row.instrument}</span>
              <span className={`text-2xl font-bold ${getScoreColor(row.final_score)}`}>
                {row.final_score > 0 ? "+" : ""}{row.final_score}
              </span>
            </div>
            
            {/* Scores Grid */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-blue-900/30 rounded-lg p-3">
                <div className="text-xs text-blue-300 mb-1 uppercase tracking-wider">Base Score</div>
                <div className={`font-semibold text-lg ${getScoreColor(row.base_score)}`}>
                  {row.base_score > 0 ? "+" : ""}{row.base_score}
                </div>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-3">
                <div className="text-xs text-blue-300 mb-1 uppercase tracking-wider">Quote Score</div>
                <div className={`font-semibold text-lg ${getScoreColor(row.quote_score)}`}>
                  {row.quote_score > 0 ? "+" : ""}{row.quote_score}
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
                <th className="px-6 py-4 text-left font-semibold">Base</th>
                <th className="px-6 py-4 text-left font-semibold">Quote</th>
                <th className="px-6 py-4 text-left font-semibold">Final Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.instrument}
                  className="border-t border-blue-800/30 hover:bg-blue-900/30 transition"
                >
                  <td className="px-6 py-4 font-semibold text-white">
                    {row.instrument}
                  </td>

                  <td className={`px-6 py-4 ${getScoreColor(row.base_score)}`}>
                    {row.base_score}
                  </td>

                  <td className={`px-6 py-4 ${getScoreColor(row.quote_score)}`}>
                    {row.quote_score}
                  </td>

                  <td className={`px-6 py-4 font-bold ${getScoreColor(row.final_score)}`}>
                    {row.final_score}
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
