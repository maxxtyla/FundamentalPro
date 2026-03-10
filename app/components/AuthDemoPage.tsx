"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AuthDemoPageProps = {
  title: string;
  intro: string;
  steps: string[];
  children: ReactNode;
};

export function AuthDemoPage({
  title,
  
  children,
}: AuthDemoPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#02050b] via-[#050c1d] to-[#071426] text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
            CFS FUNDAMENTAL PRO 
            </p>
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
          >
            Back home →
          </Link>
        </div>
      </header>

      {/* MAIN */}
  <main className="flex flex-1 items-center justify-center px-6 py-12">
    <div className="w-full max-w-5xl">
      <div className="flex justify-center">
        <div className="w-full max-w-xl">
          {children}
        </div>
      </div>
    </div>
  </main>
    </div>
  );
}
