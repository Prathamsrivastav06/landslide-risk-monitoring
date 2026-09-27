import React from 'react';
import { AlertOctagon, AlertTriangle, Database, Cpu, Compass } from 'lucide-react';

export default function StatsBar({ alerts = [], landslideCount = 0 }) {
  const alertsList = Array.isArray(alerts) ? alerts : (alerts?.data || alerts?.alerts || []);
  
  const highRiskCount = alertsList.filter(a => a.risk_class === 'HIGH' || a.risk_class === 'CRITICAL').length;
  const criticalCount = alertsList.filter(a => a.risk_class === 'CRITICAL').length;

  return (
    <div className="h-9 border-b border-command-border/80 bg-[#0a0f1d] flex items-center px-4 gap-4 sm:gap-6 overflow-x-auto select-none">
      {/* Active High Risk */}
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded ${highRiskCount > 0 ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800/60 text-slate-500'}`}>
          <AlertTriangle size={11} />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Active High Risk:</span>
        <span className={`text-xs font-mono font-bold ${highRiskCount > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
          {highRiskCount}
        </span>
      </div>

      <div className="h-3.5 w-px bg-white/10" />

      {/* Critical Alerts */}
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded ${criticalCount > 0 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800/60 text-slate-500'}`}>
          <AlertOctagon size={11} />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Critical Alerts:</span>
        <span className={`text-xs font-mono font-bold ${criticalCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
          {criticalCount}
        </span>
      </div>

      <div className="h-3.5 w-px bg-white/10" />

      {/* Historical Landslides in Database */}
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-cyan-500/10 text-cyan-400">
          <Database size={11} />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Historical DB:</span>
        <span className="text-xs font-mono font-bold text-cyan-300">
          {landslideCount} <span className="text-[10px] font-normal text-slate-500">events mapped</span>
        </span>
      </div>

      <div className="h-3.5 w-px bg-white/10 hidden md:block" />

      {/* Region tag */}
      <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
        <Compass size={11} className="text-slate-500" />
        <span>NER BOUNDS: 20°-30°N, 88°-98°E</span>
      </div>

      {/* Model status tag */}
      <div className="flex items-center gap-2 ml-auto">
        <Cpu size={11} className="text-cyan-400" />
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium hidden sm:inline">Model:</span>
        <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 font-semibold">
          RF Calibrated v2.0 (89% ROC-AUC) · SHAP
        </span>
      </div>
    </div>
  );
}
