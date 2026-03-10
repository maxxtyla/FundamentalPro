// MobileSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, TrendingUp, BarChart3, Flame, Calendar, History } from "lucide-react";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [openTopSetups, setOpenTopSetups] = useState(true);
  const [openSentiment, setOpenSentiment] = useState(false);
  const [openHeatmaps, setOpenHeatmaps] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const pathname = usePathname();

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-950/80 backdrop-blur-sm border border-blue-800/50 rounded-lg text-yellow-400 hover:bg-blue-900 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-blue-950 border-r border-blue-800/50 z-50 transform transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-800/50">
          <h2 className="text-xl font-bold tracking-wide text-yellow-400">
            FUNDAMENTAL PRO
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-blue-200 hover:text-yellow-400 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100vh-88px)] overflow-y-auto px-6 py-6 space-y-6">
          
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
      </div>
    </>
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
