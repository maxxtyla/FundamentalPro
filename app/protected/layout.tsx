import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import MobileSidebar from "./components/MobileSidebar";
import SessionPanel from "./components/SessionPanel";
import FuturisticBackground from "@/app/components/FuturisticBackground";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/email-password");
  }
  const firstName = user.user_metadata?.first_name || "";
  const lastName = user.user_metadata?.last_name || "";

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Animated Background */}
      <FuturisticBackground />
      
      {/* Ambient Glow Effects */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/3 right-1/4 w-[300px] h-[300px] bg-yellow-400/5 rounded-full blur-[100px] pointer-events-none z-0" />
      
      {/* Content Layer */}
      <div className="relative z-10 min-h-screen p-4 sm:p-6 lg:p-10">
        {/* SESSION PANEL */}
        <SessionPanel
          email={user.email ?? null}
          firstName={firstName}
          lastName={lastName}
        />
        
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Sidebar */}
        <MobileSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
