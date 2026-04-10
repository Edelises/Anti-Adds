"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square, Activity, Settings, ShieldCheck, Terminal as TerminalIcon } from "lucide-react";

const API = "http://localhost:8000";

export default function Dashboard() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("macbook");
  const [threshold, setThreshold] = useState(75);   // 0-100 slider
  const [jitter, setJitter] = useState(5);           // px input
  const logEndRef = useRef<HTMLDivElement>(null);     // Auto-scroll anchor

  // ── Polling: fetch status + refresh screenshots ────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API}/status`)
        .then((r) => r.json())
        .then((data) => {
          setStatus(data);
          setIsRunning(data.is_running);
          setMode(data.mode || "macbook");
        })
        .catch(() => {}); // Silently ignore if backend is offline
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Auto-scroll console to bottom when new logs arrive ─────────────────────
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [status?.logs]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const toggleAutomation = () => fetch(`${API}/toggle`, { method: "POST" });

  const setAppMode = (newMode: string) => {
    setMode(newMode);
    fetch(`${API}/set_mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode }),
    });
  };

  const updateThreshold = (val: number) => {
    setThreshold(val);
    fetch(`${API}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threshold: val / 100 }), // Convert 0-100 → 0.0-1.0
    });
  };

  const updateJitter = (val: number) => {
    setJitter(val);
    fetch(`${API}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jitter: val }),
    });
  };

  // ── Timestamp-busted screenshot URLs ───────────────────────────────────────
  const ts = Date.now();
  const macScreenshot = `${API}/screenshot?t=${ts}`;
  const iphoneScreenshot = `${API}/screenshot_iphone?t=${ts}`;

  // ── Console log entries from backend ───────────────────────────────────────
  const logs: string[] = status?.logs || [];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-cyan-500/30">
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto p-8 space-y-8">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white/95">Anti-Adds</h1>
              <p className="text-white/50 text-sm flex items-center gap-2">
                <Activity className="w-3 h-3 text-cyan-500 animate-pulse" />
                Intelligent Ad-Suppression System
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Mode Selector */}
            <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex items-center">
              <button
                onClick={() => setAppMode("macbook")}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  mode === "macbook" ? "bg-white/10 text-cyan-400" : "text-white/40 hover:text-white/60"
                }`}
              >
                MacBook
              </button>
              <button
                onClick={() => setAppMode("iphone")}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  mode === "iphone" ? "bg-white/10 text-cyan-400" : "text-white/40 hover:text-white/60"
                }`}
              >
                iPhone
              </button>
            </div>

            {/* Start / Stop Button */}
            <button
              onClick={toggleAutomation}
              className={`flex items-center space-x-3 px-8 py-3 rounded-full font-bold transition-all duration-300 shadow-xl ${
                isRunning
                  ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                  : "bg-cyan-500 text-[#0a0a0c] hover:bg-cyan-400 hover:scale-105 active:scale-95"
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  <span>Stop Engine</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Engine</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* ── Content Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Stream Views */}
          <div className="lg:col-span-8 flex flex-col space-y-6">
            <div className="grid grid-cols-2 gap-6 h-[500px]">
              {/* MacBook Feed */}
              <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden relative group transition-all duration-500 hover:border-cyan-500/30">
                <div className="absolute top-6 left-6 z-20 flex items-center space-x-2 px-3.5 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] uppercase font-black tracking-[0.2em] text-white/70">
                  <Activity className="w-3.5 h-3.5" /> <span>MacBook Display</span>
                </div>
                <img
                  src={isRunning ? macScreenshot : ""}
                  alt="MacBook"
                  className="w-full h-full object-contain p-4 filter brightness-[0.95]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {!isRunning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/20 text-sm font-medium">Engine paused</p>
                  </div>
                )}
              </div>

              {/* iPhone Feed */}
              <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden relative group transition-all duration-500 hover:border-cyan-500/30">
                <div className="absolute top-6 left-6 z-20 flex items-center space-x-2 px-3.5 py-2 bg-cyan-500/10 backdrop-blur-md rounded-full border border-cyan-500/30 text-[10px] uppercase font-black tracking-[0.2em] text-cyan-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>iPhone Mirroring</span>
                </div>
                {mode === "iphone" && isRunning ? (
                  <img
                    src={iphoneScreenshot}
                    alt="iPhone"
                    className="w-full h-full object-contain p-4 filter brightness-[1.1]"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 text-center p-8">
                    <Settings className="w-12 h-12 text-white/5 mb-4 animate-spin" style={{ animationDuration: "8s" }} />
                    <p className="text-white/20 text-sm font-medium">
                      {mode !== "iphone" ? "Switch to iPhone mode to enable" : "Start the engine to begin capture"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Logs & Settings */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            {/* Console Log — shows rolling history */}
            <div className="flex-1 bg-[#121216] rounded-3xl border border-white/5 overflow-hidden flex flex-col min-h-[300px]">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4" /> System Console
                </h3>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">
                  {logs.length} entries
                </span>
              </div>
              <div className="flex-1 p-4 font-mono text-xs space-y-1.5 overflow-y-auto max-h-[350px] scrollbar-thin">
                {logs.length === 0 && (
                  <div className="text-white/20">Waiting for engine activity...</div>
                )}
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes("✅") ? "text-emerald-400" :
                      log.includes("❌") || log.includes("🚨") ? "text-red-400" :
                      log.includes("⚠️") ? "text-yellow-400" :
                      log.includes("📱") ? "text-cyan-300" :
                      log.includes("⚙️") ? "text-purple-400" :
                      "text-white/50"
                    }
                  >
                    {log}
                  </div>
                ))}
                {isRunning && <div className="text-cyan-500 animate-pulse">▌</div>}
                <div ref={logEndRef} />
              </div>
            </div>

            {/* Config Card — LIVE controls */}
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Configuration
              </h3>
              <div className="space-y-4">
                {/* Threshold Slider */}
                <label className="block">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-white/40 uppercase tracking-tighter">Threshold Confidence</span>
                    <span className="text-xs font-mono text-cyan-400">{threshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={threshold}
                    onChange={(e) => updateThreshold(Number(e.target.value))}
                    className="w-full accent-cyan-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-white/20 mt-1">
                    <span>Aggressive</span>
                    <span>Conservative</span>
                  </div>
                </label>

                {/* Jitter Input */}
                <label className="block">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-white/40 uppercase tracking-tighter">Click Jitter (px)</span>
                    <span className="text-xs font-mono text-cyan-400">{jitter}px</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={jitter}
                    onChange={(e) => updateJitter(Number(e.target.value))}
                    className="w-full bg-[#1c1c24] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-cyan-400 outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  <p className="text-[9px] text-white/20 mt-1">0 = pixel-perfect, higher = more human-like</p>
                </label>
              </div>
            </div>

            {/* Status Badge */}
            <div className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                <span className="text-xs text-white/50 uppercase tracking-wider font-bold">
                  {isRunning ? "Engine Active" : "Engine Paused"}
                </span>
              </div>
              <span className="text-xs font-mono text-white/30">
                {status?.iphone_window_id ? `WID: ${status.iphone_window_id}` : "No iPhone"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
