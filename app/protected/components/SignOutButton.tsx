"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-2 rounded-full bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-400 transition"
    >
      Sign Out
    </button>
  );
}