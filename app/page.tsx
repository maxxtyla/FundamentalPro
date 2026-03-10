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
      
      // Blue particles with yellow tint
      ctx.fillStyle = "rgba(59, 130, 246, 0.5)"; // Blue-500
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
            ctx.strokeStyle = `rgba(250, 204, 21, ${1 - dist / 200})`; // Yellow accent
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
      {/* Digit block - responsive sizing */}
      <div className="relative flex items-center justify-center 
                      w-full aspect-square max-w-[80px] sm:max-w-[100px] md:w-24 md:h-24 lg:w-32 lg:h-32 
                      rounded-xl sm:rounded-2xl
                      bg-black/40 backdrop-blur-md
                      border border-blue-500/30
                      shadow-[0_0_30px_rgba(59,130,246,0.1)]
                      group hover:border-blue-400/60 hover:shadow-[0_0_30px_rgba(250,204,21,0.15)] transition-all duration-500">
        
        {/* Holographic Scanline - blue with yellow tint */}
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
      
      {/* Label - blue with yellow hover */}
      <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.3em] text-blue-400/80 font-medium font-mono
                       group-hover:text-yellow-400/80 transition-colors duration-300">
        {label}
      </span>
    </div>
  );
}

// --- RESPONSIVE SEPARATOR ---
function Separator() {
  return (
    <div className="hidden sm:flex flex-col gap-2 sm:gap-4 self-center mb-4 sm:mb-8 opacity-60">
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]" />
    </div>
  );
}

// --- MOBILE SEPARATOR ---
function MobileSeparator() {
  return (
    <div className="flex sm:hidden items-center justify-center w-full py-2 opacity-40">
      <div className="h-px w-12 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function Home() {
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_DATE);

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
        .glitch-hover:hover {
          animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
          color: #60a5fa;
          text-shadow: 2px 0 #facc15, -2px 0 #3b82f6;
        }
      `}</style>

      <FuturisticBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-slate-100 overflow-hidden selection:bg-blue-500/30 px-4">
        
        {/* Ambient Glow - blue with yellow tint */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-yellow-400/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto w-full max-w-5xl flex flex-col items-center gap-8 sm:gap-12">

          {/* HEADER */}
          <header className="text-center space-y-4 sm:space-y-6 max-w-3xl px-2">
            <div className="inline-block px-3 py-1 rounded-full border border-blue-500/30 bg-blue-900/10 backdrop-blur-sm mb-2 sm:mb-4">
              <span className="text-[10px] sm:text-xs font-mono text-blue-400 tracking-widest uppercase">
                System Status: <span className="text-yellow-400">Standby</span>
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

          {/* COUNTDOWN CONTAINER */}
          <section className="relative w-full max-w-4xl rounded-2xl overflow-hidden
                              border border-white/10
                              bg-black/20 backdrop-blur-xl
                              shadow-[0_0_100px_rgba(0,0,0,0.5)]
                              mx-2 sm:mx-4">
            
            {/* Decorative Corners - blue with yellow */}
            <div className="absolute top-0 left-0 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-blue-500" />
            <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-yellow-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-yellow-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-blue-500" />

            <div className="px-4 sm:px-8 py-8 sm:py-12 md:py-16 flex flex-col items-center">
              
              {/* Label */}
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

              {/* RESPONSIVE DIGITS GRID */}
              <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-center 
                              gap-3 sm:gap-4 md:gap-8 w-full max-w-[320px] sm:max-w-none">
                
                <div className="flex items-center justify-center gap-3 sm:gap-0">
                  <CountdownUnit value={days} label="Days" />
                  <div className="hidden sm:block">
                    <Separator />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 sm:gap-0">
                  <CountdownUnit value={hours} label="Hours" />
                  <div className="hidden sm:block">
                    <Separator />
                  </div>
                </div>

                <div className="col-span-2 sm:hidden">
                  <MobileSeparator />
                </div>

                <div className="flex items-center justify-center gap-3 sm:gap-0">
                  <CountdownUnit value={minutes} label="Minutes" />
                  <div className="hidden sm:block">
                    <Separator />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 sm:gap-0">
                  <CountdownUnit value={seconds} label="Seconds" />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 sm:mt-10 md:mt-12 pt-4 sm:pt-8 border-t border-white/5 w-full 
                              flex flex-col sm:flex-row justify-between items-center 
                              gap-2 sm:gap-0 text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest">
                <span className="text-blue-400/60">Est: 2026</span>
                <span className="text-blue-400/60">v1.0</span>
              </div>
            </div>
          </section>

          {/* FEATURES GRID */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl px-2 sm:px-0">
            {[
            { title: "Structured Intelligence", desc: "Data-driven insights across forex, commodities and indices.Live economic heatmaps, Top Macro & sentiment setups, Commitment of Traders (COT) positioning report, Economic currency strength scores, and historical performance." },
              { title: "Trade with Data", desc: "Built for macro-focused traders relying on measurable edge and data.It is designed for traders who prioritize clarity, discipline, and quantitative analysis over speculation." }
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
    </>
  );
}
