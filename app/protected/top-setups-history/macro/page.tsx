"use client";

import { useEffect, useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  annotationPlugin
);

type CurrencyHistory = {
  id: number;
  snapshot_date: string;
  symbol: string;
  eco_total_score: number;
};

export default function CurrencyHistoryChart() {
  const supabase = getSupabaseBrowserClient();

  const [rawData, setRawData] = useState<CurrencyHistory[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // ===============================
  // Fetch Symbols
  // ===============================
  const fetchSymbols = async () => {
  const { data, error } = await supabase
    .from("eco_symbol_daily_history")
    .select("symbol")
    .returns<{ symbol: string }[]>();

  if (error) {
   console.error("Supabase error:", error);
    return;
  }

  const unique = Array.from(
    new Set((data ?? []).map((row) => row.symbol))
  ).sort();

  setSymbols(unique);

  if (unique.length > 0) {
    setSymbol(unique[0]);
  }
};

  // ===============================
  // Fetch Data
  // ===============================
  const fetchData = async () => {
    if (!symbol) return;

    setLoading(true);

    let query = supabase
      .from("eco_symbol_daily_history")
      .select("*")
      .eq("symbol", symbol)
      .order("snapshot_date", { ascending: true });

    if (startDate) {
      query = query.gte(
        "snapshot_date",
        startDate.toISOString().split("T")[0]
      );
    }

    if (endDate) {
      query = query.lte(
        "snapshot_date",
        endDate.toISOString().split("T")[0]
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setRawData([]);
    } else {
      setRawData(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSymbols();
  }, []);

  useEffect(() => {
    fetchData();
  }, [symbol]);

  // ===============================
  // Remove Duplicate symbol+date
  // ===============================
  const data = useMemo(() => {
    const map = new Map<string, CurrencyHistory>();

    rawData.forEach((row) => {
      const key = `${row.symbol}-${row.snapshot_date}`;
      map.set(key, row);
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.snapshot_date).getTime() -
        new Date(b.snapshot_date).getTime()
    );
  }, [rawData]);

  // ===============================
  // Chart Data
  // ===============================
  const chartData = {
    labels: data.map((d) =>
      new Date(d.snapshot_date).toLocaleDateString()
    ),
    datasets: [
      {
        label: "Economic Total Score",
        data: data.map((d) => d.eco_total_score),
        borderColor: "#FACC15",
        backgroundColor: "rgba(250,204,21,0.2)",
        tension: 0.3,
        pointRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Currency History - ${symbol}`,
      },
      annotation: {
        annotations: {
          bullishZone: {
            type: "box",
            yMin: 4,
            backgroundColor: "rgba(59,130,246,0.08)",
          },
          bearishZone: {
            type: "box",
            yMax: -4,
            backgroundColor: "rgba(243,197,15,0.08)",
          },
          strongBullish: {
            type: "line",
            yMin: 10,
            yMax: 10,
            borderColor: "blue",
            borderWidth: 1,
          },
          strongBearish: {
            type: "line",
            yMin: -10,
            yMax: -10,
            borderColor: "yellow",
            borderWidth: 1,
          },
        },
      },
    },
    scales: {
      y: {
        suggestedMin: -10,
        suggestedMax: 10,
        ticks: { stepSize: 2 },
      },
    },
  };

  return (
    <div className="p-6">

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">

        {/* Symbol Dropdown */}
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border p-2 rounded text-white bg-black"
        >
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Date Range Picker */}
        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={(update: any) => {
            setStartDate(update[0]);
            setEndDate(update[1]);
          }}
          isClearable
          placeholderText="Select date range"
          className="border p-2 rounded text-white"
        />

        <button
          onClick={fetchData}
          className="bg-yellow-400 px-4 py-2 rounded font-semibold"
        >
          Apply Filter
        </button>

      </div>

      {/* Chart */}
      {loading ? (
        <p>Loading...</p>
      ) : data.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <div className="h-[500px] w-full">
          <Line data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}