import React, { useState, useEffect } from 'react';
import { MapPin, Mountain, X, CloudRain, AlertTriangle, History } from 'lucide-react';
import RiskBadge from '../common/RiskBadge';
import { landslidesAPI } from '../../services/api';

const WMO_CODES = {
  0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
  45:'Foggy', 48:'Icy fog', 51:'Light drizzle', 53:'Moderate drizzle', 55:'Heavy drizzle',
  61:'Slight rain', 63:'Moderate rain', 65:'Heavy rain', 71:'Slight snow', 73:'Moderate snow',
  75:'Heavy snow', 80:'Slight showers', 81:'Moderate showers', 82:'Violent showers',
  95:'Thunderstorm', 96:'Thunderstorm+hail', 99:'Thunderstorm+heavy hail'
};
const WMO_ICONS = {
  0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️', 45:'🌫️', 48:'🌫️', 51:'🌦️', 53:'🌦️', 55:'🌧️',
  61:'🌧️', 63:'🌧️', 65:'🌧️', 71:'🌨️', 73:'🌨️', 75:'❄️', 80:'🌦️', 81:'🌧️', 82:'⛈️',
  95:'⛈️', 96:'⛈️', 99:'⛈️'
};

// ── LIVE WEATHER (Open-Meteo) ───────────────────────────────────────────────
function LiveWeatherCard({ lat, lon }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  useEffect(() => {
    if (isNaN(latNum) || isNaN(lonNum)) return;
    setLoading(true); setWeather(null);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,` +
      `wind_speed_10m,apparent_temperature,surface_pressure&timezone=auto`)
      .then(r => r.json())
      .then(d => { setWeather(d?.current || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [latNum, lonNum]);

  if (isNaN(latNum) || isNaN(lonNum)) return null;

  const code = weather?.weather_code ?? -1;
  const icon = WMO_ICONS[code] ?? '🌡️';
  const desc = WMO_CODES[code] ?? 'Current Conditions';
  const isRaining = (weather?.rain ?? 0) > 0 || [51,53,55,61,63,65,80,81,82,95,96,99].includes(code);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-md">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/40">
        <CloudRain size={14} className="text-cyan-400" />
        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Live Weather Station</span>
        <span className="ml-auto text-xs text-emerald-400 font-mono font-bold">● LIVE</span>
      </div>
      {loading && <div className="px-3.5 py-3 text-xs text-slate-300 animate-pulse font-mono">Querying Open-Meteo telemetry...</div>}
      {weather && !loading && (
        <div className="p-3.5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-2xl font-black text-white font-mono">{Number(weather.temperature_2m || 0).toFixed(0)}°C</div>
              <div className="text-xs text-slate-300 font-medium">Feels {Number(weather.apparent_temperature || 0).toFixed(0)}°C</div>
              <div className={`text-sm mt-1 font-semibold ${isRaining ? 'text-cyan-300 font-bold' : 'text-slate-200'}`}>{icon} {desc}</div>
            </div>
            {isRaining && (
              <div className="bg-cyan-500/20 border border-cyan-400/50 rounded-lg px-2.5 py-1.5 text-right shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                <div className="text-xs text-cyan-300 font-bold">⚠ Rain Active</div>
                <div className="text-lg font-extrabold text-white font-mono">{Number(weather.rain || 0).toFixed(1)} mm</div>
                <div className="text-xs text-slate-300">last hour</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['💧 Humidity', `${weather.relative_humidity_2m ?? '—'}%`],
              ['💨 Wind Speed', `${Number(weather.wind_speed_10m || 0).toFixed(1)} km/h`],
              ['🌧 Precip.', `${Number(weather.precipitation || 0).toFixed(1)} mm`, isRaining ? 'text-cyan-300 font-bold' : 'text-slate-100'],
              ['📊 Pressure', `${Number(weather.surface_pressure || 1013).toFixed(0)} hPa`],
            ].map(([label, val, cls]) => (
              <div key={label} className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80">
                <div className="text-xs text-slate-300 font-medium mb-0.5">{label}</div>
                <div className={`text-sm font-bold font-mono ${cls || 'text-white'}`}>{val}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-400 font-mono">Station: Open-Meteo · {latNum.toFixed(3)}°N, {lonNum.toFixed(3)}°E</div>
        </div>
      )}
    </div>
  );
}

// ── HISTORICAL WEATHER (Open-Meteo Archive) ─────────────────────────────────
function HistoricalWeatherCard({ lat, lon }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  useEffect(() => {
    if (isNaN(latNum) || isNaN(lonNum)) return;
    setLoading(true); setHistory(null);

    const today = new Date();
    const end = new Date(today); end.setDate(end.getDate() - 1);
    const start = new Date(today); start.setDate(start.getDate() - 14);
    const fmt = d => d.toISOString().split('T')[0];

    fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${latNum}&longitude=${lonNum}` +
      `&start_date=${fmt(start)}&end_date=${fmt(end)}` +
      `&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,rain_sum,et0_fao_evapotranspiration` +
      `&timezone=auto`)
      .then(r => r.json())
      .then(d => { setHistory(d?.daily || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [latNum, lonNum]);

  if (isNaN(latNum) || isNaN(lonNum)) return null;

  if (loading) return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <History size={14} className="text-purple-400" />
        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Historical Weather</span>
      </div>
      <div className="text-xs text-slate-300 animate-pulse font-mono">Loading 14-day history...</div>
    </div>
  );

  if (!history || !Array.isArray(history.time)) return null;

  const dates = history.time || [];
  const precip = (history.precipitation_sum || []).map(v => Number(v) || 0);

  const total7d = precip.slice(-7).reduce((a, b) => a + b, 0);
  const total14d = precip.reduce((a, b) => a + b, 0);
  const maxDaily = precip.length > 0 ? Math.max(...precip, 0) : 0;
  const maxBar = maxDaily || 1;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-md">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/40">
        <History size={14} className="text-purple-400" />
        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">14-Day Antecedent Rainfall</span>
      </div>
      <div className="p-3.5 space-y-3">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg text-center">
            <div className="text-xs text-slate-300">7-Day Total</div>
            <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">{total7d.toFixed(1)}</div>
            <div className="text-xs text-slate-400">mm rain</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg text-center">
            <div className="text-xs text-slate-300">14-Day Total</div>
            <div className="text-base font-bold text-purple-300 font-mono mt-0.5">{total14d.toFixed(1)}</div>
            <div className="text-xs text-slate-400">mm rain</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-lg text-center">
            <div className="text-xs text-slate-300">Peak Day</div>
            <div className="text-base font-bold text-amber-300 font-mono mt-0.5">{maxDaily.toFixed(1)}</div>
            <div className="text-xs text-slate-400">mm/day</div>
          </div>
        </div>

        {/* Bar chart — daily precipitation */}
        <div className="text-xs font-semibold text-slate-300">Daily Precipitation History (mm)</div>
        <div className="flex items-end gap-1 h-16 bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
          {precip.slice(-14).map((val, i) => {
            const d = dates.slice(-14)[i];
            const label = d ? new Date(d).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2) : '';
            const pct = val ? (val / maxBar) * 100 : 0;
            const isHeavy = val > 20;
            return (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end" title={`${d}: ${val.toFixed(1)}mm`}>
                <div
                  className={`w-full rounded-t transition-all ${isHeavy ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : val > 5 ? 'bg-cyan-400' : val > 0 ? 'bg-cyan-600' : 'bg-slate-700'}`}
                  style={{ height: `${Math.max(pct, val > 0 ? 12 : 4)}%` }}
                />
                <div className="text-xs text-slate-400 mt-1 font-mono">{label}</div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 font-mono">Source: Open-Meteo ERA5 Reanalysis Archive</div>
      </div>
    </div>
  );
}

// ── NEARBY LANDSLIDE HISTORY ────────────────────────────────────────────────
function NearbyLandslideHistory({ lat, lon }) {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);

  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  useEffect(() => {
    if (isNaN(latNum) || isNaN(lonNum)) return;
    setLoading(true); setEvents(null);
    landslidesAPI.nearby(latNum, lonNum, 30)
      .then(r => {
        const data = r.data?.data || r.data;
        setEvents(Array.isArray(data) ? data : data?.events || data?.landslides || []);
        setLoading(false);
      })
      .catch(() => { setEvents([]); setLoading(false); });
  }, [latNum, lonNum]);

  if (isNaN(latNum) || isNaN(lonNum)) return null;

  const validYears = (events || []).map(e => parseInt(e.year || (e.event_date ? new Date(e.event_date).getFullYear() : null))).filter(y => !isNaN(y) && y > 1950);
  const earliestYear = validYears.length > 0 ? Math.min(...validYears) : 'Historical';

  const typeColors = {
    'Debris Flow': 'text-orange-400', 'Rockfall': 'text-red-400',
    'Debris Slide': 'text-orange-300', 'Earthflow': 'text-yellow-400',
    'Slump': 'text-yellow-300', 'Massive Debris Flow': 'text-red-500',
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-md">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/40">
        <AlertTriangle size={14} className="text-orange-400" />
        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Past Landslides (30km Radius)</span>
        {events && <span className="ml-auto text-xs font-bold text-orange-300 font-mono bg-orange-500/20 px-2 py-0.5 rounded border border-orange-500/30">{events.length} events</span>}
      </div>

      {loading && (
        <div className="p-3.5 text-xs text-slate-300 animate-pulse font-mono">Searching historical records in PostGIS...</div>
      )}

      {events && events.length === 0 && (
        <div className="p-3.5 text-xs text-slate-300">No recorded historical events within 30km radius.</div>
      )}

      {events && events.length > 0 && (
        <div className="p-3.5 space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-xs text-slate-300">Total Scars</div>
              <div className="text-base font-bold text-orange-300 font-mono mt-0.5">{events.length}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-xs text-slate-300">Earliest</div>
              <div className="text-base font-bold text-white font-mono mt-0.5">{earliestYear}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-center">
              <div className="text-xs text-slate-300">Rain Triggered</div>
              <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
                {events.filter(e => (e.trigger_type || '').toLowerCase().includes('rain')).length}
              </div>
            </div>
          </div>

          {/* Event list */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {events.slice(0, 15).map((ev, i) => (
              <div key={ev.id || i} className="flex items-start gap-2.5 p-2 border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900 rounded-lg transition-colors">
                <div className="flex-shrink-0 w-14 text-xs text-slate-300 font-mono mt-0.5 font-semibold">
                  {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en', { month: 'short', year: '2-digit' }) : ev.year || '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold ${typeColors[ev.landslide_type] || 'text-slate-200'} truncate`}>
                    {ev.landslide_type || 'Debris Slide'}
                  </div>
                  <div className="text-xs text-slate-300 truncate">
                    {ev.district || ev.state} · {ev.trigger_type || 'Monsoon Rain'}
                  </div>
                </div>
                {ev.distance_km != null && (
                  <div className="text-xs text-cyan-300 font-bold flex-shrink-0 font-mono">{Number(ev.distance_km).toFixed(1)}km</div>
                )}
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-400 font-mono pt-1">Source: ISRO / Geological Survey of India (GSI) Inventory</div>
        </div>
      )}
    </div>
  );
}

// ── TERRAIN CARD ────────────────────────────────────────────────────────────
function TerrainCard({ terrain }) {
  if (!terrain?.available) return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5">
      <div className="flex items-center gap-2 mb-1">
        <Mountain size={14} className="text-slate-400" />
        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Terrain (SRTM 30m DEM)</span>
      </div>
      <div className="text-xs text-slate-300">{terrain?.reason || 'Terrain data loading...'}</div>
    </div>
  );

  const slope = Number(terrain.slope_degree ?? 0);
  const elev = Number(terrain.elevation_m ?? 0);

  const slopeRisk = slope > 35 ? { label: 'VERY HIGH', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40' }
    : slope > 25 ? { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/40' }
    : slope > 15 ? { label: 'MODERATE', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' }
    : { label: 'LOW', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' };

  const elevZone = elev > 3500 ? 'Alpine/Nival Zone'
    : elev > 2000 ? 'Sub-Alpine High Relief'
    : elev > 1000 ? 'Montane Steep Slopes'
    : elev > 300 ? 'Foothill Sector'
    : 'Alluvial Plains';

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-md">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/40">
        <Mountain size={14} className="text-cyan-400" />
        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Geotechnical Terrain Relief (SRTM 30m)</span>
      </div>
      <div className="p-3.5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-300 mb-0.5 font-medium">⛰ Elevation</div>
            <div className="text-2xl font-black text-white font-mono">{elev.toFixed(0)} m</div>
            <div className="text-xs text-slate-300 mt-1 font-medium">{elevZone}</div>
          </div>
          <div className={`rounded-xl p-3 text-center border ${slopeRisk.bg}`}>
            <div className="text-xs text-slate-300 mb-0.5 font-medium">📐 Slope Angle</div>
            <div className={`text-2xl font-black font-mono ${slopeRisk.color}`}>{slope.toFixed(1)}°</div>
            <div className={`text-xs mt-1 font-bold ${slopeRisk.color}`}>{slopeRisk.label} RISK</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1 font-mono font-medium">
            <span>0° (Flat)</span><span>15° (Mod)</span><span>25° (Critical)</span><span>45°+</span>
          </div>
          <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-amber-600 to-rose-600 relative">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg bg-white"
              style={{ left: `${Math.min((slope / 45) * 100, 100)}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI ANALYSIS CARD ─────────────────────────────────────────────────────────
function AIAnalysisCard({ analysis, loading }) {
  if (loading) return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-cyan-400">✦</span>
        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">AI Geotechnical Synthesis</span>
        <span className="ml-auto text-xs text-cyan-300 animate-pulse font-mono">● Analyzing...</span>
      </div>
      <div className="text-xs text-slate-300 font-mono">Synthesizing terrain relief, precipitation & historical records...</div>
    </div>
  );

  if (!analysis || analysis.error) return null;

  const riskColors = {
    CRITICAL: { border: 'border-rose-500/50', bg: 'bg-rose-500/10', text: 'text-rose-300', badge: 'bg-rose-500/25 text-rose-200 border-rose-500/50' },
    HIGH:     { border: 'border-orange-500/50', bg: 'bg-orange-500/10', text: 'text-orange-300', badge: 'bg-orange-500/25 text-orange-200 border-orange-500/50' },
    MODERATE: { border: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-300', badge: 'bg-amber-500/25 text-amber-200 border-amber-500/50' },
    LOW:      { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-300', badge: 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50' },
  };
  const colors = riskColors[analysis.risk_level] || riskColors.MODERATE;

  return (
    <div className={`border rounded-xl overflow-hidden shadow-md ${colors.border} bg-slate-900/90`}>
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/40">
        <span className="text-sm text-cyan-400">✦</span>
        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">AI Geotechnical Synthesis</span>
      </div>

      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-white font-mono">{analysis.risk_score || 25}<span className="text-sm text-slate-400 font-normal">/100</span></div>
            <div className="text-xs text-slate-300 font-medium">Threat Index</div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${colors.badge}`}>
            {analysis.risk_level || 'EVALUATED'}
          </div>
        </div>

        {analysis.headline && (
          <div className="text-xs font-semibold text-white leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            {analysis.headline}
          </div>
        )}

        {analysis.key_findings?.length > 0 && (
          <div className="space-y-1">
            {analysis.key_findings.slice(0, 3).map((f, i) => (
              <div key={i} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                <span className="text-cyan-400 font-bold flex-shrink-0">▸</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN PANEL ───────────────────────────────────────────────────────────────
export default function LocationRiskPanel({ location, riskData, onClose, loading, aiAnalysis, aiLoading }) {
  const [activeTab, setActiveTab] = useState('all');
  if (!location && !loading) return null;

  const numLat = parseFloat(riskData?.location?.lat ?? location?.lat ?? 0);
  const numLon = parseFloat(riskData?.location?.lon ?? location?.lon ?? 0);
  const isOutsideNER = riskData?.prediction?.available === false && riskData?.prediction?.reason?.includes('outside');

  const terrain = riskData?.environmental_data?.terrain;
  const prediction = riskData?.prediction;
  const shapValues = prediction?.shap_values || {};

  return (
    <div className="w-[380px] h-full border-l border-slate-700/80 overflow-y-auto flex-shrink-0 bg-[#0c1322]/98 backdrop-blur-md z-20 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/80 flex items-center justify-between sticky top-0 bg-[#0f172a]/98 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 status-dot" />
          <h2 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
            Location Risk Dossier
          </h2>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 bg-[#0a0f1d] px-3 py-1.5 gap-1.5 sticky top-[45px] z-10">
        {[
          { key: 'all', label: 'Overview' },
          { key: 'terrain', label: 'Terrain' },
          { key: 'ml', label: 'AI Model' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === t.key
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="p-8 text-center space-y-3 my-auto">
          <div className="w-10 h-10 rounded-full border-3 border-cyan-400 border-t-transparent animate-spin mx-auto" />
          <div className="text-white text-sm font-bold animate-pulse font-mono">Calculating Risk Telemetry...</div>
          <div className="text-slate-400 text-xs font-mono">Analyzing SRTM DEM, Climate & Platt Model</div>
        </div>
      )}

      {/* Boundary or Error Card */}
      {isOutsideNER && !loading && (
        <div className="p-4 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-center space-y-3 shadow-lg">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Outside Regional Coverage</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Selected point ({numLat.toFixed(3)}°N, {numLon.toFixed(3)}°E) is outside the primary North Eastern Region (NER) disaster monitoring perimeter (20°–30°N, 88°–98°E).
            </p>
          </div>
        </div>
      )}

      {riskData && !loading && !isOutsideNER && (
        <div className="p-4 space-y-3.5">
          {/* Location Header Card */}
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/80 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base font-bold text-white flex items-center gap-1.5">
                  <MapPin size={16} className="text-cyan-400 flex-shrink-0" />
                  <span>
                    {riskData.location?.district && riskData.location.district !== 'Unknown'
                      ? riskData.location.district
                      : `${numLat.toFixed(3)}°N, ${numLon.toFixed(3)}°E`}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5 ml-5 font-medium">
                  {riskData.location?.state && riskData.location.state !== 'Unknown'
                    ? riskData.location.state : 'North Eastern Region'}
                </div>
              </div>

              <span className="text-xs font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 font-bold">
                WGS-84
              </span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
              <span>LAT: {numLat.toFixed(4)}°N</span>
              <span>LON: {numLon.toFixed(4)}°E</span>
            </div>
          </div>

          {/* AI Synthesis */}
          <AIAnalysisCard analysis={aiAnalysis?.analysis} loading={aiLoading} />

          {/* AI Model Risk Score & SHAP */}
          {(activeTab === 'all' || activeTab === 'ml') && (
            <div className={`p-4 rounded-xl border shadow-md ${
              prediction?.risk_class === 'CRITICAL' ? 'border-rose-500/50 bg-rose-500/10' :
              prediction?.risk_class === 'HIGH'     ? 'border-orange-500/50 bg-orange-500/10' :
              prediction?.risk_class === 'MODERATE' ? 'border-amber-500/50 bg-amber-500/10' :
              'border-slate-700/80 bg-slate-900/90'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Calibrated AI Probability
                </span>
                <RiskBadge risk={prediction?.risk_class} />
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-black font-mono text-white">
                  {prediction?.risk_probability != null
                    ? `${(prediction.risk_probability * 100).toFixed(1)}%` : 'N/A'}
                </div>
                <span className="text-xs text-cyan-300 font-mono font-bold uppercase tracking-wider">
                  {prediction?.risk_class || 'CALCULATED'}
                </span>
              </div>

              {/* TreeSHAP Feature Contributions Waterfall */}
              {Object.keys(shapValues).length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                      TreeSHAP Contributors
                    </span>
                    <span className="text-xs font-mono text-slate-400">Shift</span>
                  </div>

                  <div className="space-y-1.5">
                    {Object.entries(shapValues)
                      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                      .slice(0, 5)
                      .map(([feat, val]) => {
                        const numVal = Number(val) || 0;
                        const isTrigger = numVal >= 0;
                        return (
                          <div key={feat} className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-200 truncate max-w-[170px]">
                              {formatFeatureName(feat)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isTrigger ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {isTrigger ? `+${numVal.toFixed(3)}` : numVal.toFixed(3)}
                              </span>
                              <div className="w-12 h-1.5 rounded-full overflow-hidden bg-slate-800">
                                <div 
                                  className={`h-full rounded-full ${isTrigger ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(Math.abs(numVal) * 500, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terrain & Live Weather */}
          {(activeTab === 'all' || activeTab === 'terrain') && (
            <>
              <TerrainCard terrain={terrain} />
              <LiveWeatherCard lat={numLat} lon={numLon} />
              <HistoricalWeatherCard lat={numLat} lon={numLon} />
              <NearbyLandslideHistory lat={numLat} lon={numLon} />
            </>
          )}

          {/* Dispatched Alert Notice */}
          {riskData.alert_created && (
            <div className="border border-rose-500/50 bg-rose-500/15 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-rose-200 uppercase tracking-wider font-mono">
                  Early Warning Dispatched
                </div>
                <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Disaster threshold reached. Alert transmitted to regional incident command.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatFeatureName(name) {
  return {
    rainfall_24h_mm: '24h Rainfall',
    rainfall_3d_mm: '3-Day Rainfall',
    rainfall_7d_mm: '7-Day Rainfall',
    soil_moisture: 'Soil Saturation',
    elevation_m: 'Elevation',
    slope_degree: 'Slope Angle',
    historical_landslide_density: 'Historical Density',
    historical_landslide_count: 'Past Events'
  }[name] || name;
}
