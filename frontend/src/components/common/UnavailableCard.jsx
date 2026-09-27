import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function UnavailableCard({ title, reason, compact = false }) {
  return (
    <div className={`flex items-start gap-2 ${compact ? '' : 'p-3 glass-panel rounded'}`}>
      <AlertCircle size={14} className="text-yellow-500/70 mt-0.5 flex-shrink-0" />
      <div>
        {!compact && title && <div className="text-xs font-medium text-gray-400 mb-0.5">{title} Unavailable</div>}
        {compact && <div className="text-xs text-yellow-500/70">Data currently unavailable</div>}
        {reason && <div className="text-xs text-gray-600">{reason}</div>}
      </div>
    </div>
  );
}
