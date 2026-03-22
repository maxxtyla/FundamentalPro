"use client";

import { useEffect, useState } from "react";
import { Search, RotateCcw, TrendingUp, TrendingDown, Clock, AlertTriangle, DollarSign } from "lucide-react";

type SentimentRow = {
  pair: string;
  long_percent: number;
  short_percent: number;
  long_positions: number;
  short_positions: number;
  avg_long_price: number | null;
  avg_short_price: number | null;
  long_price_distance: number | null;
  short_price_distance: number | null;
};

type SentimentResponse = {
  last_updated: string;
  data: SentimentRow[];
};

type BiasType = "bullish" | "bearish" | "contrarian_bullish" | "contrarian_bearish";

export default function SentimentPage() {
  const [data, setData] = useState<SentimentRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("Never");
  const [cacheStatus, setCacheStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "none" | "long70" | "short70" | "sortLongs" | "sortShorts" | "contrarian"
  >("none");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sentiment");
      const cacheHeader = res.headers.get('X-Cache');
      setCacheStatus(cacheHeader || 'UNKNOWN');
      
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      
      const json: SentimentResponse = await res.json();
      
      if (json.data && Array.isArray(json.data)) {
        setData(json.data);
        setLastUpdated(json.last_updated || new Date().toISOString());
      } else {
        console.error("Invalid data format:", json);
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching sentiment data:", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }

  function resetFilters() {
    setSearchQuery("");
    setActiveFilter("none");
  }

  function getContrarianBias(longPercent: number, shortPercent: number): BiasType {
    if (longPercent >= 70) return "contrarian_bearish";
    if (shortPercent >= 70) return "contrarian_bullish";
    if (longPercent > shortPercent) return "bullish";
    return "bearish";
  }

  // Safe number formatter
  function formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined || isNaN(price)) return "N/A";
    return price.toFixed(5);
  }

  const filteredData = (data || []).filter((row) =>
    row?.pair?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  let displayData = [...filteredData];
  
  if (activeFilter === "long70")
    displayData = displayData.filter((row) => row.long_percent >= 70);
  if (activeFilter === "short70")
    displayData = displayData.filter((row) => row.short_percent >= 70);
  if (activeFilter === "contrarian")
    displayData = displayData.filter((row) => 
      row.long_percent >= 70 || row.short_percent >= 70
    );
  if (activeFilter === "sortLongs")
    displayData = [...displayData].sort((a, b) => b.long_percent - a.long_percent);
  if (activeFilter === "sortShorts")
    displayData = [...displayData].sort((a, b) => b.short_percent - a.short_percent);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0">
      
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Retail Sentiment <span className="text-yellow-400">Dashboard</span>
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-blue-300">
            <Clock size={14} />
            <span>Last Updated: {lastUpdated}</span>
          </div>
          {cacheStatus && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              cacheStatus === 'HIT' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              Cache: {cacheStatus}
            </span>
          )}
        </div>
        <p className="text-xs text-blue-400 mt-1">
          <AlertTriangle size={12} className="inline mr-1" />
          Contrarian signals appear when retail is 70% or more positioned one way
        </p>
      </div>

      <div className="bg-blue-950/50 border border-blue-800/50 rounded-2xl p-4 flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
        
        <div className="relative flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
          <input
            type="text"
            placeholder="Search symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-52 bg-blue-900/50 border border-blue-700/50 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white placeholder-blue-400/70 focus:border-yellow-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "long70", label: "70%+ Longs", icon: TrendingUp },
            { key: "short70", label: "70%+ Shorts", icon: TrendingDown },
            { key: "contrarian", label: "Contrarian Signals", icon: AlertTriangle },
            { key: "sortLongs", label: "Sort by Longs", icon: TrendingUp },
            { key: "sortShorts", label: "Sort by Shorts", icon: TrendingDown },
          ].map((btn) => {
            const Icon = btn.icon;
            const isActive = activeFilter === btn.key;
            const isContrarian = btn.key === "contrarian";
            return (
              <button
                key={btn.key}
                onClick={() => setActiveFilter(btn.key as any)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                  ${isActive 
                    ? isContrarian
                      ? "bg-yellow-400 text-blue-950 shadow-lg shadow-yellow-400/20 ring-2 ring-yellow-400/50" 
                      : "bg-yellow-400 text-blue-950 shadow-lg shadow-yellow-400/20"
                    : isContrarian
                      ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-yellow-400 hover:text-blue-950 hover:border-transparent"
                      : "bg-blue-600/80 text-white hover:bg-yellow-400 hover:text-blue-950"
                  }
                `}
              >
                <Icon size={14} />
                {btn.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-800/50 hover:bg-blue-700/50 text-blue-200 border border-blue-700/50 transition whitespace-nowrap w-full sm:w-auto"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayData.length === 0 ? (
          <div className="col-span-full text-center py-12 text-blue-300">
            <p className="text-lg">No data available</p>
            <button 
              onClick={fetchData}
              className="mt-4 text-yellow-400 hover:text-yellow-300 underline"
            >
              Retry
            </button>
          </div>
        ) : (
          displayData.map((row) => {
            if (!row || !row.pair) return null;
            
            const bias = getContrarianBias(row.long_percent || 0, row.short_percent || 0);
            const isContrarian = bias === "contrarian_bullish" || bias === "contrarian_bearish";
            
            const biasConfig = {
              bullish: {
                label: "Bullish Bias",
                borderColor: "border-l-blue-500",
                badgeBg: "bg-blue-500/20",
                badgeText: "text-blue-300",
                badgeBorder: "border-blue-500/30"
              },
              bearish: {
                label: "Bearish Bias",
                borderColor: "border-l-yellow-400",
                badgeBg: "bg-yellow-400/20",
                badgeText: "text-yellow-300",
                badgeBorder: "border-yellow-400/30"
              },
              contrarian_bullish: {
                label: "Contrarian Bullish",
                borderColor: "border-l-green-500",
                badgeBg: "bg-green-500/20",
                badgeText: "text-green-300",
                badgeBorder: "border-green-500/30"
              },
              contrarian_bearish: {
                label: "Contrarian Bearish",
                borderColor: "border-l-red-500",
                badgeBg: "bg-red-500/20",
                badgeText: "text-red-300",
                badgeBorder: "border-red-500/30"
              }
            };

            const config = biasConfig[bias];
            
            // ✅ Safe check for price data existence
            const hasLongPrice = row.avg_long_price !== null && row.avg_long_price !== undefined;
            const hasShortPrice = row.avg_short_price !== null && row.avg_short_price !== undefined;
            const hasPriceData = hasLongPrice || hasShortPrice;

            return (
              <div
                key={row.pair}
                className={`bg-blue-950/50 rounded-xl p-5 border border-blue-800/50 shadow-lg hover:shadow-blue-900/20 hover:border-blue-700/50 transition-all duration-300 ${config.borderColor}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-bold text-lg">{row.pair}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                    {config.label}
                  </span>
                </div>

                {isContrarian && (
                  <div className="mb-4 p-2 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                    <p className="text-xs text-yellow-300 text-center">
                      <AlertTriangle size={12} className="inline mr-1" />
                      Retail is extremely {row.long_percent >= 70 ? "long" : "short"} — consider opposite position
                    </p>
                  </div>
                )}

                {hasPriceData && (
                  <div className="mb-4 p-3 bg-blue-900/30 rounded-lg border border-blue-800/30">
                    <div className="flex items-center gap-2 mb-2 text-blue-300 text-xs uppercase tracking-wider">
                      <DollarSign size={12} />
                      Average Entry Prices
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {hasLongPrice && (
                        <div>
                          <div className="text-xs text-blue-400 mb-1">Avg Long</div>
                          <div className="text-sm font-semibold text-white">
                            {formatPrice(row.avg_long_price)}
                          </div>
                          {row.long_price_distance !== null && row.long_price_distance !== undefined && (
                            <div className={`text-xs ${
                              row.long_price_distance > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {row.long_price_distance > 0 ? '+' : ''}
                              {row.long_price_distance.toFixed(1)} pips
                            </div>
                          )}
                        </div>
                      )}
                      {hasShortPrice && (
                        <div>
                          <div className="text-xs text-yellow-400/70 mb-1">Avg Short</div>
                          <div className="text-sm font-semibold text-white">
                            {formatPrice(row.avg_short_price)}
                          </div>
                          {row.short_price_distance !== null && row.short_price_distance !== undefined && (
                            <div className={`text-xs ${
                              row.short_price_distance > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {row.short_price_distance > 0 ? '+' : ''}
                              {row.short_price_distance.toFixed(1)} pips
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300 flex items-center gap-1">
                      <TrendingUp size={14} className="text-blue-400" />
                      Longs
                    </span>
                    <span className={`font-semibold ${(row.long_percent || 0) >= 70 ? "text-red-400" : "text-white"}`}>
                      {row.long_percent}%
                      {(row.long_percent || 0) >= 70 && " ⚠️"}
                    </span>
                  </div>
                  <div className="bg-blue-900/50 h-8 rounded-lg overflow-hidden border border-blue-800/30">
                    <div
                      className={`h-full flex items-center justify-center text-blue-950 font-bold text-sm transition-all duration-500 ${
                        (row.long_percent || 0) >= 70 
                          ? "bg-gradient-to-r from-red-600 to-red-500" 
                          : "bg-gradient-to-r from-blue-600 to-blue-500"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, row.long_percent || 0))}%` }}
                    >
                      {(row.long_percent || 0) >= 20 && `${row.long_percent}%`}
                    </div>
                  </div>
                  <div className="text-xs text-blue-400 text-right">
                    {(row.long_positions || 0).toLocaleString()} positions
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-300 flex items-center gap-1">
                      <TrendingDown size={14} className="text-yellow-400" />
                      Shorts
                    </span>
                    <span className={`font-semibold ${(row.short_percent || 0) >= 70 ? "text-green-400" : "text-white"}`}>
                      {row.short_percent}%
                      {(row.short_percent || 0) >= 70 && " ⚠️"}
                    </span>
                  </div>
                  <div className="bg-blue-900/50 h-8 rounded-lg overflow-hidden border border-blue-800/30">
                    <div
                      className={`h-full flex items-center justify-center text-blue-950 font-bold text-sm transition-all duration-500 ${
                        (row.short_percent || 0) >= 70 
                          ? "bg-gradient-to-r from-green-500 to-green-400" 
                          : "bg-gradient-to-r from-yellow-400 to-yellow-300"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, row.short_percent || 0))}%` }}
                    >
                      {(row.short_percent || 0) >= 20 && `${row.short_percent}%`}
                    </div>
                  </div>
                  <div className="text-xs text-yellow-400/80 text-right">
                    {(row.short_positions || 0).toLocaleString()} positions
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {displayData.length === 0 && !isLoading && (
        <div className="text-center py-12 text-blue-300">
          <p className="text-lg">No data matches your filters</p>
          <button 
            onClick={resetFilters}
            className="mt-4 text-yellow-400 hover:text-yellow-300 underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
