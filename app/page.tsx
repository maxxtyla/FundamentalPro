"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

const LAUNCH_DATE = new Date("2026-03-11T00:00:00Z");

// --- ANIMATED BACKGROUND COMPONENT ---
const FuturisticBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    const particleCount = 60;
    const connectionDistance = 150;
    const mouse = { x: null as number | null, y: null as number | null };

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (mouse.x && mouse.y) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(250, 204, 21, ${1 - dist / 200})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - dist / connectionDistance)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)" }}
    />
  );
};

// --- HOOKS & UTILS ---
function useCountdown(target: Date) {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      done: diff === 0,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// --- RESPONSIVE COUNTDOWN UNIT ---
function CountdownUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1 min-w-[70px] sm:min-w-[80px]">
      <div className="relative flex items-center justify-center
                      w-full aspect-square max-w-[80px] sm:max-w-[100px] md:w-24 md:h-24 lg:w-32 lg:h-32
                      rounded-xl sm:rounded-2xl
                      bg-black/40 backdrop-blur-md
                      border border-blue-500/30
                      shadow-[0_0_30px_rgba(59,130,246,0.1)]
                      group hover:border-blue-400/60 hover:shadow-[0_0_30px_rgba(250,204,21,0.15)] transition-all duration-500">
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          <div className="w-full h-full bg-[linear-gradient(transparent_50%,rgba(250,204,21,0.03)_50%)] bg-[length:100%_4px]" />
        </div>
        <span
          key={display}
          className="relative z-10 font-mono text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold
                     text-transparent bg-clip-text bg-gradient-to-b from-blue-200 to-blue-500
                     tracking-wider drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]"
        >
          {display}
        </span>
      </div>
      <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.3em] text-blue-400/80 font-medium font-mono">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div className="hidden sm:flex flex-col gap-2 sm:gap-4 self-center mb-4 sm:mb-8 opacity-60">
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]" />
    </div>
  );
}

function MobileSeparator() {
  return (
    <div className="flex sm:hidden items-center justify-center w-full py-2 opacity-40">
      <div className="h-px w-12 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
    </div>
  );
}

