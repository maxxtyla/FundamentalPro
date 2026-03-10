// Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Flame,
  Calendar,
  History
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const [openTopSetups, setOpenTopSetups] = useState(true);
  const [openSentiment, setOpenSentiment] = useState(false);
  const [openHeatmaps, setOpenHeatmaps] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-blue-950 border-r border-blue-800/50 flex-col">

      {/* HEADER */}
      <div className="p-6 border-b border-blue-800/50">
        <h2 className="text-xl font-bold tracking-wide text-yellow-400">
          FUNDAMENTAL PRO
        </h2>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 sidebar-scroll">

        {/* TOP SETUPS */}
        <div>
          <button
            onClick={() => setOpenTopSetups(!openTopSetups)}
            className="flex items-center justify-between w-full text-left py-2 text-blue-200 hover:text-yellow-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-yellow-400" />
              <span>Top Setups</span>
            </div>
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ${openTopSetups ? "rotate-180" : ""}`}
            />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openTopSetups ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="ml-4 space-y-2 mt-2">
              <NavLink href="/protected/top-setups/combined" label="Combined" pathname={pathname} />
              <NavLink href="/protected/top-setups/macro" label="Macro Only" pathname={pathname} />
              <NavLink href="/protected/top-setups/cot" label="COT Sentiment" pathname={pathname} />
              <NavLink href="/protected/top-setups/carry" label="Carry Trade" pathname={pathname} />
            </div>
          </div>
        </div>

        {/* SENTIMENT */}
        <div>
          <button
            onClick={() => setOpenSentiment(!openSentiment)}
            className="flex items-center justify-between w-full text-left py-2 text-blue-200 hover:text-yellow-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-yellow-400" />
              <span>Sentiment</span>
            </div>
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ${openSentiment ? "rotate-180" : ""}`}
            />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSentiment ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="ml-4 space-y-2 mt-2">
              <NavLink href="/protected/sentiment/cot-report" label="Latest COT Report" pathname={pathname} />
              <NavLink href="/protected/sentiment/retail" label="Retail Sentiment" pathname={pathname} />
            </div>
          </div>
        </div>

        {/* HEATMAPS */}
        <div>
          <button
            onClick={() => setOpenHeatmaps(!openHeatmaps)}
            className="flex items-center justify-between w-full text-left py-2 text-blue-200 hover:text-yellow-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-yellow-400" />
              <span>Macro Heatmaps</span>
            </div>
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ${openHeatmaps ? "rotate-180" : ""}`}
            />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openHeatmaps ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="ml-4 space-y-2 mt-2">
              <NavLink href="/protected/heatmap/usd" label="USD Heatmap" pathname={pathname} />
              <NavLink href="/protected/heatmap/gbp" label="GBP Heatmap" pathname={pathname} />
              <NavLink href="/protected/heatmap/eur" label="EUR Heatmap" pathname={pathname} />
              <NavLink href="/protected/heatmap/jpy" label="JPY Heatmap" pathname={pathname} />
              <NavLink href="/protected/heatmap/nzd" label="NZD Heatmap" pathname={pathname} />
              <NavLink href="/protected/heatmap/aud" label="AUD Heatmap" pathname={pathname} />
              <NavLink href="/protected/heatmap/cad" label="CAD Heatmap" pathname={pathname} />
            </div>
          </div>
        </div>

        {/* SEASONALITY */}
        <div>
          <NavLink href="/protected/seasonality" label="Seasonality" pathname={pathname} icon={<Calendar size={18} className="text-yellow-400" />} />
        </div>

        {/* HISTORY */}
        <div>
          <button
            onClick={() => setOpenHistory(!openHistory)}
            className="flex items-center justify-between w-full text-left py-2 text-blue-200 hover:text-yellow-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History size={18} className="text-yellow-400" />
              <span>History</span>
            </div>
            <ChevronDown
              size={18}
              className={`transition-transform duration-300 ${openHistory ? "rotate-180" : ""}`}
            />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openHistory ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="ml-4 space-y-2 mt-2">
              <NavLink href="/protected/top-setups-history/combined" label="Top Setups History" pathname={pathname} />
              <NavLink href="/protected/top-setups-history/macro" label="Currencies History" pathname={pathname} />
              <NavLink href="/protected/top-setups-history/cot" label="COT History" pathname={pathname} />
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  pathname,
  icon,
}: {
  href: string;
  label: string;
  pathname: string;
  icon?: React.ReactNode;
}) {
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-yellow-400 text-blue-950 font-semibold"
          : "text-blue-200 hover:bg-blue-900/50 hover:text-yellow-200"
      }`}
    >
      {icon && <span>{icon}</span>}
      {label}
    </Link>
  );
}
