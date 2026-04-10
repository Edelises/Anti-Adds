"use client";

import { useState, useEffect, useRef, memo } from "react";
import { 
  Activity, Smartphone, 
  Cpu, Zap, Globe 
} from "lucide-react";

const API = "http://localhost:8000";

export default function Dashboard() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState("macbook");
  const [threshold, setThreshold] = useState(75);
  const [jitter, setJitter] = useState(5);
  const [logs, setLogs] = useState<string[]>([]);
  const lastLogCountRef = useRef(0);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sequential Polling: Prevents UI lag by waiting for previous request to finish
  const pollStatus = async () => {
    try {
      const resp = await fetch(`${API}/status`);
      if (resp.ok) {
        const data = await resp.json();
        setIsConnected(true);
        setIsRunning(data.is_running);
        setMode(data.mode || "macbook");

        if (data.config) {
          setThreshold(Math.round(data.config.threshold * 100));
          setJitter(data.config.jitter);
        }

        const newLogs: string[] = data.logs || [];
        if (newLogs.length !== lastLogCountRef.current) {
          lastLogCountRef.current = newLogs.length;
          setLogs(newLogs);
        }
      }
    } catch (err) {
      setIsConnected(false);
    } finally {
      // Schedule next poll ONLY after this one is done
      pollTimerRef.current = setTimeout(pollStatus, 800);
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
    if (!isConnected) return;
    try {
        await fetch(`${API}/toggle`, { method: "POST" });
        // Immediate visual feedback
        setIsRunning(prev => !prev);
    } catch (e) {}
  };

  const setAppMode = (m: string) => {
    setMode(m);
    fetch(`${API}/set_mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: m }),
    });
  };

  const ts = Date.now();
  const macScreenshot = `${API}/screenshot?t=${ts}`;
  const iphoneScreenshot = `${API}/screenshot_iphone?t=${ts}`;

  return (
    <div className="fixed inset-0 bg-[#08080a] text-white font-sans select-none" style={{ overflow: 'clip' }}>

      {/* ── Background FX ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-8 bg-black/40 border-b border-white/[0.05] backdrop-blur-2xl">
        <div className="flex items-center space-x-4">
          <div className="relative bg-[#0a0a0c] overflow-hidden rounded-xl border border-white/10 w-10 h-10 flex items-center justify-center">
            <img src="/app-icon.png" className="w-full h-full object-contain" alt="Logo" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest uppercase bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Anti-Ads Detector
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
              <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-white/30 truncate">
                {isConnected ? "Secure Link Active" : "Searching for Server..."}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <nav className="flex items-center bg-white/[0.03] p-1 rounded-full border border-white/[0.05]">
            <button onClick={() => setAppMode("macbook")} className={`px-5 py-1.5 rounded-full text-[10px] font-bold transition-all ${mode === "macbook" ? "bg-white/10 text-cyan-400 shadow-inner" : "text-white/30 hover:text-white/50"}`}>Macbook</button>
            <button onClick={() => setAppMode("iphone")} className={`px-5 py-1.5 rounded-full text-[10px] font-bold transition-all ${mode === "iphone" ? "bg-white/10 text-cyan-400 shadow-inner" : "text-white/30 hover:text-white/50"}`}>iPhone</button>
          </nav>

          <button
            onClick={toggleAutomation}
            disabled={!isConnected}
            className={`px-8 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!isConnected ? "opacity-30 cursor-not-allowed" : isRunning ? "bg-red-500/20 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-cyan-500 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)]"}`}
          >
            {!isConnected ? "System Offline" : isRunning ? "Stop Engine" : "Run Detector"}
          </button>
        </div>
      </header>

      {/* ── Main Dashboard ── */}
      <main className="fixed top-[72px] bottom-10 left-0 right-0 z-10 flex items-stretch gap-6 px-8 py-6">
        
        {/* Left Monitoring: Fixed Aspect Stability */}
        <div className="flex-[8] flex flex-col min-h-0 gap-6">
          <div className="grid grid-cols-2 gap-6 flex-1 min-h-0 items-center">
            {/* Master Feed: Aspect Video */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden relative shadow-2xl aspect-video w-full">
               <img 
                 src={isRunning ? macScreenshot : ""} 
                 className={`absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-300 ${isRunning ? 'opacity-100' : 'opacity-0'}`} 
               />
               {!isRunning && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/10 uppercase tracking-[0.4em] font-black">Ready for Scan</div>}
            </div>
            {/* Injection Feed: Responsive Aspect */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden relative shadow-2xl h-full flex items-center justify-center">
               {mode === "iphone" && isRunning ? (
                 <div className="aspect-[9/19.5] h-[90%] w-auto relative">
                    <img src={iphoneScreenshot} className="absolute inset-0 w-full h-full object-contain rounded-[2rem] border border-white/5" />
                 </div>
               ) : (
                 <div className="text-[10px] text-white/10 uppercase tracking-[0.4em] font-black flex flex-col items-center gap-4">
                    <Smartphone className="opacity-5 w-12 h-12" />
                    <span>Injection Standby</span>
                 </div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 h-20 flex-shrink-0">
             <MetricBox label="Engine Load" value={isRunning ? "12%" : "0%"} icon={<Cpu className="w-3 h-3 text-cyan-500" />} />
             <MetricBox label="Threshold" value={`${threshold}%`} icon={<Zap className="w-3 h-3 text-yellow-500" />} />
             <MetricBox label="Sync Rate" value={isRunning ? "60Hz" : "0Hz"} icon={<Globe className="w-3 h-3 text-purple-500" />} />
             <MetricBox label="Health" value="100%" icon={<Activity className="w-3 h-3 text-emerald-500" />} />
          </div>
        </div>

        {/* Right Console */}
        <div className="w-[340px] flex flex-col min-h-0 gap-6">
          <div className="bg-white/[0.03] rounded-[2rem] border border-white/[0.05] p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center"><span className="text-[9px] text-white/40 uppercase font-black">AI Accuracy</span><span className="text-[10px] font-mono text-cyan-400">{threshold}%</span></div>
            <input type="range" min="10" max="100" value={threshold} disabled className="w-full h-1 bg-white/10 rounded-full appearance-none accent-cyan-500 opacity-50" />
            <div className="flex justify-between items-center"><span className="text-[9px] text-white/40 uppercase font-black">Stability</span><span className="text-[10px] font-mono text-white/60">{jitter}px</span></div>
          </div>

          <TerminalLog logs={logs} isRunning={isRunning} />
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-10 flex items-center justify-between px-8 bg-white/[0.01] border-t border-white/[0.05] text-[7px] font-black uppercase tracking-[0.3em] text-white/10">
         <div>ENGINE V2.5.0_STABLE</div>
         <div className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-cyan-500 animate-pulse' : 'bg-red-500'}`} />
            DESKTOP SYNCHRONIZED
         </div>
      </footer>
    </div>
  );
}

