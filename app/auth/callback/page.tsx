// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = getSupabaseBrowserClient();
      
      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.search
      );
      
      if (error) {
        console.error("Auth callback error:", error);
        router.push("/email-password?error=auth_callback_failed");
        return;
      }
      
      // Successfully confirmed - redirect to sign in
      router.push("/email-password?confirmed=true");
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400">Confirming your email...</p>
      </div>
    </div>
  );
}
