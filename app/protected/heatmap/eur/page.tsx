"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Impact = "bullish" | "bearish" | "neutral";
type MetricType = "Growth" | "Inflation" | "Interest Rates" | "Labour Market";

interface HeatmapEntry {
  id: number;
  metric: string;
  release_date: string;
  currency: string;
  actual_value: string;
  forecast_value: string;
  previous_value: string;
  value_type: string;
  eur_impact: Impact;
  eur_stocks_impact: Impact;
  metric_type: MetricType;
}

// ── Constants ────────────────────────────────────────────────────────────────
const METRIC_TYPES: MetricType[] = ["Growth", "Inflation", "Labour Market", "Interest Rates"];

const CATEGORY_COLORS: Record<MetricType, string> = {
  Growth: "#1d4ed8",
  Inflation: "#1e40af",
  "Labour Market": "#172554",
  "Interest Rates": "#1e3a8a",
};

// ── Helper components ────────────────────────────────────────────────────────
const ImpactBadge = ({ impact }: { impact: Impact }) => {
  const styles = {
    bullish: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    bearish: "bg-yellow-400/20 text-yellow-300 border-yellow-400/40",
    neutral: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  const icons = {
    bullish: <TrendingUp size={12} />,
    bearish: <TrendingDown size={12} />,
    neutral: <Minus size={12} />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${styles[impact]}`}>
      {icons[impact]}
      {impact}
    </span>
  );
};

const formatValue = (val: string, type: string) => {
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  if (Math.abs(num) >= 1000) return num.toLocaleString();
  return type === "percent" ? `${num}%` : `${num}`;
};

const VsDiff = ({ actual, forecast, type }: { actual: string; forecast: string; type: string }) => {
  const a = parseFloat(actual);
  const f = parseFloat(forecast);
  if (isNaN(a) || isNaN(f)) return null;
  const diff = a - f;
  const colorClass = diff > 0 ? "text-yellow-300" : diff < 0 ? "text-blue-300" : "text-slate-400";
  const sign = diff > 0 ? "+" : "";
  return (
    <span className={`text-xs font-semibold ${colorClass}`}>
      {sign}{type === "percent" ? `${diff.toFixed(2)}%` : diff.toFixed(2)}
    </span>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
export default function EURHeatmapPage() {
  const supabase = getSupabaseBrowserClient();
  const [data, setData] = useState<HeatmapEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MetricType | "All">("All");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: sbError } = await supabase
        .from("eur_heatmap_view")
        .select("*")
        .order("id");

      if (sbError) throw new Error(sbError.message);
      setData((rows ?? []) as HeatmapEntry[]);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = activeFilter === "All" ? data : data.filter((d) => d.metric_type === activeFilter);

  const grouped = METRIC_TYPES.reduce<Record<MetricType, HeatmapEntry[]>>((acc, t) => {
    acc[t] = filtered.filter((d) => d.metric_type === t);
    return acc;
  }, {} as Record<MetricType, HeatmapEntry[]>);

  const impactCounts = {
    bullish: data.filter((d) => d.eur_impact === "bullish").length,
    bearish: data.filter((d) => d.eur_impact === "bearish").length,
    neutral: data.filter((d) => d.eur_impact === "neutral").length,
  };

  const sentiment = impactCounts.bullish > impactCounts.bearish
    ? "bullish"
    : impactCounts.bearish > impactCounts.bullish
    ? "bearish"
    : "neutral";

  const total = impactCounts.bullish + impactCounts.bearish + impactCounts.neutral;
  const dominantCount = sentiment === "bullish" ? impactCounts.bullish : sentiment === "bearish" ? impactCounts.bearish : impactCounts.neutral;
  const pct = total > 0 ? Math.round((dominantCount / total) * 100) : 0;

  const sentimentConfig = {
    bullish: {
      icon: <TrendingUp size={24} />,
      label: "OVERALL BULLISH",
      desc: "Macro conditions favour EUR strength.",
      color: "text-blue-300",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      bar: "bg-blue-500",
    },
    bearish: {
      icon: <TrendingDown size={24} />,
      label: "OVERALL BEARISH",
      desc: "Macro conditions weigh on EUR.",
      color: "text-yellow-300",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/30",
      bar: "bg-yellow-400",
    },
    neutral: {
      icon: <Minus size={24} />,
      label: "OVERALL NEUTRAL",
      desc: "No clear directional bias for EUR.",
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/30",
      bar: "bg-slate-500",
    },
  }[sentiment];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* ── Header ── */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-extrabold text-xs sm:text-sm px-3 py-1.5 rounded shadow-lg shadow-yellow-400/20 animate-pulse">
              EUR
            </div>
            <div className="hidden sm:block w-px h-6 bg-yellow-400/30" />
            <span className="text-slate-500 text-xs sm:text-sm uppercase tracking-widest">
              Economic Indicators
            </span>
            <div className="sm:ml-auto flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
              {lastUpdated && (
                <span className="text-xs text-slate-600">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg px-3 py-1.5 text-xs text-blue-300 transition disabled:opacity-50"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">REFRESH</span>
              </button>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent">
            Market Impact Heatmap
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-2">
            Euro · Macro Dashboard · Q1 2026
          </p>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs font-semibold transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          {[
            { label: "Bullish", count: impactCounts.bullish, color: "text-blue-300", bg: "bg-blue-500/10", border: "border-blue-500/20", icon: TrendingUp },
            { label: "Bearish", count: impactCounts.bearish, color: "text-yellow-300", bg: "bg-yellow-400/10", border: "border-yellow-400/20", icon: TrendingDown },
            { label: "Neutral", count: impactCounts.neutral, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Minus },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.bg} ${s.border} border rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3`}
            >
              <s.icon size={20} className={`${s.color} hidden sm:block`} />
              <div>
                {loading ? (
                  <div className="w-8 h-6 bg-slate-800 rounded animate-pulse" />
                ) : (
                  <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.count}</div>
                )}
                <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Overall Sentiment Banner ── */}
        {!loading && data.length > 0 && (
          <div className={`${sentimentConfig.bg} ${sentimentConfig.border} border rounded-lg p-4 sm:p-6 mb-6 relative overflow-hidden`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${sentimentConfig.bar}`} />
            <div className="flex items-start sm:items-center gap-4">
              <div className={`${sentimentConfig.color} hidden sm:block`}>
                {sentimentConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`font-bold text-sm sm:text-base uppercase tracking-wider ${sentimentConfig.color}`}>
                    {sentimentConfig.label}
                  </span>
                  <span className={`${sentimentConfig.bg} ${sentimentConfig.border} border px-2 py-0.5 rounded text-xs font-bold ${sentimentConfig.color}`}>
                    {pct}% of signals
                  </span>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm">
                  {sentimentConfig.desc}
                </p>
                {/* Mini bar chart */}
                <div className="flex items-center gap-1 mt-3">
                  {[
                    { count: impactCounts.bullish, color: "bg-blue-500", label: "B" },
                    { count: impactCounts.bearish, color: "bg-yellow-400", label: "Be" },
                    { count: impactCounts.neutral, color: "bg-slate-600", label: "N" },
                  ].map((seg) => (
                    <div
                      key={seg.label}
                      className={`h-1.5 rounded-full ${seg.color} transition-all duration-500`}
                      style={{ width: `${(seg.count / total) * 100}px` }}
                      title={`${seg.count} signals`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-600 ml-2">
                    {impactCounts.bullish}↑ · {impactCounts.bearish}↓ · {impactCounts.neutral}–
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["All", ...METRIC_TYPES] as (MetricType | "All")[]).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold uppercase tracking-wider transition
                ${activeFilter === f 
                  ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40" 
                  : "bg-slate-800/50 text-slate-500 border border-slate-700 hover:border-slate-600"
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Heatmap Content ── */}
        <div className="space-y-6">
          {loading
            ? METRIC_TYPES.map((type) => (
                <div key={type} className="animate-pulse">
                  <div className="h-4 w-24 bg-slate-800 rounded mb-4" />
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-12 bg-slate-800/50 rounded" />
                    ))}
                  </div>
                </div>
              ))
            : METRIC_TYPES.map((type) => {
                const rows = grouped[type];
                if (!rows || rows.length === 0) return null;
                return (
                  <div key={type}>
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-3 pb-2 border-b border-slate-800">
                      <div 
                        className="w-1 h-4 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[type], boxShadow: `0 0 8px ${CATEGORY_COLORS[type]}` }}
                      />
                      <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">
                        {type}
                      </span>
                      <span className="ml-auto text-xs text-slate-600">
                        {rows.length} indicator{rows.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Mobile Cards */}
                    <div className="lg:hidden space-y-3">
                      {rows.map((row) => (
                        <div 
                          key={row.id}
                          className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-3 hover:border-slate-700 transition"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-white text-sm">{row.metric}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {new Date(row.release_date).toLocaleDateString("en-EU", { 
                                  day: "2-digit", 
                                  month: "short", 
                                  year: "numeric" 
                                })}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <ImpactBadge impact={row.eur_impact} />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-800/50 rounded p-2">
                              <div className="text-[10px] text-slate-500 uppercase">Actual</div>
                              <div className="text-sm font-bold text-yellow-300">
                                {formatValue(row.actual_value, row.value_type)}
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded p-2">
                              <div className="text-[10px] text-slate-500 uppercase">Forecast</div>
                              <div className="text-sm text-slate-400">
                                {formatValue(row.forecast_value, row.value_type)}
                              </div>
                            </div>
                            <div className="bg-slate-800/50 rounded p-2">
                              <div className="text-[10px] text-slate-500 uppercase">Previous</div>
                              <div className="text-sm text-slate-400">
                                {formatValue(row.previous_value, row.value_type)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">vs Forecast:</span>
                              <VsDiff actual={row.actual_value} forecast={row.forecast_value} type={row.value_type} />
                            </div>
                            <ImpactBadge impact={row.eur_stocks_impact} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            {["Metric", "Date", "Actual", "Forecast", "Previous", "vs Fcst", "EUR", "Stocks"].map((h) => (
                              <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr 
                              key={row.id}
                              className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                            >
                              <td className="py-3 px-4 font-medium text-white whitespace-nowrap">{row.metric}</td>
                              <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                                {new Date(row.release_date).toLocaleDateString("en-EU", { 
                                  day: "2-digit", 
                                  month: "short", 
                                  year: "numeric" 
                                })}
                              </td>
                              <td className="py-3 px-4 font-bold text-yellow-300 whitespace-nowrap">
                                {formatValue(row.actual_value, row.value_type)}
                              </td>
                              <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                                {formatValue(row.forecast_value, row.value_type)}
                              </td>
                              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                {formatValue(row.previous_value, row.value_type)}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <VsDiff actual={row.actual_value} forecast={row.forecast_value} type={row.value_type} />
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <ImpactBadge impact={row.eur_impact} />
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <ImpactBadge impact={row.eur_stocks_impact} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* ── Footer ── */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <span className="uppercase tracking-widest">
            EUR Macro Heatmap · {loading ? "—" : data.length} Indicators
          </span>
          <div className="flex gap-4">
            {[
              { dot: "bg-blue-500", label: "Bullish" },
              { dot: "bg-yellow-400", label: "Bearish" },
              { dot: "bg-slate-600", label: "Neutral" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${l.dot}`} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
