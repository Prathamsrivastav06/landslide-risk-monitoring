import React from 'react';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SourceAttribution({ source, time, note }) {
  let timeStr = null;
  if (time) {
    try {
      timeStr = formatDistanceToNow(new Date(time), { addSuffix: true });
    } catch { timeStr = time; }
  }
  
  return (
    <div className="flex items-center gap-1 mt-1">
      <Clock size={10} className="text-gray-600" />
      <span className="text-xs text-gray-600">
        {source && <span>{source}</span>}
        {timeStr && <span> · {timeStr}</span>}
        {note && <span> · {note}</span>}
      </span>
    </div>
  );
}
