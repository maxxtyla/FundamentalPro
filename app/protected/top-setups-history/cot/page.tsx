"use client";

import { useEffect, useState, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

type COTRecord = {
  id: number;
  snapshot_date: string;
  report_date: string;
  symbol: string;
  group_type: string;
  longs: number;
  shorts: number;
  net_percent: number;
};

export default function COTStackedChart() {
  const supabase = getSupabaseBrowserClient();

  const [rawData, setRawData] = useState<COTRecord[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbol, setSymbol] = useState<string>("");
  const [groupType, setGroupType] = useState<string>("Institutional");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch unique symbols
  
 const fetchSymbols = async () => {
  const { data, error } = await supabase
    .from("cot_report_weekly_history")
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

  // Fetch COT data
  const fetchData = async () => {
    if (!symbol) return;
    setLoading(true);

    let query = supabase
      .from("cot_report_weekly_history")
      .select("*")
      .eq("symbol", symbol)
      .eq("group_type", groupType)
      .order("report_date", { ascending: true });

    if (startDate)
      query = query.gte(
        "report_date",
        startDate.toISOString().split("T")[0]
      );

    if (endDate)
      query = query.lte(
        "report_date",
        endDate.toISOString().split("T")[0]
      );

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
  }, [symbol, groupType, startDate, endDate]);

  // Remove duplicates (symbol + report_date)
  const data = useMemo(() => {
    const map = new Map<string, COTRecord>();
    rawData.forEach((row) => {
      const key = `${row.symbol}-${row.report_date}`;
      map.set(key, row);
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
    );
  }, [rawData]);

  // Chart Data
  const chartData = {
    labels: data.map((d) => new Date(d.report_date).toLocaleDateString()),
    datasets: [
      {
        label: "Longs",
        data: data.map((d) => d.longs),
        backgroundColor: "rgba(59,130,246,0.8)", // Blue
      },
      {
        label: "Shorts",
        data: data.map((d) => d.shorts),
        backgroundColor: "rgba(250,204,21,0.8)", // Yellow
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `COT Weekly Report - ${symbol} (${groupType})`,
      },
    },
    scales: {
      x: {
        stacked: true,
        title: { display: true, text: "Report Date" },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: { display: true, text: "Contracts" },
      },
    },
  };

  return (
    <div className="p-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        {/* Symbol */}
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="border p-2 rounded text-black bg-white"
        >
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Group Type */}
        <select
          value={groupType}
          onChange={(e) => setGroupType(e.target.value)}
          className="border p-2 rounded text-black bg-white"
        >
          <option value="Institutional">Institutional</option>
          <option value="Leveraged">Leveraged</option>
        </select>

        {/* Date Range */}
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
          className="border p-2 rounded"
        />

        {/* Apply Filter */}
        <button
          onClick={fetchData}
          className="bg-blue-600 px-4 py-2 rounded text-white font-semibold"
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
          <Bar data={chartData} options={options} />
        </div>
      )}
    </div>
  );
}