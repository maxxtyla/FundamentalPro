"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { AuthDemoPage } from "../components/AuthDemoPage";
import { useRouter, useSearchParams } from "next/navigation";

type EmailPasswordDemoProps = {
  user: User | null;
};

type Mode = "signup" | "signin";

export default function EmailPasswordDemo({ user }: EmailPasswordDemoProps) {
  const [mode, setMode] = useState<Mode>("signup");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle email confirmation redirect
  useEffect(() => {
    const confirmed = searchParams.get("confirmed");
    const error = searchParams.get("error");

    if (confirmed === "true") {
      setMode("signin");
      setStatus("Email confirmed successfully! You can now sign in.");
    } else if (error === "confirmation_failed") {
      setMode("signup");
      setStatus("Email confirmation failed. Please try signing up again or contact support.");
    }
  }, [searchParams]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setStatus("Signed out successfully");
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "signup") {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (error) {
        setStatus(error.message);
        setIsEmailSent(false);
      } else {
        // Check if email confirmation is required
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          // Email confirmation required
          setIsEmailSent(true);
          setStatus("Check your email to confirm your account before signing in.");
        } else {
          // Auto-confirmed (if email confirmation is disabled in Supabase)
          setIsEmailSent(true);
          setStatus("Account created! You can now sign in.");
        }
      }
    } else {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message.includes("Email not confirmed") || error.message.includes("not confirmed")) {
          setStatus("Please confirm your email address before signing in. Check your inbox.");
        } else {
          setStatus(error.message);
        }
      } else {
        setStatus("Signed in successfully");
        router.push("/protected/top-setups/Final-combined");
      }
    }
  }

  // Reset email sent state when switching modes
  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    setIsEmailSent(false);
    setStatus("");
    setPassword("");
  };

  return (
    <AuthDemoPage
      title="Create Account with Email"
      intro="Classic credentials—users enter details, Supabase secures the rest while getSession + onAuthStateChange keep the UI live."
      steps={[
        "Sign up with your email and password.",
        "Check your email and click the confirmation link.",
        "Return here to sign in after confirming.",
      ]}
    >
      {!currentUser && (
        <>
          <form
            className="relative overflow-hidden rounded-[32px] border border-blue-500/30 bg-gradient-to-br from-[#0a1628] via-[#0a1525] to-[#1e3a5f] p-8 text-slate-100 shadow-[0_35px_90px_rgba(2,6,23,0.65)]"
            onSubmit={handleSubmit}
          >
            <div
              className="pointer-events-none absolute -left-4 -top-4 -z-10 h-20 w-28 rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.25),_transparent)] blur-lg"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-10 right-2 -z-10 h-28 w-40 rounded-full bg-[linear-gradient(140deg,_rgba(250,204,21,0.32),_rgba(59,130,246,0.12))] blur-xl"
              aria-hidden="true"
            />
            <div className="absolute inset-x-8 top-6 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-yellow-300/80">
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-200/70">
                  Enter Credentials
                </p>
                <h3 className="text-xl font-semibold text-white">
                  {mode === "signup" ? "Create an account" : "Welcome back"}
                </h3>
              </div>
              <div className="flex rounded-full border border-white/10 bg-white/[0.07] p-1 text-xs font-semibold text-slate-300">
                {(["signup", "signin"] as Mode[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={mode === option}
                    onClick={() => handleModeSwitch(option)}
                    className={`rounded-full px-4 py-1 transition ${
                      mode === option
                        ? "bg-blue-500/30 text-white shadow shadow-blue-500/20"
                        : "text-slate-400"
                    }`}
                  >
                    {option === "signup" ? "Sign up" : "Sign in"}
                  </button>
                ))}
              </div>
            </div>

            {/* Success message after email confirmation */}
            {searchParams.get("confirmed") === "true" && (
              <div className="mt-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-green-400 font-medium text-sm">Email confirmed!</p>
                    <p className="text-green-300/80 text-xs mt-1">
                      Your account is now active. Please sign in with your credentials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error message after failed confirmation */}
            {searchParams.get("error") === "confirmation_failed" && (
              <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-red-400 font-medium text-sm">Confirmation failed</p>
                    <p className="text-red-300/80 text-xs mt-1">
                      The confirmation link may have expired or is invalid. Please try signing up again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email Confirmation Notice - after signup */}
            {isEmailSent && mode === "signup" && (
              <div className="mt-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-blue-400 font-medium text-sm">Check your email!</p>
                    <p className="text-blue-300/80 text-xs mt-1">
                      We sent a confirmation link to <span className="font-medium">{email}</span>. 
                      Click the link to activate your account, then return here to sign in.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {mode === "signup" && !isEmailSent && searchParams.get("confirmed") !== "true" && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <label className="block text-sm font-medium text-slate-200">
                  First Name
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required={mode === "signup"}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f1f3a] px-3 py-2.5 text-base text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                    placeholder="Jane"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-200">
                  Last Name
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required={mode === "signup"}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f1f3a] px-3 py-2.5 text-base text-white placeholder-slate-500 focus:border-yellow-400 focus:outline-none"
                    placeholder="Doe"
                  />
                </label>
              </div>
            )}

            {!isEmailSent && searchParams.get("confirmed") !== "true" && (
              <div className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-slate-200">
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f1f3a] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                    placeholder="you@email.com"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-200">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f1f3a] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                    placeholder="At least 6 characters"
                  />
                </label>
              </div>
            )}

            {!isEmailSent && searchParams.get("confirmed") !== "true" && (
              <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-600/40"
              >
                {mode === "signup" ? "Create account" : "Sign in"}
              </button>
            )}

            {isEmailSent && mode === "signup" && (
              <button
                type="button"
                onClick={() => handleModeSwitch("signin")}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-yellow-500/20 border border-yellow-500/50 px-4 py-2.5 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/30"
              >
                Go to Sign In
              </button>
            )}

            {status && !isEmailSent && searchParams.get("confirmed") !== "true" && (
              <p
                className={`mt-4 text-sm ${
                  status.includes("confirm") || status.includes("Check your email")
                    ? "text-yellow-400"
                    : status.includes("success")
                    ? "text-green-400"
                    : "text-red-400"
                }`}
                role="status"
                aria-live="polite"
              >
                {status}
              </p>
            )}
          </form>
        </>
      )}
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-7 text-slate-200 shadow-[0_25px_70px_rgba(2,6,23,0.65)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div></div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              currentUser
                ? "bg-blue-500/20 text-yellow-200"
                : "bg-white/10 text-slate-400"
            }`}
          >
            {currentUser ? "Active" : "Idle"}
          </span>
        </div>
        {currentUser ? (
          <>
            <dl className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between gap-6">
                <dt className="text-slate-400">User ID</dt>
                <dd className="font-mono text-xs">{currentUser.id}</dd>
              </div>
              <div className="flex items-center justify-between gap-6">
                <dt className="text-slate-400">Full Name</dt>
                <dd>
                  {currentUser.user_metadata?.first_name}{" "}
                  {currentUser.user_metadata?.last_name}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-6">
                <dt className="text-slate-400">Email</dt>
                <dd>{currentUser.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-6">
                <dt className="text-slate-400">Last sign in</dt>
                <dd>
                  {currentUser.last_sign_in_at
                    ? new Date(currentUser.last_sign_in_at).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </dl>
            <button
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-blue-500/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500/30"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </>
        ) : (
          <p>Get Started With your Email.</p>
        )}
      </section>
    </AuthDemoPage>
  );
}