const TerminalLog = memo(function TerminalLog({ logs, isRunning }: { logs: string[]; isRunning: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Smart Auto-Scroll: Only triggers if user is already at the bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (isAtBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex-1 min-h-0 bg-black/40 rounded-[2rem] border border-white/[0.05] flex flex-col overflow-hidden relative shadow-inner">
       <div className="px-5 py-3 border-b border-white/[0.05] bg-black/20 flex-shrink-0 flex justify-between items-center">
          <span className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Live Telemetry</span>
          {isRunning && <div className="w-1 h-1 rounded-full bg-cyan-500 animate-ping" />}
       </div>
       <div
         ref={scrollRef}
         className="absolute inset-0 top-10 p-5 font-mono text-[9px] overflow-y-auto overflow-x-hidden space-y-2 scroll-smooth"
         style={{ overscrollBehavior: 'none' }}
       >
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2 text-white/40 border-l border-white/10 pl-2 leading-relaxed animate-in fade-in slide-in-from-left-1 duration-300">
              <span className="opacity-10 shrink-0 text-[7px]">{i+1}</span>
              <span className="break-all">{log}</span>
            </div>
          ))}
          {isRunning && <div className="ml-4 w-1 h-3 bg-cyan-500 animate-pulse" />}
       </div>
    </div>
  );
});

function MetricBox({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-2xl flex flex-col justify-center items-center text-center group hover:bg-white/[0.04] transition-all duration-300 border-b-2 border-b-transparent hover:border-b-cyan-500/30">
       <div className="text-white/20 mb-1 group-hover:text-cyan-500 transition-colors transform group-hover:scale-110">{icon}</div>
       <p className="text-[7px] text-white/20 uppercase tracking-widest mb-0.5 font-bold">{label}</p>
       <p className="text-[10px] font-black text-white/60 group-hover:text-cyan-400 transition-colors">{value}</p>
    </div>
  );
}
