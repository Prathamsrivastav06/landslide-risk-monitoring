export const RISK_COLORS = {
  LOW: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', hex: '#22c55e', mapColor: '#22c55e' },
  MODERATE: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', hex: '#eab308', mapColor: '#eab308' },
  HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', hex: '#f97316', mapColor: '#f97316' },
  CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', hex: '#ef4444', mapColor: '#ef4444' },
};

export function getRiskColor(riskClass) {
  return RISK_COLORS[riskClass] || RISK_COLORS.LOW;
}

export function getProbabilityColor(prob) {
  if (prob < 0.25) return RISK_COLORS.LOW;
  if (prob < 0.50) return RISK_COLORS.MODERATE;
  if (prob < 0.75) return RISK_COLORS.HIGH;
  return RISK_COLORS.CRITICAL;
}
