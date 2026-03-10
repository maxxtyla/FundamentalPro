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

type TopSetup = {
  id: number;
  snapshot_date: string;
  instrument: string;
  combined_total_score: number;
};

export default function TopSetupsChart() {
  const supabase = getSupabaseBrowserClient();

  const [rawData, setRawData] = useState<TopSetup[]>([]);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [instrument, setInstrument] = useState("");
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // ===============================
  // Fetch Instruments
  // ===============================
  const fetchInstruments = async () => {
  const { data, error } = await supabase
  .from("combined_top_setups_history")
  .select("instrument")
  .returns<{ instrument: string }[]>();
    if (error) {
      console.error(error);
      return;
    }

    const unique = Array.from(
  new Set((data ?? []).map((row) => row.instrument))
).sort();
    setInstruments(unique);

    if (unique.length > 0) {
      setInstrument(unique[0]);
    }
  };

  // ===============================
  // Fetch Data
  // ===============================
  const fetchData = async () => {
    if (!instrument) return;

    setLoading(true);

    let query = supabase
      .from("combined_top_setups_history")
      .select("*")
      .eq("instrument", instrument)
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
    fetchInstruments();
  }, []);

  useEffect(() => {
    fetchData();
  }, [instrument]);

  // ===============================
  // Remove Duplicates
  // ===============================
  const data = useMemo(() => {
    const map = new Map<string, TopSetup>();

    rawData.forEach((row) => {
      const key = `${row.instrument}-${row.snapshot_date}`;
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
        label: "Combined Total Score",
        data: data.map((d) => d.combined_total_score),
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
        text: `Top Setups History - ${instrument}`,
      },
       annotation: {
        annotations: {
          // 🔵 Bullish background
          bullishZone: {
            type: "box",
            yMin: 7,

            backgroundColor: "rgba(59,130,246,0.08)", // Blue
          },
          // 🟡 Bearish background
          bearishZone: {
            type: "box",
 
            yMax: -7,
            backgroundColor: "rgba(243, 197, 15, 0.08)", // Yellow
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
        suggestedMin: -20,
        suggestedMax: 20,
        ticks: { stepSize: 2 },
      },
    },
  };

  return (
    <div className="p-6">

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">

        {/* Instrument Dropdown */}
        <select
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          className="border p-2 rounded text-white bg-black"
        >
          {instruments.map((instr) => (
            <option key={instr} value={instr}>
              {instr}
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

        {/* Apply Button */}
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