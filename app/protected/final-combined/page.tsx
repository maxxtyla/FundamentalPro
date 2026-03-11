"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Calendar, Users, Activity } from "lucide-react";

// --- TRADINGVIEW SYMBOL MAP ---
const tradingViewMap: Record<string, string> = {
  // Forex Majors
  "EURUSD": "FX:EURUSD",
  "GBPUSD": "FX:GBPUSD",
  "USDJPY": "FX:USDJPY",
  "AUDUSD": "FX:AUDUSD",
  "USDCAD": "FX:USDCAD",
  "USDCHF": "FX:USDCHF",
  "NZDUSD": "FX:NZDUSD",
  // Crosses
  "EURGBP": "FX:EURGBP",
  "EURJPY": "FX:EURJPY",
  "GBPJPY": "FX:GBPJPY",
  "AUDJPY": "FX:AUDJPY",
  // Commodities
  "XAUUSD": "TVC:GOLD",
  "XAGUSD": "TVC:SILVER",
  "WTICO": "TVC:USOIL",
  "BRENT": "TVC:UKOIL",
  // Indices
  "US30": "TVC:DJI",
  "US500": "TVC:SPX",
  "NAS100": "TVC:IXIC",
  "UK100": "TVC:UKX",
  "GER40": "TVC:DAX",
  "JPN225": "TVC:NI225",
  // Crypto
  "BTCUSD": "BINANCE:BTCUSDT",
  "ETHUSD": "BINANCE:ETHUSDT",
};

// --- TRADINGVIEW TICKER TAPE COMPONENT ---
function TradingViewTickerTape({ symbols }: { symbols: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!symbols.length || !containerRef.current) return;

    // Clear previous
    containerRef.current.innerHTML = '';

    const tvSymbols = symbols
      .map(s => tradingViewMap[s])
      .filter(Boolean)
      .map(s => `"${s}"`)
      .join(',');

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: tvSymbols.split(',').map(s => ({
        proName: s.replace(/"/g, ''),
        title: s.replace(/"/g, '').split(':')[1] || s.replace(/"/g, ''),
      })),
      showSymbolLogo: true,
      colorTheme: "dark",
      isTransparent: true,
      displayMode: "compact",
      locale: "en",
    });

    containerRef.current.appendChild(script);
  }, [symbols]);

  if (!symbols.length) return null;

  return (
    <div className="tradingview-widget-container w-full overflow-hidden rounded-lg border border-blue-800/30 bg-blue-950/30">
      <div ref={containerRef} className="tradingview-widget-container__widget h-[60px]" />
    </div>
  );
}

// --- TRADINGVIEW SINGLE SYMBOL INFO ---
function TradingViewSymbolInfo({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = tradingViewMap[symbol] || `FX:${symbol}`;

  useEffect(() => {
    if (!containerRef.current) return;
    
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      colorTheme: "dark",
      isTransparent: true,
      locale: "en",
      width: "100%",
    });

    containerRef.current.appendChild(script);
  }, [symbol, tvSymbol]);

  return (
    <div className="tradingview-widget-container w-full h-[140px] overflow-hidden rounded-lg border border-blue-800/30 bg-blue-950/30">
      <div ref={containerRef} className="tradingview-widget-container__widget w-full h-full" />
    </div>
  );
}

// --- TRADINGVIEW MINI CHART (SPARKLINE) ---
function TradingViewMiniChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = tradingViewMap[symbol] || `FX:${symbol}`;

  useEffect(() => {
    if (!containerRef.current) return;
    
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "1M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
    });

    containerRef.current.appendChild(script);
  }, [symbol, tvSymbol]);

  return (
    <div className="tradingview-widget-container w-24 h-16 overflow-hidden rounded opacity-80 hover:opacity-100 transition-opacity">
      <div ref={containerRef} className="tradingview-widget-container__widget w-full h-full" />
    </div>
  );
}

