"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Play, Square, Activity, Settings, ShieldCheck, 
  Terminal as TerminalIcon, Monitor, Smartphone, 
  Cpu, Zap, Globe, Github 
} from "lucide-react";

const API = "http://localhost:8000";

export default function Dashboard() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("macbook");
  const [threshold, setThreshold] = useState(75);
  const [jitter, setJitter] = useState(5);
  const [isDesktop, setIsDesktop] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Detect if running inside Tauri
    setIsDesktop(!!(window as any).__TAURI_INTERNALS__);

    const interval = setInterval(() => {
      fetch(`${API}/status`)
        .then((r) => r.json())
        .then((data) => {
          setStatus(data);
          setIsRunning(data.is_running);
          setMode(data.mode || "macbook");
          // Sync internal state with backend config if available
          if (data.config) {
            setThreshold(Math.round(data.config.threshold * 100));
            setJitter(data.config.jitter);
          }
        })
        .catch(() => setStatus(null));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
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
      body: JSON.stringify({ threshold: val / 100 }),
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

  const ts = Date.now();
  const macScreenshot = `${API}/screenshot?t=${ts}`;
  const iphoneScreenshot = `${API}/screenshot_iphone?t=${ts}`;
  const logs: string[] = status?.logs || [];

  return (
    <div className="min-h-screen bg-[#08080a] text-white font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      {/* ── Futuristic Background Elements ───────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/5 blur-[150px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* ── Custom Window Header (Tauri Style) ────────────────────────────── */}
      <header className={`relative z-50 flex items-center justify-between px-8 py-4 bg-white/[0.02] border-b border-white/[0.05] backdrop-blur-xl ${isDesktop ? 'pt-6' : ''}`}>
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-[#0a0a0c] p-2 rounded-xl border border-white/10">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest uppercase bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Anti-Adds Detector
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/30">
                {status ? "Systems Online" : "Backend Disconnected"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <nav className="flex items-center bg-white/[0.03] p-1 rounded-full border border-white/[0.05]">
            <button
              onClick={() => setAppMode("macbook")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                mode === "macbook" ? "bg-white/10 text-cyan-400 shadow-lg" : "text-white/30 hover:text-white/50"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> MacBook
            </button>
            <button
              onClick={() => setAppMode("iphone")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                mode === "iphone" ? "bg-white/10 text-cyan-400 shadow-lg" : "text-white/30 hover:text-white/50"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> iPhone
            </button>
          </nav>

          <button
            onClick={toggleAutomation}
            className={`group relative flex items-center gap-3 px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-500 overflow-hidden ${
              isRunning 
                ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                : "bg-cyan-500 text-black hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:scale-[1.02]"
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Kill Engine</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Detector</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* Left Column: Visual Monitoring */}
        <div className="col-span-12 xl:col-span-8 flex flex-col space-y-6 overflow-hidden">
          
          {/* Feed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-0">
            {/* Primary Feed (Always MacBook) */}
            <div className="flex flex-col space-y-3 min-h-0">
               <div className="flex items-center justify-between px-2">
                 <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Primary Display</h2>
                 <Activity className={`w-3.5 h-3.5 ${isRunning ? 'text-cyan-500 animate-pulse' : 'text-white/10'}`} />
               </div>
               <div className="flex-1 bg-white/[0.02] rounded-[2rem] border border-white/[0.05] overflow-hidden relative inner-shadow group">
                  <img
                    src={isRunning ? macScreenshot : ""}
                    className={`w-full h-full object-contain p-6 transition-all duration-1000 ${isRunning ? 'opacity-100' : 'opacity-0 scale-95'}`}
                    onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                  />
                  {!isRunning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                       <Cpu className="w-12 h-12 text-white/5" />
                       <span className="text-[10px] text-white/20 uppercase tracking-widest">Feed Standby</span>
                    </div>
                  )}
                  <div className="absolute bottom-6 left-6 flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/5 text-[9px] font-black tracking-widest text-white/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    RENA SCREEN • 4K NATIVE
                  </div>
               </div>
            </div>

            {/* Target Feed (iPhone Mirroring) */}
            <div className="flex flex-col space-y-3 min-h-0">
               <div className="flex items-center justify-between px-2">
                 <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Injection Target</h2>
                 <Zap className={`w-3.5 h-3.5 ${mode === 'iphone' && isRunning ? 'text-yellow-500 animate-bounce' : 'text-white/10'}`} />
               </div>
               <div className="flex-1 bg-white/[0.02] rounded-[2rem] border border-white/[0.05] overflow-hidden relative inner-shadow group">
                  {mode === "iphone" && isRunning ? (
                    <img
                      src={iphoneScreenshot}
                      className="w-full h-full object-contain p-6 transition-all duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 px-12 text-center">
                       <div className="relative">
                         <Smartphone className="w-16 h-16 text-white/5" />
                         <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <p className="text-[10px] text-white/20 uppercase leading-relaxed tracking-widest font-medium">
                         {mode !== "iphone" ? "Select iPhone Target to Enable Mirroring Monitor" : "Initiate Engine to Start Signal Capture"}
                       </p>
                    </div>
                  )}
                  {mode === "iphone" && (
                    <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-[8px] font-bold text-cyan-500 uppercase tracking-widest">
                      Direct Window Link
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-4 gap-4 pb-2">
             <MetricBox label="Efficiency" value="99.2%" icon={<Activity className="w-3 h-3" />} />
             <MetricBox label="Precision" value={`${threshold}%`} icon={<Zap className="w-3 h-3" />} />
             <MetricBox label="Response" value="24ms" icon={<Globe className="w-3 h-3" />} />
             <MetricBox label="Active Session" value={isRunning ? "01:24:02" : "00:00:00"} icon={<Activity className="w-3 h-3" />} />
          </div>
        </div>

        {/* Right Column: Console & Controls */}
        <div className="col-span-12 xl:col-span-4 flex flex-col space-y-6 overflow-hidden">
          
          {/* Advanced Controls */}
          <div className="bg-white/[0.03] rounded-[2rem] border border-white/[0.05] p-6 space-y-6 backdrop-blur-md">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
              <Settings className="w-3 h-3" /> Core Parameters
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">Confidence Buffer</span>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{threshold}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={threshold}
                  onChange={(e) => updateThreshold(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">Click Randomization</span>
                  <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{jitter}px</span>
                </div>
                <input
                  type="number"
                  value={jitter}
                  onChange={(e) => updateJitter(Number(e.target.value))}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-white/80 outline-none focus:border-cyan-500/30 transition-all uppercase tracking-widest"
                />
              </div>
            </div>
          </div>

          {/* Real-time System Log */}
          <div className="flex-1 bg-black/60 rounded-[2rem] border border-white/[0.05] flex flex-col min-h-0 overflow-hidden shadow-2xl">
             <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                   <TerminalIcon className="w-3.5 h-3.5 text-cyan-500" />
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Terminal Log</h3>
                </div>
                <div className="flex gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500/30" />
                   <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/30" />
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                </div>
             </div>
             
             <div ref={logContainerRef} className="flex-1 p-5 font-mono text-[10px] space-y-2 overflow-y-auto scrollbar-hide">
                {logs.length === 0 && <span className="text-white/10 animate-pulse italic text-[8px] uppercase tracking-widest">Synchronizing telemetry data...</span>}
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 leading-relaxed border-l border-white/5 pl-3 py-0.5">
                    <span className="text-white/10 select-none">{i+1}</span>
                    <span className={
                      log.includes("✅") ? "text-emerald-400" :
                      log.includes("🚨") || log.includes("❌") ? "text-red-400" :
                      log.includes("⚙️") ? "text-purple-400" :
                      log.includes("📱") ? "text-cyan-400" :
                      "text-white/40"
                    }>
                      {log}
                    </span>
                  </div>
                ))}
                {isRunning && <div className="ml-6 w-1.5 h-3 bg-cyan-500 animate-pulse inline-block" />}
             </div>

             <div className="px-6 py-3 bg-white/[0.02] border-t border-white/[0.05] flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                   <span className="text-[8px] font-bold uppercase tracking-widest text-cyan-500">Live Telemetry</span>
                </div>
                <div className="flex items-center gap-4 text-white/20">
                   <Github className="w-3 h-3 hover:text-white transition-colors cursor-pointer" />
                </div>
             </div>
          </div>

        </div>
      </main>

      {/* ── Desktop-Specific Footer ────────────────────────────────────────── */}
      <footer className="relative z-50 px-8 py-3 bg-white/[0.01] border-t border-white/[0.05] flex items-center justify-between text-[8px] font-black uppercase tracking-[0.3em] text-white/20">
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 hover:text-white/40 transition-colors">
               <Cpu className="w-2.5 h-2.5" /> High Perf Core v2.0
            </span>
            <span className="flex items-center gap-1.5">
               <Activity className="w-2.5 h-2.5 text-emerald-500" /> Latency: 4ms
            </span>
         </div>
         <div>
            © 2026 ANTI-ADDS DETECTOR • PREMIUM DESKTOP EDITION
         </div>
      </footer>
    </div>
  );
}

function MetricBox({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-2xl flex flex-col justify-center items-center text-center group hover:bg-white/[0.04] transition-all duration-500">
       <div className="text-white/20 mb-1 group-hover:text-cyan-500 transition-colors">{icon}</div>
       <p className="text-[7px] text-white/20 uppercase tracking-widest mb-0.5">{label}</p>
       <p className="text-[10px] font-black text-white/60 group-hover:text-white transition-colors">{value}</p>
    </div>
  );
}
