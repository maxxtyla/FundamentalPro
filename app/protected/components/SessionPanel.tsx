"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  email: string | null;
  firstName: string;
  lastName: string;
};

export default function SessionPanel({ email, firstName, lastName }: Props) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      {/* Desktop: Full horizontal layout */}
      <div className="hidden md:flex fixed top-4 right-4 z-50 items-center gap-5 bg-blue-900/80 backdrop-blur-md border border-blue-400/30 rounded-full px-6 py-3 shadow-2xl shadow-blue-900/20">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm uppercase tracking-widest text-yellow-400 font-bold">
            {getGreeting()},
          </span>
          <span className="text-lg font-bold text-white">
            {firstName} {lastName}
          </span>
        </div>

        <div className="h-6 w-px bg-blue-300/30" />

        <button
          onClick={handleSignOut}
          className="text-xs font-black uppercase tracking-tighter text-yellow-300 hover:text-white transition-all hover:scale-105 active:scale-95"
        >
          Sign Out
        </button>
      </div>

      {/* Mobile: Compact vertical/dropdown layout */}
      <div className="md:hidden fixed top-3 right-3 z-50">
        {!isExpanded ? (
          // Collapsed: Just show avatar/initials button
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-center w-10 h-10 bg-blue-900/90 backdrop-blur-md border border-blue-400/30 rounded-full shadow-lg shadow-blue-900/20 active:scale-95 transition-transform"
          >
            <span className="text-sm font-bold text-yellow-400">
              {firstName?.[0]}{lastName?.[0]}
            </span>
          </button>
        ) : (
          // Expanded: Show full info in vertical stack
          <div className="bg-blue-900/95 backdrop-blur-md border border-blue-400/30 rounded-2xl px-4 py-3 shadow-2xl shadow-blue-900/20 min-w-[140px]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold">
                  {getGreeting()}
                </span>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-blue-300 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              
              <span className="text-sm font-bold text-white truncate max-w-[120px]">
                {firstName}
              </span>

              <button
                onClick={handleSignOut}
                className="mt-1 text-[10px] font-black uppercase tracking-tighter text-yellow-300 hover:text-white transition-colors bg-blue-800/50 hover:bg-blue-700/50 rounded-full px-3 py-1.5"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
