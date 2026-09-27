import React from 'react';
import { getRiskColor } from '../../utils/riskColors';

export default function RiskBadge({ risk, size = 'sm' }) {
  if (!risk) return null;
  const colors = getRiskColor(risk);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
      {risk}
    </span>
  );
}
