import React from 'react';
import { AlertTriangle, AlertOctagon, MapPin, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AlertPanel({ alerts, onAlertClick }) {
  const alertsList = Array.isArray(alerts) ? alerts : (alerts?.data || alerts?.alerts || []);
  if (!alertsList || alertsList.length === 0) return null;

  return (
    <div className="h-10 border-t border-command-border/80 bg-[#090e1b] flex items-center px-4 overflow-x-auto whitespace-nowrap z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 mr-4 flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 status-dot" />
        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
          Incident Feed ({alertsList.length})
        </span>
      </div>

      <div className="flex items-center gap-3">
        {alertsList.slice(0, 8).map(alert => {
          const isCritical = alert.risk_class === 'CRITICAL';
          const isHigh = alert.risk_class === 'HIGH';
          const latVal = parseFloat(alert.latitude || alert.lat);
          const lonVal = parseFloat(alert.longitude || alert.lon);
          
          return (
            <button
              key={alert.id}
              onClick={() => onAlertClick && !isNaN(latVal) && !isNaN(lonVal) && onAlertClick(latVal, lonVal, alert.district || alert.state)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400/50 transition-all text-xs flex-shrink-0 group cursor-pointer shadow-sm"
            >
              <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono uppercase ${
                isCritical 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : isHigh 
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {alert.risk_class}
              </span>

              <span className="text-xs text-slate-200 font-semibold group-hover:text-cyan-300 transition-colors">
                {alert.district || 'Location'}, {alert.state}
              </span>

              <span className="text-xs text-cyan-300 font-mono font-bold">
                {(alert.risk_probability != null ? alert.risk_probability * 100 : 50).toFixed(0)}%
              </span>

              {alert.created_at && (
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  · {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                </span>
              )}

              <ChevronRight size={13} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
