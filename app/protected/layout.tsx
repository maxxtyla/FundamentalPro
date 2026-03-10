import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import MobileSidebar from "./components/MobileSidebar";
import SessionPanel from "./components/SessionPanel";

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
     <div className="min-h-screen bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-white p-10 relative">
      
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
      <main className="flex-1 lg:ml-64 p-6">
        {children}
      </main>
    </div>
  );
}