// --- TRADINGVIEW TECHNICAL ANALYSIS WIDGET ---
function TradingViewTechnicalAnalysis({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = tradingViewMap[symbol] || `FX:${symbol}`;

  useEffect(() => {
    if (!containerRef.current) return;
    
    containerRef.current.innerHTML = '';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: "1D",
      width: "100%",
      isTransparent: true,
      height: "100%",
      symbol: tvSymbol,
      showIntervalTabs: false,
      colorTheme: "dark",
      locale: "en",
    });

    containerRef.current.appendChild(script);
  }, [symbol, tvSymbol]);

  return (
    <div className="tradingview-widget-container w-full h-[280px] overflow-hidden rounded-lg border border-blue-800/30 bg-blue-950/30">
      <div ref={containerRef} className="tradingview-widget-container__widget w-full h-full" />
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
import { useRef } from "react";

type Row = {
  symbol: string;
  cot_score: number;
  pair_score: number;
  sentiment_score: number;
  seasonality_score: number;
  combined_total_score: number;
  overall_bias: string;
  instrument_type: string;
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
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [biasFilter, instrumentFilter, sortOrder]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/combined-scores");
      if (!res.ok) throw new Error("Failed to fetch");
      
      const json = await res.json();
      let processedData: Row[] = json.data || [];
      setLastUpdated(json.last_updated || new Date().toISOString());

      if (biasFilter !== "All") {
        processedData = processedData.filter((row) => row.overall_bias === biasFilter);
      }

      if (instrumentFilter !== "All") {
        processedData = processedData.filter((row) => row.instrument_type === instrumentFilter);
      }

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
    setSelectedSymbol(null);
  }

  // Get symbols for ticker tape
  const topSymbols = data.slice(0, 10).map(r => r.symbol);
  const bullishSymbols = data.filter(r => r.overall_bias.includes("Bullish")).slice(0, 5).map(r => r.symbol);
  const bearishSymbols = data.filter(r => r.overall_bias.includes("Bearish")).slice(0, 5).map(r => r.symbol);

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

      {/* TRADINGVIEW TICKER TAPE - TOP 10 SETUPS */}
      {topSymbols.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
              Live Market Tape — Top Setups
            </span>
          </div>
          <TradingViewTickerTape symbols={topSymbols} />
        </div>
      )}

      {/* BULLISH & BEARISH TICKER TAPES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bullishSymbols.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">
                Bullish Setups Tape
              </span>
            </div>
            <div className="rounded-lg border border-green-500/20 overflow-hidden">
              <TradingViewTickerTape symbols={bullishSymbols} />
            </div>
          </div>
        )}
        
        {bearishSymbols.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Bearish Setups Tape
              </span>
            </div>
            <div className="rounded-lg border border-red-500/20 overflow-hidden">
              <TradingViewTickerTape symbols={bearishSymbols} />
            </div>
          </div>
        )}
      </div>

      {/* SELECTED SYMBOL DETAIL VIEW */}
      {selectedSymbol && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fadeIn">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white">{selectedSymbol} — Technical Analysis</span>
              <button 
                onClick={() => setSelectedSymbol(null)}
                className="text-xs text-blue-400 hover:text-white transition"
              >
                Close ✕
              </button>
            </div>
            <TradingViewTechnicalAnalysis symbol={selectedSymbol} />
          </div>
          <div>
            <div className="text-sm font-bold text-white mb-2">Symbol Info</div>
            <TradingViewSymbolInfo symbol={selectedSymbol} />
          </div>
        </div>
      )}

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
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
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

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="bg-blue-900/50 border border-blue-700/50 rounded-lg px-3 py-2.5 text-sm text-blue-100 focus:border-yellow-400 focus:outline-none transition-colors w-full sm:w-auto"
          >
            <option value="desc">Highest Score</option>
            <option value="asc">Lowest Score</option>
          </select>
        </div>

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
              onClick={() => setSelectedSymbol(row.symbol)}
              className="bg-blue-950/50 border border-blue-800/30 rounded-xl p-4 space-y-3 cursor-pointer hover:border-yellow-400/30 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-lg">{row.symbol}</span>
                  <TradingViewMiniChart symbol={row.symbol} />
                </div>
                <BiasBadge bias={row.overall_bias} />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {row.sentiment_data?.is_contrarian && (
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    row.sentiment_data.contrarian_signal === "bullish" 
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  }`}>
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

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                <div className="text-xs text-yellow-400 mb-1">Combined Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(row.combined_total_score)}`}>
                  {row.combined_total_score > 0 ? "+" : ""}{row.combined_total_score}
                </div>
              </div>
              
              <p className="text-[10px] text-blue-400 text-center">
                Tap for detailed technical analysis
              </p>
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
                <th className="px-4 py-4 text-center font-semibold">Live Chart</th>
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
                  <td colSpan={8} className="text-center py-8 text-blue-300">Loading...</td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.symbol}
                    onClick={() => setSelectedSymbol(row.symbol)}
                    className="border-t border-blue-800/30 hover:bg-blue-900/30 transition cursor-pointer"
                  >
                    <td className="px-4 py-4 font-semibold text-white">
                      {row.symbol}
                    </td>
                    
                    <td className="px-4 py-4">
                      <TradingViewMiniChart symbol={row.symbol} />
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
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease forwards;
        }
      `}</style>
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
