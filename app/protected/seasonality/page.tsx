"use client";

/**
 * Seasonality Dashboard
 * ─────────────────────
 * Click any card → full-screen expanded view for that symbol.
 * ESC or ✕ to close. Search + category tabs + sort always retained.
 *
 * File layout:
 *   app/api/seasonality/route.ts     ← API route
 *   app/data/seasonality/*.csv       ← CSV files
 *   app/seasonality/page.tsx         ← THIS FILE
 */

import { useEffect, useRef, useState, useMemo, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface MonthData { month: string; avg_return: number | null; }
interface SymbolData { symbol: string; monthly: MonthData[]; error?: string; }

// ── Constants ──────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const ALL_SYMBOLS = [
  "USDJPY","USDCAD","USDCHF","AUDCAD","AUDCHF","AUDJPY","AUDNZD","AUDUSD",
  "CADCHF","CADJPY","CHFJPY","EURAUD","EURCAD","EURCHF","EURGBP","EURJPY",
  "EURNZD","EURUSD","GBPAUD","GBPCAD","GBPCHF","GBPJPY","GBPNZD","GBPUSD",
  "NZDCAD","NZDCHF","NZDJPY","NZDUSD","XAUUSD","SP500","NAS100","RUSSELL",
  "SILVER","NIKKEI","GER40","BTCUSD",
];

const CATEGORIES: Record<string, string[]> = {
  "Major FX":    ["EURUSD","GBPUSD","USDJPY","USDCAD","USDCHF","AUDUSD","NZDUSD"],
  "Cross FX":    ["EURJPY","EURGBP","EURAUD","EURCAD","EURCHF","EURNZD",
                  "GBPJPY","GBPAUD","GBPCAD","GBPCHF","GBPNZD",
                  "AUDJPY","AUDCAD","AUDCHF","AUDNZD",
                  "CADJPY","CADCHF","CHFJPY","NZDJPY","NZDCAD","NZDCHF"],
  "Indices":     ["SP500","NAS100","RUSSELL","NIKKEI","GER40"],
  "Commodities": ["XAUUSD","SILVER"],
  "Crypto":      ["BTCUSD"],
};

// ── Cache + fetch ──────────────────────────────────────────────────────────────
const cache: Record<string, SymbolData> = {};
async function loadSymbol(symbol: string): Promise<SymbolData> {
  if (cache[symbol]) return cache[symbol];
  try {
    const res = await fetch(`/api/seasonality?symbol=${symbol}`);
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error ?? `HTTP ${res.status}`); }
    const d: SymbolData = await res.json();
    cache[symbol] = d; return d;
  } catch (e: unknown) {
    const d: SymbolData = { symbol, monthly: MONTHS.map(m=>({month:m,avg_return:null})), error: e instanceof Error ? e.message : String(e) };
    cache[symbol] = d; return d;
  }
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton({ h = 162 }: { h?: number }) {
  return (
    <div className="bg-blue-950/10 border border-blue-900/30 rounded-lg p-3 overflow-hidden" style={{ height: h }}>
      <div className="flex gap-2 mb-3">
        <div className="w-16 h-3 rounded bg-blue-900/40 animate-pulse"/>
        <div className="w-8 h-2 rounded bg-blue-900/25 animate-pulse"/>
      </div>
      <div className="flex items-end gap-1" style={{ height: h - 60 }}>
        {MONTHS.map((m,i)=>(
          <div key={m} className="flex-1 rounded-t bg-blue-900/30 animate-pulse" style={{ height: `${22+((i*19+11)%58)}%`, animationDelay: `${i*0.06}s` }}/>
        ))}
      </div>
    </div>
  );
}

