"use client";

import { memo, useRef, useEffect } from "react";
import { Activity, Eraser } from "lucide-react";

const API = "http://localhost:8000";

export const TerminalView = memo(function TerminalView({ logs, isRunning, setLogs }: { logs: string[]; isRunning: boolean; setLogs?: (logs: string[]) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const clearLogs = async () => {
    try {
      // Optmistically clear UI first for instant feedback
      if (setLogs) setLogs([]); 
      await fetch(`${API}/clear_logs`, { method: "POST" });
    } catch (err) {
      console.error("Failed to clear logs:", err);
    }
  };

  return (
    <div className="h-full bg-black/80 rounded-[2rem] border border-white/[0.05] flex flex-col overflow-hidden relative shadow-2xl animate-in fade-in duration-500">
        <div className="p-6 border-b border-white/[0.05] bg-white/[0.03] flex justify-between items-center mr-6">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase text-white/60 tracking-[0.3em]">System_Telemetry</span>
             {isRunning && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping shadow-[0_0_10px_#06b6d4]" />}
          </div>
          <button 
             onClick={clearLogs}
             className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
             title="Clear Logs"
          >
             <Eraser className="w-4 h-4 text-white/40 group-hover:text-red-400" />
          </button>
       </div>
       <div ref={scrollRef} className="flex-1 p-8 font-mono text-[10px] overflow-y-auto terminal-scrollbar space-y-3">
          {logs.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                <Activity className="w-12 h-12" />
                <p className="uppercase tracking-[0.3em] text-[8px]">Awaiting Uplink...</p>
             </div>
          ) : logs.map((log, i) => (
            <div key={i} className="flex gap-4 text-white/70 hover:text-cyan-400 group transition-all">
              <span className="opacity-20 shrink-0 text-[8px] group-hover:opacity-60">[{i+1}]</span>
              <span className="break-all tracking-tight">{log}</span>
            </div>
          ))}
          {isRunning && <div className="ml-5 w-1 h-3 bg-cyan-500 animate-pulse mt-3" />}
       </div>
    </div>
  );
});
