"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";

type Props = {
  email: string | null;
  firstName: string;
  lastName: string;
};

export default function SessionPanel({ email, firstName, lastName }: Props) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning  Trader";
    if (hour < 17) return "Good afternoon Trader";
    return "Good evening Trader";
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-5 bg-blue-900/80 backdrop-blur-md border border-blue-400/30 rounded-full px-6 py-3 shadow-2xl shadow-blue-900/20">
      
      {/* Greeting and Name on One Line */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-sm uppercase tracking-widest text-yellow-400 font-bold">
          {getGreeting()},
        </span>
        <span className="text-lg font-bold text-white">
          {firstName} {lastName}
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-blue-300/30" />

      {/* Sign Out Only */}
      <button
        onClick={handleSignOut}
        className="text-xs font-black uppercase tracking-tighter text-yellow-300 hover:text-white transition-all hover:scale-105 active:scale-95"
      >
        Sign Out
      </button>
    </div>
  );
}
