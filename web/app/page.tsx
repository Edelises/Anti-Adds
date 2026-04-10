"use client";

import { useState, useEffect, useRef, memo } from "react";
import { 
  Activity, Smartphone, 
  Cpu, Zap, Globe, Eraser, RefreshCw, Power
} from "lucide-react";
import { TerminalView } from "./TerminalView";

const API = "http://localhost:8000";

export default function Dashboard() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [mode, setMode] = useState("iphone");
  const [threshold, setThreshold] = useState(75);
  const [jitter, setJitter] = useState(5);
  const [logs, setLogs] = useState<string[]>([]);
  const [adsClosed, setAdsClosed] = useState(0);
  const lastLogCountRef = useRef(0);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleRestart = async () => {
    try {
      setLogs(prev => [...prev, "[SYSTEM] Restarting Core Services..."]);
      await fetch(`${API}/restart`, { method: "POST" });
      setTimeout(() => {
        window.location.reload();
      }, 2500);
    } catch (err) {
      window.location.reload();
    }
  };

  const handleShutdown = async () => {
    try {
      setLogs(prev => [...prev, "[SYSTEM] Terminating Backend Engine & Application..."]);
      await fetch(`${API}/shutdown`, { method: "POST" });
      setIsConnected(false);
      setIsRunning(false);
      setLogs(prev => [...prev, "🛑 SYSTEM OFFLINE"]);
      
      // Close window via Tauri API if available, else just leave it offline
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
          (window as any).__TAURI__.process.exit(0);
      }
    } catch (err) {
      console.error("Shutdown failed:", err);
    }
  };

  // Advanced Configs (Sync with backend if needed, for now UI handles local state)
  const [autoClick, setAutoClick] = useState(true);
  const [scanInterval, setScanInterval] = useState(100);

  // Sequential Polling
  const pollStatus = async () => {
    let delay = 500;
    try {
      const resp = await fetch(`${API}/status`);
      if (resp.ok) {
        const data = await resp.json();
        setIsConnected(true);
        setIsRunning(data.is_running);
        setHasPermission(data.has_permission);
        setMode(data.mode || "macbook");
        setAdsClosed(data.ads_closed || 0);

        if (data.config) {
          setThreshold(Math.round(data.config.threshold * 100));
          setJitter(data.config.jitter);
        }

        const newLogs: string[] = data.logs || [];
        if (newLogs.length !== lastLogCountRef.current) {
          lastLogCountRef.current = newLogs.length;
          setLogs(newLogs);
        }
      } else {
        throw new Error("HTTP error");
      }
    } catch (err) {
      setIsConnected(false);
      delay = 3000; // Exponential backoff / slow down on error to prevent spam
    } finally {
      pollTimerRef.current = setTimeout(pollStatus, delay);
    }
  };

  useEffect(() => {
    pollStatus();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const toggleAutomation = async () => {
    try {
        await fetch(`${API}/toggle`, { method: "POST" });
        setIsRunning(prev => !prev);
    } catch (e) {}
  };

  const openSettings = (panel: string) => {
    fetch(`${API}/open_settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panel }),
    });
  };

  const setAppMode = (m: string) => {
    setMode(m);
    // User logic: Macbook mode prefers expanded terminal, iPhone prefers collapsed
    setIsTerminalExpanded(m === "macbook");
    fetch(`${API}/set_mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: m }),
    }).catch(() => {});
  };

  const updateConfig = (key: string, val: any) => {
    // Local state first
    if (key === 'threshold') setThreshold(val);
    if (key === 'jitter') setJitter(val);
    
    // API sync
    fetch(`${API}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: key === 'threshold' ? val/100 : val }),
    }).catch(() => {});
  };

  const ts = Date.now();
  const macScreenshot = `${API}/screenshot?t=${ts}`;
  const iphoneScreenshot = `${API}/screenshot_iphone?t=${ts}`;

  return (
    <div className="fixed inset-0 bg-[#060608] text-white font-sans select-none overflow-hidden" style={{ overflow: 'clip' }}>

      {/* ── Background FX ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/[0.03] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/[0.03] blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* ── Header (Ultra Slim) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-6 bg-black/60 border-b border-white/[0.05] backdrop-blur-3xl">
        <div className="flex items-center space-x-4">
          <div className="bg-[#0a0a0c] p-1.5 rounded-lg border border-white/10 w-8 h-8 flex items-center justify-center">
            <img src="/app-icon.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
          <h1 className="text-sm font-black tracking-[0.3em] uppercase bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            Anti-Ads Engine
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <nav className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.05]">
            <button 
              onClick={() => setAppMode("macbook")} 
              data-tooltip="Switch to MacBook Monitoring"
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${mode === "macbook" ? "bg-cyan-500 text-black" : "text-white/20 hover:text-white/40"}`}
            >
              MACBOOK
            </button>
            <button 
              onClick={() => setAppMode("iphone")} 
              data-tooltip="Switch to iPhone Mirroring"
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${mode === "iphone" ? "bg-cyan-500 text-black" : "text-white/20 hover:text-white/40"}`}
            >
              IPHONE
            </button>
          </nav>
          
        {/* System Controls Group */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/[0.03] border border-white/[0.05] p-1 rounded-2xl gap-1">
            <button
              onClick={toggleAutomation}
              data-tooltip={isRunning ? "Terminate Engine" : "Ignite Engine"}
              className={`h-9 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                !isConnected ? "bg-white/5 text-white/20 hover:bg-white/10" : 
                isRunning ? "bg-red-500/10 border border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : 
                "bg-white text-black hover:scale-105"
              }`}
            >
              {isRunning ? "STOP DETECTOR" : "RUN DETECTOR"}
            </button>

            <button
              onClick={handleRestart}
              data-tooltip="Hot Restart"
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/20 hover:text-white transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleShutdown}
              data-tooltip="Kill Process"
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-500/10 text-white/20 hover:text-red-500 transition-all active:scale-95"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>
        </div>
      </header>

      {/* ── LEFT SIDEBAR: CONFIG ── */}
      <aside className="fixed left-0 top-[60px] bottom-0 w-[120px] border-r border-white/[0.05] bg-black/40 flex flex-col items-center py-8 gap-10 z-[100]">
        <div className="flex flex-col items-center gap-3 w-full px-2 text-center group">
           <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">Sensitivity</span>
           <button 
             onClick={() => updateConfig('threshold', threshold + 5)} 
             data-tooltip="Increase AI Confidence"
             data-tooltip-dir="right"
             className="w-12 h-12 rounded-2xl bg-white/[0.08] border border-white/10 flex flex-col items-center justify-center hover:bg-cyan-500/10 transition-all text-cyan-400 shadow-lg active:scale-95"
           >
              <span className="text-[12px] font-black">{threshold}</span>
              <span className="text-[7px] opacity-40">%</span>
           </button>
           <button 
             onClick={() => updateConfig('threshold', threshold - 5)} 
             data-tooltip="Reduce Threshold"
             data-tooltip-dir="right"
             className="text-[9px] font-black text-white/30 hover:text-white/70 transition-colors"
           >
             − 0.05
           </button>
           <p className="text-[8px] font-bold text-white/60 uppercase leading-tight mt-1 px-1">AI Prediction<br/>Precision</p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full px-2 text-center group">
           <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">Bypass</span>
           <button 
             onClick={() => setAutoClick(!autoClick)} 
             data-tooltip={autoClick ? "Disable Auto-Bypass" : "Enable Auto-Bypass"}
             data-tooltip-dir="right"
             className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${autoClick ? 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-black border-cyan-400 font-black' : 'bg-white/8 border-white/10 text-white/20'}`}
           >
             <Zap className="w-5 h-5" />
           </button>
           <p className="text-[8px] font-bold text-white/60 uppercase leading-tight mt-1 px-1">Auto-Click<br/>Interceptor</p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full px-2 text-center group">
           <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em] group-hover:text-purple-400 transition-colors">Engine</span>
           <button 
             onClick={() => setScanInterval(scanInterval === 100 ? 500 : 100)} 
             data-tooltip={scanInterval === 100 ? "Set Engine to ECO Mode" : "Set Engine to FAST Mode"}
             data-tooltip-dir="right"
             className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${scanInterval === 100 ? 'bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] text-black border-purple-400' : 'bg-white/8 border-white/10 text-white/20'}`}
           >
             <Activity className="w-5 h-5" />
           </button>
           <p className="text-[8px] font-bold text-white/60 uppercase leading-tight mt-1 px-1">Scan Cycle<br/>Velocity</p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full px-2 text-center mt-auto group">
          <button 
             onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
             data-tooltip={isTerminalExpanded ? "Hide Telemetry" : "Show Telemetry"}
             data-tooltip-dir="right"
             className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${isTerminalExpanded ? 'bg-white/30 text-white border border-white/40 shadow-xl' : 'bg-white/8 text-white/20 border border-white/10'}`}
          >
             <Globe className="w-5 h-5" />
          </button>
          <p className="text-[8px] font-bold text-white/60 uppercase px-1">Terminal<br/>Link</p>
        </div>

      </aside>

      {/* ── RIGHT SIDEBAR: TELEMETRY ── */}
      <aside className="fixed right-0 top-[60px] bottom-0 w-[120px] border-l border-white/[0.05] bg-black/40 flex flex-col items-center py-8 gap-10 z-[100]">
        <div className="flex flex-col items-center gap-1.5 w-full text-center">
          <MetricSide label="Engine" value={isRunning ? "14%" : "0%"} icon={<Cpu className="w-4 h-4 text-cyan-400" />} tooltip="Current CPU Load" dir="left" />
          <p className="text-[8px] font-bold text-white/60 uppercase mt-1">System<br/>Compute</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 w-full text-center">
          <MetricSide label="Latency" value={isRunning ? "38ms" : "--"} icon={<Globe className="w-4 h-4 text-purple-400" />} tooltip="Network Roundtrip" dir="left" />
          <p className="text-[8px] font-bold text-white/60 uppercase mt-1">Response<br/>Delay</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 w-full text-center">
          <MetricSide label="Detected" value={adsClosed > 0 ? adsClosed.toString() : "NONE"} icon={<Zap className="w-4 h-4 text-emerald-400" />} tooltip="Ad Elements Caught" dir="left" />
          <p className="text-[8px] font-bold text-white/60 uppercase mt-1">Bypass<br/>Counter</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 w-full text-center">
          <MetricSide label="Health" value="ULTRA" icon={<Activity className="w-4 h-4 text-white/20" />} tooltip="System Integrity" dir="left" />
          <p className="text-[8px] font-bold text-white/60 uppercase mt-1">Core<br/>Stability</p>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE ── */}
      <main className="fixed top-[60px] bottom-0 left-[120px] right-[120px] z-10 p-0 flex">
        
        <div className="flex-1 flex min-h-0 relative">
          
          {/* Transition Group for Swapping Slots */}
          <div className="absolute inset-0 flex p-6 gap-6">
            
            {/* Slot A: Macbook OR Terminal */}
            <div className={`h-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isTerminalExpanded ? 'flex-1' : (mode === 'macbook' ? 'w-full' : 'w-0 opacity-0 pointer-events-none')}`}>
              {mode === 'macbook' ? (
                <div className="h-full bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden relative shadow-2xl flex items-center justify-center">
                   <img 
                      src={isRunning ? macScreenshot : ""} 
                      className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 scale-100 ${isRunning ? 'opacity-100' : 'opacity-0'}`} 
                   />
                   {!isRunning && (
                      <div className="flex flex-col items-center animate-pulse">
                         <Activity className="w-10 h-10 text-white/5 mb-3" />
                         <span className="text-[8px] text-white/10 uppercase font-black tracking-[0.4em]">Authorization Pending</span>
                      </div>
                   )}
                   <div className="absolute top-6 left-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-black text-cyan-500 uppercase tracking-widest">
                      MACBOOK_MIRROR_V1
                   </div>
                </div>
              ) : (
                isTerminalExpanded && <TerminalView logs={logs} isRunning={isRunning} setLogs={setLogs} />
              )}
            </div>

            {/* Slot B: Terminal OR iPhone Content */}
            <div className={`h-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isTerminalExpanded ? 'flex-1' : (mode === 'iphone' ? 'w-full' : 'w-0 opacity-0 pointer-events-none')}`}>
              {mode === 'iphone' ? (
                <div className="h-full bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden relative shadow-2xl flex items-center justify-center">
                   <div className="h-[95%] w-full flex items-center justify-center">
                      {/* Pixel-Perfect iPhone Display */}
                      <div className="h-full aspect-[9/19.5] relative bg-black shadow-[0_0_80px_rgba(0,0,0,0.8)] border-[2px] border-white/[0.08] rounded-[3rem] overflow-hidden">
                        <img 
                           src={isRunning ? iphoneScreenshot : ""} 
                           className="absolute inset-0 w-full h-full object-contain" 
                        />
                        {!isRunning && <div className="absolute inset-0 flex items-center justify-center opacity-5"><Smartphone className="w-16 h-16" /></div>}
                      </div>
                   </div>
                   <div className="absolute top-6 right-6 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-black text-purple-500 uppercase tracking-widest">
                      IPHONE_RETINA_LINK
                   </div>
                </div>
              ) : (
                isTerminalExpanded && <TerminalView logs={logs} isRunning={isRunning} setLogs={setLogs} />
              )}
            </div>

          </div>
        </div>

      </main>

      {/* Fixed Status Bar (Slim) */}
      <div className="fixed bottom-0 left-[100px] right-[100px] h-8 border-t border-white/[0.03] bg-black/40 flex items-center justify-between px-6 z-40 backdrop-blur-md">
         <div className="text-[6px] text-white/20 font-black tracking-[0.4em] uppercase">System Integration: Nominal_v4.2.1</div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[6px] font-black text-white/10">
               <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
               SECURE_SOCKET_OK
            </div>
         </div>
      </div>
    </div>
  );
}

function MetricSide({ label, value, icon, tooltip, dir }: { label: string; value: string; icon: any; tooltip: string; dir?: "left" | "right" }) {
  return (
    <div className="flex flex-col items-center gap-2 group cursor-help" data-tooltip={tooltip} data-tooltip-dir={dir}>
       <div className="text-white/20 group-hover:text-cyan-400 transition-colors transform group-hover:scale-110 duration-500">{icon}</div>
       <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em]">{label}</span>
       <span className="text-[12px] font-black text-white/80 group-hover:text-white transition-colors tracking-tighter">{value}</span>
    </div>
  );
}