// --- GET STARTED SECTION (shown after countdown hits zero) ---
function GetStartedSection() {
  return (
    <section className="w-full max-w-4xl px-2 sm:px-0 animate-fadeIn">
      <div className="text-center mb-6 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-400/40 bg-yellow-400/5 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-yellow-400 tracking-widest uppercase">
            System Online — Access Granted
          </span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-2">
          Ready to trade with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
            data
          </span>
          ?
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Fundamental Pro is live. Begin your institutional-grade market intelligence journey now.
        </p>
      </div>

      {/* Get Started Card */}
      <div className="flex justify-center">
        <Link href="/auth/email-password" className="group w-full max-w-sm">
          <div className="relative overflow-hidden rounded-2xl
                          border border-yellow-400/50
                          bg-gradient-to-br from-yellow-400/10 via-yellow-500/5 to-amber-600/10
                          p-[1px]
                          shadow-[0_0_40px_rgba(250,204,21,0.15)]
                          hover:shadow-[0_0_60px_rgba(250,204,21,0.35)]
                          transition-all duration-500 cursor-pointer">
            <div className="relative rounded-2xl bg-gradient-to-br from-yellow-950/60 via-[#0f0e00]/80 to-black/70
                            backdrop-blur-xl p-8 flex flex-col items-center gap-5
                            group-hover:from-yellow-900/40 transition-all duration-500">

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600
                              flex items-center justify-center
                              shadow-[0_0_30px_rgba(250,204,21,0.4)]
                              group-hover:shadow-[0_0_50px_rgba(250,204,21,0.7)]
                              group-hover:scale-110 transition-all duration-300">
                <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              {/* Text */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-300 mb-1 group-hover:text-yellow-200 transition-colors">
                  Get Started
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors">
                  Create your account or sign in to access Fundamental Pro.
                </p>
              </div>

              {/* CTA Row */}
              <div className="flex items-center gap-2 text-yellow-400 text-sm font-mono font-semibold
                              group-hover:gap-4 transition-all duration-300">
                <span>ENTER PLATFORM</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              {/* Bottom decorative line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent
                              opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

// --- FOOTER ---
function Footer() {
  return (
    <footer className="relative z-10 w-full mt-16 sm:mt-24 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 mb-10">

          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-yellow-400 flex items-center justify-center">
                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-white tracking-tight text-lg">
                Fundamental <span className="text-yellow-400">Pro</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-[220px]">
              Institutional-grade quantitative market intelligence for disciplined traders.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {/* Twitter/X */}
              <a href="#" aria-label="X / Twitter" className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-yellow-400 hover:border-yellow-400/40 transition-all duration-200">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.857L2.25 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/>
                </svg>
              </a>
              {/* Discord */}
              <a href="#" aria-label="Discord" className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-400/40 transition-all duration-200">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
              </a>
              {/* Telegram */}
              <a href="#" aria-label="Telegram" className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-blue-300 hover:border-blue-300/40 transition-all duration-200">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-blue-400/70 mb-4">Product</h4>
            <ul className="space-y-2.5">
              {["Features", "Pricing", "Changelog", "Documentation"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs sm:text-sm text-slate-500 hover:text-slate-200 transition-colors duration-200 flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-blue-500/50 group-hover:bg-yellow-400/80 transition-colors duration-200" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-blue-400/70 mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {["Terms of Service", "Privacy Policy", "Risk Disclosure", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs sm:text-sm text-slate-500 hover:text-slate-200 transition-colors duration-200 flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-blue-500/50 group-hover:bg-yellow-400/80 transition-colors duration-200" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] sm:text-xs font-mono text-slate-600 text-center sm:text-left">
            © 2026 Fundamental Pro. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e] animate-pulse" />
            <span className="text-[10px] sm:text-xs font-mono text-slate-600">All systems operational</span>
          </div>
          <p className="text-[10px] sm:text-xs font-mono text-slate-700">
            Trading involves risk. Past performance is not indicative of future results.
          </p>
        </div>
      </div>
    </footer>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function Home() {
  const { days, hours, minutes, seconds, done } = useCountdown(LAUNCH_DATE);

  return (
    <>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .glitch-hover:hover {
          animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
          color: #60a5fa;
          text-shadow: 2px 0 #facc15, -2px 0 #3b82f6;
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease forwards;
        }
      `}</style>

      <FuturisticBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between text-slate-100 overflow-hidden selection:bg-blue-500/30">
        <div className="flex-1 flex flex-col items-center justify-center px-4 w-full">

          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-yellow-400/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="mx-auto w-full max-w-5xl flex flex-col items-center gap-8 sm:gap-12">

            {/* HEADER */}
            <header className="text-center space-y-4 sm:space-y-6 max-w-3xl px-2">
              <div className="inline-block px-3 py-1 rounded-full border border-blue-500/30 bg-blue-900/10 backdrop-blur-sm mb-2 sm:mb-4">
                <span className="text-[10px] sm:text-xs font-mono text-blue-400 tracking-widest uppercase">
                  System Status: <span className="text-yellow-400">{done ? "Online" : "Standby"}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white glitch-hover cursor-default">
                FUNDAMENTAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-yellow-400">PRO</span>
              </h1>

              <p className="text-sm sm:text-lg md:text-xl text-slate-400 font-light leading-relaxed max-w-2xl mx-auto px-2">
                Institutional-Grade Market Intelligence. <br className="hidden sm:block"/>
                <span className="text-blue-400/80">Quantitative analysis for the next generation of traders.</span>
              </p>
            </header>

            {/* COUNTDOWN CONTAINER — hidden when done */}
            {!done && (
              <section className="relative w-full max-w-4xl rounded-2xl overflow-hidden
                                  border border-white/10
                                  bg-black/20 backdrop-blur-xl
                                  shadow-[0_0_100px_rgba(0,0,0,0.5)]
                                  mx-2 sm:mx-4">
                <div className="absolute top-0 left-0 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-blue-500" />
                <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-yellow-400" />
                <div className="absolute bottom-0 left-0 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-yellow-400" />
                <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-blue-500" />

                <div className="px-4 sm:px-8 py-8 sm:py-12 md:py-16 flex flex-col items-center">
                  <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-10 md:mb-12">
                    <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-blue-500/50" />
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2 sm:h-3 sm:w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-blue-500"></span>
                      </span>
                      <p className="text-[10px] sm:text-xs md:text-sm font-mono uppercase tracking-[0.2em] sm:tracking-[0.3em] text-blue-300">
                        Fundamental Pro Launch
                      </p>
                    </div>
                    <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-yellow-400/50" />
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-center
                                  gap-3 sm:gap-4 md:gap-8 w-full max-w-[320px] sm:max-w-none">
                    <div className="flex items-center justify-center gap-3 sm:gap-0">
                      <CountdownUnit value={days} label="Days" />
                      <div className="hidden sm:block"><Separator /></div>
                    </div>
                    <div className="flex items-center justify-center gap-3 sm:gap-0">
                      <CountdownUnit value={hours} label="Hours" />
                      <div className="hidden sm:block"><Separator /></div>
                    </div>
                    <div className="col-span-2 sm:hidden"><MobileSeparator /></div>
                    <div className="flex items-center justify-center gap-3 sm:gap-0">
                      <CountdownUnit value={minutes} label="Minutes" />
                      <div className="hidden sm:block"><Separator /></div>
                    </div>
                    <div className="flex items-center justify-center gap-3 sm:gap-0">
                      <CountdownUnit value={seconds} label="Seconds" />
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-10 md:mt-12 pt-4 sm:pt-8 border-t border-white/5 w-full
                                  flex flex-col sm:flex-row justify-between items-center
                                  gap-2 sm:gap-0 text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">
                    <span className="text-blue-400/60">Est: 2026</span>
                    <span className="text-blue-400/60">v1.0</span>
                  </div>
                </div>
              </section>
            )}

            {/* GET STARTED — shown only when countdown hits zero */}
            {done && <GetStartedSection />}

            {/* FEATURES GRID */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl px-2 sm:px-0">
              {[
                { title: "Structured Intelligence", desc: "Data-driven insights across forex, commodities and indices. Live economic heatmaps, Top Macro & sentiment setups, Commitment of Traders (COT) positioning report, Economic currency strength scores, and historical performance." },
                { title: "Trade with Data", desc: "Built for macro-focused traders relying on measurable edge and data. It is designed for traders who prioritize clarity, discipline, and quantitative analysis over speculation." }
              ].map((feature, idx) => (
                <div key={idx} className="group p-4 sm:p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300 backdrop-blur-sm">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-100 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-yellow-400 shadow-[0_0_10px_#3b82f6]" />
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </section>

          </div>
        </div>

        {/* FOOTER */}
        <Footer />
      </div>
    </>
  );
}
