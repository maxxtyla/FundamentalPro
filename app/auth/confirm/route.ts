// app/auth/confirm/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // Email confirmed successfully - sign out to force manual login
      await supabase.auth.signOut();
      
      // Redirect to sign in page with success message
      return NextResponse.redirect(`${requestUrl.origin}/email-password?confirmed=true`);
    }
  }

  // Error case
  return NextResponse.redirect(`${requestUrl.origin}/email-password?error=confirmation_failed`);
}
