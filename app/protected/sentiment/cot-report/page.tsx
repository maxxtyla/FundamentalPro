"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Search, RotateCcw, Calendar, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Row = {
  report_date: string;
  symbol: string;
  group_type: string;
  longs: number;
  shorts: number;
  change_longs: number;
  change_shorts: number;
  longs_percent: number;
  shorts_percent: number;
  change_longs_percent: number;
  change_shorts_percent: number;
  net_percent: number;
  net_change_percent: number;
};

export default function COTReportPage() {
  const supabase = getSupabaseBrowserClient();

  const [data, setData] = useState<Row[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [groupFilter, setGroupFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"net_percent" | "net_change_percent">("net_percent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchData();
  }, [searchQuery, groupFilter, sortBy, sortOrder]);

  async function fetchData() {
    let query = supabase.from("cot_report_view").select("*");

    if (searchQuery.trim() !== "") {
      query = query.ilike("symbol", `%${searchQuery.trim()}%`);
    }

    if (groupFilter !== "All") {
      query = query.eq("group_type", groupFilter);
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const { data, error } = await query;
    if (!error && data) setData(data);
  }

  function resetFilters() {
    setSearchQuery("");
    setGroupFilter("All");
    setSortBy("net_percent");
    setSortOrder("desc");
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0">
      
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold text-white">
        COT <span className="text-yellow-400">Report</span>
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
              placeholder="Search symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 bg-blue-900/50 border border-blue-700/50 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-blue-400/70 focus:border-yellow-400 focus:outline-none transition-colors"
            />
          </div>

          {/* Group Type Filter */}
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="bg-blue-900/50 border border-blue-700/50 rounded-lg px-3 py-2.5 text-sm text-blue-100 focus:border-yellow-400 focus:outline-none transition-colors w-full sm:w-auto"
          >
            <option value="All">All Groups</option>
            <option value="Leveraged">Leveraged</option>
            <option value="Institutional">Institutional</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "net_percent" | "net_change_percent")}
            className="bg-blue-900/50 border border-blue-700/50 rounded-lg px-3 py-2.5 text-sm text-blue-100 focus:border-yellow-400 focus:outline-none transition-colors w-full sm:w-auto"
          >
            <option value="net_percent">Net %</option>
            <option value="net_change_percent">Net Change %</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="bg-blue-900/50 border border-blue-700/50 rounded-lg px-3 py-2.5 text-sm text-blue-100 focus:border-yellow-400 focus:outline-none transition-colors w-full sm:w-auto"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
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
            key={`${row.symbol}-${row.report_date}-${row.group_type}`}
            className="bg-blue-950/50 border border-blue-800/30 rounded-xl p-4 space-y-3"
          >
            {/* Header: Symbol + Date + Group */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-lg">{row.symbol}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    row.group_type === "Leveraged" 
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}>
                    {row.group_type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-300">
                  <Calendar size={12} />
                  <span>{new Date(row.report_date).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Net Percent Badge */}
              <div className={`flex flex-col items-end px-3 py-2 rounded-lg border ${getNetBadgeStyle(row.net_percent)}`}>
                <span className="text-xs text-blue-300 mb-0.5">Net %</span>
                <span className="font-bold text-lg">{row.net_percent > 0 ? "+" : ""}{row.net_percent.toFixed(1)}%</span>
              </div>
            </div>
            
            {/* Position Sizes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-900/30 rounded-lg p-3">
                <div className="flex items-center gap-1 text-xs text-green-400 mb-1">
                  <TrendingUp size={12} />
                  <span className="uppercase tracking-wider">Longs</span>
                </div>
                <div className="font-semibold text-white text-lg">{row.longs.toLocaleString()}</div>
                <div className="text-xs text-blue-300 mt-1">{row.longs_percent.toFixed(1)}%</div>
              </div>
              <div className="bg-blue-900/30 rounded-lg p-3">
                <div className="flex items-center gap-1 text-xs text-red-400 mb-1">
                  <TrendingDown size={12} />
                  <span className="uppercase tracking-wider">Shorts</span>
                </div>
                <div className="font-semibold text-white text-lg">{row.shorts.toLocaleString()}</div>
                <div className="text-xs text-blue-300 mt-1">{row.shorts_percent.toFixed(1)}%</div>
              </div>
            </div>

            {/* Changes */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between items-center bg-blue-900/20 rounded-lg px-3 py-2">
                <span className="text-blue-300 text-xs">Change Longs</span>
                <span className={row.change_longs > 0 ? "text-green-400" : row.change_longs < 0 ? "text-red-400" : "text-gray-400"}>
                  {row.change_longs > 0 ? "+" : ""}{row.change_longs.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center bg-blue-900/20 rounded-lg px-3 py-2">
                <span className="text-blue-300 text-xs">Change Shorts</span>
                <span className={row.change_shorts > 0 ? "text-green-400" : row.change_shorts < 0 ? "text-red-400" : "text-gray-400"}>
                  {row.change_shorts > 0 ? "+" : ""}{row.change_shorts.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Net Change */}
            <div className="flex justify-between items-center bg-blue-900/30 rounded-lg px-3 py-2 border border-blue-800/30">
              <span className="text-blue-200 text-sm font-medium">Net Change %</span>
              <span className={`font-bold ${getNetColor(row.net_change_percent)}`}>
                {row.net_change_percent > 0 ? "+" : ""}{row.net_change_percent.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-blue-950/50 rounded-2xl border border-blue-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-900/50 text-blue-200 uppercase text-xs whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Symbol</th>
                <th className="px-4 py-3 text-left font-semibold">Group</th>
                <th className="px-4 py-3 text-left font-semibold">Longs</th>
                <th className="px-4 py-3 text-left font-semibold">Shorts</th>
                <th className="px-4 py-3 text-left font-semibold">Change Longs</th>
                <th className="px-4 py-3 text-left font-semibold">Change Shorts</th>
                <th className="px-4 py-3 text-left font-semibold">Longs %</th>
                <th className="px-4 py-3 text-left font-semibold">Shorts %</th>
                <th className="px-4 py-3 text-left font-semibold">Change L %</th>
                <th className="px-4 py-3 text-left font-semibold">Change S %</th>
                <th className="px-4 py-3 text-left font-semibold">Net %</th>
                <th className="px-4 py-3 text-left font-semibold">Net Chg %</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={`${row.symbol}-${row.report_date}-${row.group_type}`}
                  className="border-t border-blue-800/30 hover:bg-blue-900/30 transition"
                >
                  <td className="px-4 py-3 text-blue-200">{new Date(row.report_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-semibold text-white">{row.symbol}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.group_type === "Leveraged" 
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}>
                      {row.group_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-blue-100">{row.longs.toLocaleString()}</td>
                  <td className="px-4 py-3 text-blue-100">{row.shorts.toLocaleString()}</td>
                  <td className={`px-4 py-3 ${row.change_longs > 0 ? "text-green-400" : row.change_longs < 0 ? "text-red-400" : "text-gray-400"}`}>
                    {row.change_longs > 0 ? "+" : ""}{row.change_longs.toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 ${row.change_shorts > 0 ? "text-green-400" : row.change_shorts < 0 ? "text-red-400" : "text-gray-400"}`}>
                    {row.change_shorts > 0 ? "+" : ""}{row.change_shorts.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-blue-200">{row.longs_percent.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-blue-200">{row.shorts_percent.toFixed(1)}%</td>
                  <td className={`px-4 py-3 ${row.change_longs_percent > 0 ? "text-green-400" : row.change_longs_percent < 0 ? "text-red-400" : "text-gray-400"}`}>
                    {row.change_longs_percent > 0 ? "+" : ""}{row.change_longs_percent.toFixed(1)}%
                  </td>
                  <td className={`px-4 py-3 ${row.change_shorts_percent > 0 ? "text-green-400" : row.change_shorts_percent < 0 ? "text-red-400" : "text-gray-400"}`}>
                    {row.change_shorts_percent > 0 ? "+" : ""}{row.change_shorts_percent.toFixed(1)}%
                  </td>
                  <td className={`px-4 py-3 font-bold ${getNetColor(row.net_percent)}`}>
                    {row.net_percent > 0 ? "+" : ""}{row.net_percent.toFixed(1)}%
                  </td>
                  <td className={`px-4 py-3 font-bold ${getNetColor(row.net_change_percent)}`}>
                    {row.net_change_percent > 0 ? "+" : ""}{row.net_change_percent.toFixed(1)}%
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

// Color for Net %
function getNetColor(score: number) {
  if (score > 0) return "text-green-400";
  if (score < 0) return "text-red-400";
  return "text-gray-400";
}

// Badge style for Net % in mobile view
function getNetBadgeStyle(score: number) {
  if (score > 0) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (score < 0) return "bg-red-500/20 text-red-400 border-red-500/30";
  return "bg-gray-500/20 text-gray-400 border-gray-500/30";
}
