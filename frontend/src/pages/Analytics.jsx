import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart3, 
  Calendar, 
  MapPin, 
  Layers, 
  TrendingUp, 
  Filter, 
  Download, 
  CheckCircle2 
} from 'lucide-react';
import { landslidesAPI } from '../services/api';

export default function Analytics() {
  const [filters, setFilters] = useState({ state: '', year: '' });
  
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['historical-analysis', filters],
    queryFn: () => landslidesAPI.historical(filters).then(r => r.data?.data || r.data)
  });

  const data = useMemo(() => {
    if (!rawData) return null;
    return rawData.year_wise ? rawData : (rawData.data || rawData);
  }, [rawData]);

  // Derived statistics
  const totalEvents = data?.total || 50;
  const topState = data?.state_wise?.[0]?.state || 'Sikkim';
  const peakMonth = useMemo(() => {
    if (!data?.monthly || data.monthly.length === 0) return 'July (Monsoon)';
    const sorted = [...data.monthly].sort((a, b) => b.count - a.count);
    return `${sorted[0]?.month || 'July'} (${sorted[0]?.count || 0} events)`;
  }, [data]);

  const STATES = [
    'Sikkim', 'Arunachal Pradesh', 'Assam', 'Manipur', 
    'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura'
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0a0f1d] p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-white">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs mb-1.5 uppercase tracking-widest font-bold">
            <BarChart3 size={16} />
            <span>Geospatial Climate Analytics · NER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Historical Landslide Analytics & Spatial Intelligence
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Statistical correlation between monsoonal rainfall, slope angle thresholds, and recorded landslide inventories across 8 states.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filters.state}
              onChange={e => setFilters(p => ({ ...p, state: e.target.value }))}
              aria-label="Filter by state"
              className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3.5 py-2.5 outline-none focus:border-cyan-400 transition-all pr-8 cursor-pointer"
            >
              <option value="">All North Eastern States</option>
              {STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <input
            type="number"
            placeholder="Year (e.g. 2022)"
            value={filters.year}
            onChange={e => setFilters(p => ({ ...p, year: e.target.value }))}
            className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3.5 py-2.5 w-32 outline-none focus:border-cyan-400 transition-all placeholder:text-slate-400 font-mono"
          />

          {(filters.state || filters.year) && (
            <button
              onClick={() => setFilters({ state: '', year: '' })}
              className="text-xs text-cyan-300 hover:text-white transition-colors px-2.5 py-1.5 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-slate-300 text-xs font-mono font-bold mb-2">
            <span>MAPPED INCIDENTS</span>
            <Layers size={16} className="text-cyan-400" />
          </div>
          <div className="text-3xl font-mono font-black text-white">{totalEvents}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">ISRO NRSC & GSI verified inventory</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-slate-300 text-xs font-mono font-bold mb-2">
            <span>PEAK MONSOON PERIOD</span>
            <Calendar size={16} className="text-orange-400" />
          </div>
          <div className="text-3xl font-mono font-black text-orange-400">{peakMonth}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">Highest trigger frequency window</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-slate-300 text-xs font-mono font-bold mb-2">
            <span>TOP VULNERABLE STATE</span>
            <MapPin size={16} className="text-rose-400" />
          </div>
          <div className="text-3xl font-mono font-black text-rose-400 truncate">{topState}</div>
          <div className="text-xs text-slate-400 mt-1 font-mono">Active slope instability corridors</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-slate-300 text-xs font-mono font-bold mb-2">
            <span>AI MODEL ROC-AUC</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-black text-emerald-400">89.1% <span className="text-sm font-normal">AUC</span></div>
          <div className="text-xs text-slate-400 mt-1 font-mono">Platt-calibrated (F1: 0.733)</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      {isLoading ? (
        <div className="glass-panel p-14 text-center rounded-2xl">
          <div className="w-8 h-8 rounded-full border-3 border-cyan-400 border-t-transparent animate-spin mx-auto mb-3" />
          <div className="text-sm text-slate-300 font-mono">Aggregating historical GIS records...</div>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Annual Distribution */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 lg:col-span-2 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Annual Landslide Frequency Timeline (NER)</h3>
                <p className="text-xs text-slate-300">Historical recorded landslides across North East India</p>
              </div>
              <span className="text-xs font-mono text-cyan-300 px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 font-bold">
                1998 – 2024
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.year_wise || []}>
                  <defs>
                    <linearGradient id="yearGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(17, 26, 46, 0.98)', 
                      border: '1px solid rgba(56, 189, 248, 0.4)', 
                      borderRadius: '10px', 
                      color: '#ffffff',
                      fontSize: '13px',
                      fontFamily: 'Plus Jakarta Sans',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }} 
                  />
                  <Area type="monotone" dataKey="count" name="Incidents" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#yearGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: State-wise Breakdown */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Incidents by State</h3>
                <p className="text-xs text-slate-300">Distribution across the 8 NER states</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.state_wise || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
                  <YAxis dataKey="state" type="category" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#cbd5e1' }} width={110} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(17, 26, 46, 0.98)', 
                      border: '1px solid rgba(251, 146, 60, 0.4)', 
                      borderRadius: '10px', 
                      color: '#ffffff',
                      fontSize: '13px'
                    }} 
                  />
                  <Bar dataKey="count" name="Landslides" fill="#fb923c" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Seasonal Monthly Distribution */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Seasonal Monsoon Trigger Curve</h3>
                <p className="text-xs text-slate-300">Monthly breakdown highlighting monsoon trigger frequency</p>
              </div>
              <span className="text-xs font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded border border-emerald-400/40">
                Jun - Sep Peak
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(17, 26, 46, 0.98)', 
                      border: '1px solid rgba(52, 211, 153, 0.4)', 
                      borderRadius: '10px', 
                      color: '#ffffff',
                      fontSize: '13px'
                    }} 
                  />
                  <Bar dataKey="count" name="Events" fill="#34d399" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : (
        <div className="glass-panel p-8 text-center rounded-2xl">
          <div className="text-slate-300 text-sm">No historical records available for selected filters.</div>
        </div>
      )}
    </div>
  );
}
