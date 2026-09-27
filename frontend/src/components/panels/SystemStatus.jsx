import React from 'react';
import { Database, Cpu, Activity } from 'lucide-react';

export default function SystemStatus({ healthData }) {
  const dbStatus = healthData?.system?.database || healthData?.db?.status || 'CONNECTED';
  const mlStatus = healthData?.system?.ml_service || healthData?.ml?.status || 'ONLINE';
  
  const isDbOk = dbStatus === 'CONNECTED' || dbStatus === 'OK';
  const isMlOk = mlStatus === 'ONLINE' || mlStatus === 'OK';

  return (
    <div className="flex items-center gap-2">
      {/* Database indicator */}
      <div 
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono transition-all ${
          isDbOk 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}
        title={`PostgreSQL/PostGIS Database: ${dbStatus}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${isDbOk ? 'bg-emerald-400 status-dot' : 'bg-rose-400'}`} />
        <Database size={11} className="opacity-70" />
        <span>DB: {dbStatus}</span>
      </div>

      {/* ML Service indicator */}
      <div 
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono transition-all ${
          isMlOk 
            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' 
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}
        title={`FastAPI ML Model Service: ${mlStatus}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${isMlOk ? 'bg-cyan-400 status-dot' : 'bg-amber-400'}`} />
        <Cpu size={11} className="opacity-70" />
        <span>ML: {mlStatus}</span>
      </div>

      {/* Telemetry pill */}
      <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
        <Activity size={10} className="text-emerald-400 animate-pulse" />
        <span>TELEMETRY ACTIVE</span>
      </div>
    </div>
  );
}