// ── Small grid card ────────────────────────────────────────────────────────────
function GridCard({ data, onClick }: { data: SymbolData; onClick: () => void }) {
  const vals   = data.monthly.map(m => m.avg_return ?? 0);
  const maxAbs = Math.max(...vals.map(Math.abs), 0.001);
  const BAR_H  = 72;

  return (
    <div
      onClick={onClick}
      className="bg-white/[0.02] border border-blue-900/50 rounded-lg p-3 pb-2 cursor-pointer transition-all duration-200 hover:border-blue-500/70 hover:-translate-y-0.5 hover:shadow-2xl"
    >
      {/* header */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-sans text-sm font-bold text-slate-200 tracking-wide">
          {data.symbol}
        </span>
        {data.error
          ? <span className="text-[9px] text-red-400">⚠ no data</span>
          : <span className="text-[9px] text-blue-900 hidden sm:inline">click to expand</span>
        }
      </div>

      {/* bars */}
      <div className="flex gap-1" style={{ height: BAR_H + 16 }}>
        {data.monthly.map(m => {
          const val     = m.avg_return ?? 0;
          const bullish = val >= 0;
          const barH    = Math.max(Math.abs(val/maxAbs)*(BAR_H/2), val!==0?2:0);
          const color   = bullish ? "bg-blue-500" : "bg-yellow-400";
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center">
              <div className="flex-1 flex items-end w-full">
                {bullish && <div className={`w-full rounded-t ${color} bg-gradient-to-t from-current to-current/60`} style={{ height: barH }}/>}
              </div>
              <div className="w-full h-px bg-slate-700/85"/>
              <div className="flex-1 flex items-start w-full">
                {!bullish && <div className={`w-full rounded-b ${color} bg-gradient-to-b from-current to-current/60`} style={{ height: barH }}/>}
              </div>
              <div className="text-[6px] sm:text-[7px] text-slate-700 mt-0.5 uppercase">{m.month[0]}</div>
            </div>
          );
        })}
      </div>

      {/* values */}
      <div className="flex gap-1 mt-1">
        {data.monthly.map(m => {
          const v = m.avg_return;
          return (
            <div key={m.month} className="flex-1 text-[6px] sm:text-[7px] text-center font-semibold text-blue-900">
              {v===null?"–":`${v>=0?"+":""}${v.toFixed(1)}`}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Expanded modal ─────────────────────────────────────────────────────────────
function ExpandedView({ data, onClose }: { data: SymbolData; onClose: () => void }) {
  const [tip, setTip] = useState<{ month: string; val: number } | null>(null);

  const vals        = data.monthly.map(m => m.avg_return ?? 0);
  const maxAbs      = Math.max(...vals.map(Math.abs), 0.001);
  const BAR_H       = 200;
  const bullishCount= vals.filter(v => v > 0).length;
  const best        = data.monthly.reduce((a,b) => (b.avg_return??-Infinity)>(a.avg_return??-Infinity)?b:a);
  const worst       = data.monthly.reduce((a,b) => (b.avg_return?? Infinity)<(a.avg_return?? Infinity)?b:a);
  const avgReturn   = vals.filter(v=>v!==0).reduce((a,b)=>a+b,0) / (vals.filter(v=>v!==0).length||1);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key==="Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-950 to-slate-900 border border-blue-500/40 rounded-xl p-5 sm:p-8 shadow-2xl animate-slide-in relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 rounded-md bg-white/5 border border-blue-500/30 text-slate-500 hover:text-slate-200 hover:border-blue-500/60 transition-all flex items-center justify-center text-lg"
        >✕</button>

        {/* Symbol header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            <span className="font-sans text-2xl sm:text-4xl font-bold text-slate-200 tracking-tight">
              {data.symbol}
            </span>
            <span className="text-xs sm:text-sm text-slate-700 uppercase tracking-widest">
              Seasonality · 2015–2025
            </span>
          </div>

          {/* Stat pills */}
          {!data.error && (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[
                { label:"Best Month",  value:`${best.month}  ${best.avg_return!=null?`+${best.avg_return.toFixed(2)}%`:""}`,  color:"text-blue-300" },
                { label:"Worst Month", value:`${worst.month}  ${worst.avg_return!=null?`${worst.avg_return.toFixed(2)}%`:""}`, color:"text-yellow-300" },
                { label:"Bullish Months", value:`${bullishCount} / 12`,    color:"text-blue-300" },
                { label:"Avg Return", value:`${avgReturn>=0?"+":""}${avgReturn.toFixed(3)}%`, color: avgReturn>=0?"text-blue-300":"text-yellow-300" },
              ].map(s => (
                <div key={s.label} className="bg-blue-900/25 border border-blue-900/50 rounded-md px-3 py-1.5">
                  <div className="text-[8px] sm:text-[9px] text-slate-700 uppercase tracking-wider mb-0.5">{s.label}</div>
                  <div className={`text-xs sm:text-sm font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tooltip */}
        {tip && (
          <div className="absolute top-20 sm:top-28 left-1/2 -translate-x-1/2 bg-slate-950 border border-blue-500/50 rounded-md px-4 py-2 z-10 text-sm shadow-2xl whitespace-nowrap pointer-events-none">
            <span className="text-slate-500 mr-2">{tip.month}</span>
            <span className={`font-bold text-base ${tip.val>=0?"text-blue-300":"text-yellow-300"}`}>
              {tip.val>=0?"+":""}{tip.val.toFixed(3)}%
            </span>
          </div>
        )}

        {/* Big bar chart */}
        <div
          className="flex gap-1 sm:gap-2 mb-2"
          style={{ height: BAR_H + 24 }}
          onMouseLeave={() => setTip(null)}
        >
          {data.monthly.map(m => {
            const val     = m.avg_return ?? 0;
            const bullish = val >= 0;
            const barH    = Math.max(Math.abs(val/maxAbs)*(BAR_H/2), val!==0?3:0);
            const color   = bullish ? "bg-blue-500" : "bg-yellow-400";
            const glow    = bullish ? "shadow-blue-500/40" : "shadow-yellow-400/40";
            const active  = tip?.month === m.month;

            return (
              <div
                key={m.month}
                onMouseEnter={() => setTip({ month:m.month, val })}
                className={`flex-1 flex flex-col items-center cursor-crosshair transition-opacity ${tip && !active ? 'opacity-55' : 'opacity-100'}`}
              >
                {/* positive half */}
                <div className="flex-1 flex items-end w-full">
                  {bullish && (
                    <div className={`w-full rounded-t ${color} bg-gradient-to-t from-current to-current/60 ${active ? `shadow-[0_-3px_14px_rgba(0,0,0,0.3)] ${glow}` : ''} transition-shadow`} style={{ height: barH }}/>
                  )}
                </div>
                {/* zero line */}
                <div className="w-full h-px bg-slate-700/90 flex-shrink-0"/>
                {/* negative half */}
                <div className="flex-1 flex items-start w-full">
                  {!bullish && (
                    <div className={`w-full rounded-b ${color} bg-gradient-to-b from-current to-current/60 ${active ? `shadow-[0_3px_14px_rgba(0,0,0,0.3)] ${glow}` : ''} transition-shadow`} style={{ height: barH }}/>
                  )}
                </div>
                {/* month label */}
                <div className={`text-[8px] sm:text-xs mt-1 uppercase tracking-wider flex-shrink-0 ${active ? 'text-slate-400 font-semibold' : 'text-slate-600'}`}>
                  {m.month}
                </div>
              </div>
            );
          })}
        </div>

        {/* Return values row */}
        <div className="flex gap-1 sm:gap-2 mb-4">
          {data.monthly.map(m => {
            const v = m.avg_return;
            const active = tip?.month === m.month;
            return (
              <div key={m.month} className={`flex-1 text-center font-semibold transition-all text-[8px] sm:text-xs ${active ? 'font-bold scale-110' : ''} ${v===null?"text-blue-950":v>=0?"text-blue-300":"text-yellow-300"}`}>
                {v===null?"–":`${v>=0?"+":""}${v.toFixed(2)}`}
              </div>
            );
          })}
        </div>

        {/* Bias bar */}
        {!data.error && (
          <div className="mt-4 sm:mt-6">
            <div className="flex justify-between text-[8px] sm:text-[9px] text-slate-700 mb-1 uppercase tracking-wider">
              <span>BEARISH  {12-bullishCount} months</span>
              <span className="text-slate-600">MONTHLY DIRECTIONAL BIAS</span>
              <span>BULLISH  {bullishCount} months</span>
            </div>
            <div className="h-1.5 rounded-full bg-blue-900/40 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-800 to-blue-400 rounded-full transition-all duration-500" style={{ width: `${(bullishCount/12)*100}%` }}/>
            </div>
          </div>
        )}

        {/* ESC hint */}
        <div className="mt-4 text-right text-[8px] sm:text-[9px] text-blue-950 uppercase tracking-widest">
          ESC TO CLOSE
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SeasonalityPage() {
  const [activeCategory, setActiveCategory] = useState("Major FX");
  const [sortBy, setSortBy]   = useState<"symbol"|"best"|"worst">("symbol");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string|null>(null);

  const [gridData,    setGridData]    = useState<Record<string, SymbolData>>({});
  const [gridLoading, setGridLoading] = useState<Record<string, boolean>>({});

  const [searchResult,  setSearchResult]  = useState<SymbolData|null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Expanded symbol
  const [expanded, setExpanded] = useState<SymbolData|null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load category
  useEffect(() => {
    (CATEGORIES[activeCategory]??[]).forEach(sym => {
      if (gridData[sym]!==undefined || gridLoading[sym]) return;
      setGridLoading(p=>({...p,[sym]:true}));
      loadSymbol(sym).then(d => {
        setGridData(p=>({...p,[sym]:d}));
        setGridLoading(p=>({...p,[sym]:false}));
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const handleSearch = async () => {
    const q = searchInput.trim().toUpperCase();
    if (!q) { clearSearch(); return; }
    if (!ALL_SYMBOLS.includes(q)) {
      setSearchError(`"${searchInput.trim()}" not found. Try EURUSD, XAUUSD, SP500…`);
      setSearchResult(null); setSearchQuery(""); return;
    }
    setSearchError(null); setSearchQuery(q); setSearchLoading(true);
    const d = await loadSymbol(q);
    setSearchResult(d); setSearchLoading(false);
    // Auto-expand
    setExpanded(d);
  };

  const clearSearch = () => {
    setSearchInput(""); setSearchQuery(""); setSearchResult(null);
    setSearchError(null); inputRef.current?.focus();
  };

  const handleCardClick = useCallback(async (sym: string) => {
    // If already loaded, expand immediately
    const cached = cache[sym];
    if (cached) { setExpanded(cached); return; }
    // Else fetch first
    const d = await loadSymbol(sym);
    setExpanded(d);
  }, []);

  const categorySorted = useMemo(() => {
    const syms = CATEGORIES[activeCategory] ?? [];
    let items = syms.map(sym => ({ sym, data:gridData[sym]??null, loading:!!gridLoading[sym] }));
    if (sortBy==="best") {
      items = [...items].sort((a,b) => {
        if (!a.data||!b.data) return 0;
        return Math.max(...b.data.monthly.map(m=>m.avg_return??-Infinity))
             - Math.max(...a.data.monthly.map(m=>m.avg_return??-Infinity));
      });
    } else if (sortBy==="worst") {
      items = [...items].sort((a,b) => {
        if (!a.data||!b.data) return 0;
        return Math.min(...a.data.monthly.map(m=>m.avg_return??Infinity))
             - Math.min(...b.data.monthly.map(m=>m.avg_return??Infinity));
      });
    }
    return items;
  }, [activeCategory, gridData, gridLoading, sortBy]);

  const isSearchMode = !!searchQuery;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-mono text-slate-200">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;600;700&display=swap');
        @keyframes fadeIn {from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
        @keyframes slideIn{from{opacity:0;transform:scale(0.96);}to{opacity:1;transform:scale(1);}}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 10px rgba(234,179,8,0.3);}50%{box-shadow:0 0 22px rgba(234,179,8,0.6);}}
        .animate-fade-in{animation:fadeIn 0.3s ease both;}
        .animate-slide-in{animation:slideIn 0.25s ease both;}
      `}</style>

      <div className="fixed inset-0 pointer-events-none z-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,50,0.03)_2px,rgba(0,0,50,0.03)_4px)]"/>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-extrabold text-xs px-3 py-1.5 rounded tracking-wider animate-[pulse-glow_2.5s_infinite]">SEASONALITY</div>
            <div className="hidden sm:block w-px h-6 bg-yellow-400/30"/>
            <span className="text-slate-500 text-xs uppercase tracking-widest">10-Year Average Monthly Returns</span>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent tracking-tight">
            Market Seasonality
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 tracking-wide">
            2015–2025 · {ALL_SYMBOLS.length} instruments · click any card to expand
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-5 animate-fade-in flex-wrap">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(CATEGORIES).map(cat => (
              <button 
                key={cat} 
                onClick={()=>setActiveCategory(cat)} 
                className={`px-3 py-1.5 rounded text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all border ${activeCategory===cat ? 'border-yellow-400 bg-yellow-400/15 text-yellow-300' : 'border-blue-500/30 bg-white/5 text-slate-500 hover:border-blue-500/50'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort buttons */}
          <div className="flex gap-2">
            {(["symbol","best","worst"] as const).map(s => (
              <button 
                key={s} 
                onClick={()=>setSortBy(s)} 
                className={`px-2.5 py-1.5 rounded text-[10px] font-semibold tracking-wide transition-all border ${sortBy===s ? 'border-blue-500/60 bg-blue-500/15 text-blue-300' : 'border-blue-900/50 bg-transparent text-slate-600 hover:text-slate-400'}`}
              >
                {s==="symbol"?"A–Z":s==="best"?"Best ↑":"Worst ↓"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="sm:ml-auto flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex items-center flex-1 sm:flex-none">
              <input 
                ref={inputRef} 
                value={searchInput}
                onChange={e=>{setSearchInput(e.target.value);if(!e.target.value.trim())clearSearch();}}
                onKeyDown={e=>{if(e.key==="Enter")handleSearch();}}
                placeholder="e.g. EURUSD, XAUUSD…"
                className={`bg-white/5 border rounded-md py-2 pl-3 pr-8 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/70 w-full sm:w-56 transition-all ${isSearchMode ? 'border-yellow-400/70' : 'border-blue-500/40'}`}
              />
              {searchInput && (
                <span 
                  onClick={clearSearch} 
                  className="absolute right-2 text-slate-600 hover:text-slate-300 cursor-pointer text-sm"
                >✕</span>
              )}
            </div>
            <button 
              onClick={handleSearch} 
              className="px-4 py-2 rounded-md border border-blue-500/50 bg-blue-500/15 text-blue-300 text-xs font-bold uppercase tracking-wider hover:bg-blue-500/25 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {searchLoading ? <span className="inline-block animate-spin">↻</span> : "⌕"} 
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </div>

        {searchError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2 text-red-300 text-xs mb-4 animate-fade-in">
            {searchError}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 sm:gap-6 items-center mb-5 animate-fade-in text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-blue-500"/>
            <span className="text-slate-500">Bullish avg month</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-yellow-400"/>
            <span className="text-slate-500">Bearish avg month</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">Click any card to expand</span>
        </div>

        {/* Category grid */}
        <div>
          <div className="flex items-center gap-3 mb-4 pb-2 border-b border-blue-900/50 animate-fade-in">
            <div className="w-1 h-4 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"/>
            <span className="font-sans text-sm font-semibold text-blue-300 uppercase tracking-wider">{activeCategory}</span>
            <span className="text-xs text-slate-700">— {(CATEGORIES[activeCategory]??[]).length} instruments</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 animate-fade-in">
            {categorySorted.map(({sym,data,loading},i) => (
              <div key={sym} className="animate-fade-in" style={{ animationDelay: `${i*0.03}s` }}>
                {loading||data===null
                  ? <div className="cursor-wait"><Skeleton/></div>
                  : <GridCard data={data} onClick={()=>handleCardClick(sym)}/>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-blue-900/40 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] sm:text-xs text-blue-950">
          <span className="uppercase tracking-widest">SEASONALITY DASHBOARD · {ALL_SYMBOLS.length} INSTRUMENTS · 2015–2025</span>
          <span>Source: Yahoo Finance ·</span>
        </div>
      </div>

      {/* Expanded modal */}
      {expanded && <ExpandedView data={expanded} onClose={()=>setExpanded(null)}/>}
    </div>
  );
}
