import { createSupabaseServerClient } from "@/lib/supabase/server-client";
 import { redirect } from "next/navigation"; 
 import SessionPanel from "./components/SessionPanel";
  export default async function DashboardPage() 
  { const supabase = await createSupabaseServerClient(); const { data: { user }, } = await supabase.auth.getUser();
   if (!user) { redirect("/email-password"); } const firstName = user.user_metadata?.first_name || ""; const lastName = user.user_metadata?.last_name || ""; 
   return (<div className="min-h-screen bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-white p-10"> 
         {/* 🔐 Small top-left session box */}     
           <SessionPanel email={user.email ?? null} firstName={firstName} lastName={lastName} />     
             <div className="max-w-6xl mx-auto space-y-10">    
                           {/* Your dashboard content here */}  
                                </div>   
                                  </div>); }