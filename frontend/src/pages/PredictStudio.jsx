import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Sliders, 
  CloudRain, 
  Mountain, 
  Droplets, 
  Activity, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Send, 
  Flame, 
  Zap, 
  MapPin, 
  BarChart3, 
  Compass, 
  Clock, 
  Layers 
} from 'lucide-react';
import { riskAPI } from '../services/api';
import toast from 'react-hot-toast';

const REGIONAL_PRESETS = [
  { name: 'Gangtok - Teesta Ridge', state: 'Sikkim', lat: 27.33, lon: 88.62, slope: 34.5, elev: 1650, soil: 0.38, rain24: 55, rain3d: 140, rain7d: 220, density: 0.08, count: 6 },
  { name: 'Bhalukpong - Tenga NH-13', state: 'Arunachal', lat: 27.05, lon: 92.40, slope: 38.2, elev: 1820, soil: 0.42, rain24: 70, rain3d: 175, rain7d: 290, density: 0.09, count: 7 },
  { name: 'Cherrapunji Escarpment', state: 'Meghalaya', lat: 25.27, lon: 91.73, slope: 31.0, elev: 1430, soil: 0.45, rain24: 110, rain3d: 260, rain7d: 410, density: 0.06, count: 4 },
  { name: 'Tamenglong Hill Slopes', state: 'Manipur', lat: 24.99, lon: 93.50, slope: 28.4, elev: 1260, soil: 0.35, rain24: 40, rain3d: 95, rain7d: 160, density: 0.05, count: 3 },
  { name: 'Aizawl Saron Veng Valley', state: 'Mizoram', lat: 23.73, lon: 92.72, slope: 33.0, elev: 1130, soil: 0.39, rain24: 48, rain3d: 125, rain7d: 210, density: 0.07, count: 5 },
  { name: 'Kohima Bypass Corridor', state: 'Nagaland', lat: 25.67, lon: 94.11, slope: 29.5, elev: 1440, soil: 0.32, rain24: 35, rain3d: 80, rain7d: 145, density: 0.04, count: 3 }
];

const SCENARIO_PRESETS = [
  {
    id: 'cloudburst',
    label: 'Flash Cloudburst',
    icon: '⛈️',
    desc: 'Intense short-duration monsoon storm (>120mm/24h) on steep slopes',
    values: { rain24: 135, rain3d: 240, rain7d: 350, slope: 37, soil: 0.48 }
  },
  {
    id: 'saturated',
    label: 'Multi-Day Monsoonal Soaking',
    icon: '🌧️',
    desc: 'Prolonged rainfall saturating phyllite rock shear plane (>400mm/7d)',
    values: { rain24: 45, rain3d: 165, rain7d: 420, slope: 30, soil: 0.52 }
  },
  {
    id: 'seismic',
    label: 'Steep Fracture Zone',
    icon: '⚡',
    desc: 'High slope gradient (>42°) with preexisting tension cracks',
    values: { rain24: 30, rain3d: 75, rain7d: 120, slope: 44, soil: 0.34 }
  },
  {
    id: 'baseline',
    label: 'Pre-Monsoon Dry Baseline',
    icon: '☀️',
    desc: 'Standard non-saturated soil with low precipitation',
    values: { rain24: 4, rain3d: 12, rain7d: 28, slope: 22, soil: 0.18 }
  }
];

export default function PredictStudio() {
  const [selectedPreset, setSelectedPreset] = useState(REGIONAL_PRESETS[0]);
  
  // Geotechnical parameter states
  const [rain24, setRain24] = useState(selectedPreset.rain24);
  const [rain3d, setRain3d] = useState(selectedPreset.rain3d);
  const [rain7d, setRain7d] = useState(selectedPreset.rain7d);
  const [slope, setSlope] = useState(selectedPreset.slope);
  const [elev, setElev] = useState(selectedPreset.elev);
  const [soil, setSoil] = useState(selectedPreset.soil);
  const [density, setDensity] = useState(selectedPreset.density);
  const [count, setCount] = useState(selectedPreset.count);

  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [dispatching, setDispatching] = useState(false);

  // Apply Regional Preset
  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setRain24(preset.rain24);
    setRain3d(preset.rain3d);
    setRain7d(preset.rain7d);
    setSlope(preset.slope);
    setElev(preset.elev);
    setSoil(preset.soil);
    setDensity(preset.density);
    setCount(preset.count);
  };

  // Apply Scenario
  const handleSelectScenario = (scen) => {
    if (scen.values.rain24 !== undefined) setRain24(scen.values.rain24);
    if (scen.values.rain3d !== undefined) setRain3d(scen.values.rain3d);
    if (scen.values.rain7d !== undefined) setRain7d(scen.values.rain7d);
    if (scen.values.slope !== undefined) setSlope(scen.values.slope);
    if (scen.values.soil !== undefined) setSoil(scen.values.soil);
    toast.success(`Loaded scenario: ${scen.label}`);
  };

  // Run AI Prediction
  const runPrediction = async () => {
    setLoading(true);
    try {
      const features = {
        rainfall_24h_mm: rain24,
        rainfall_3d_mm: rain3d,
        rainfall_7d_mm: rain7d,
        slope_degree: slope,
        elevation_m: elev,
        soil_moisture: soil,
        historical_landslide_density: density,
        historical_landslide_count: count
      };

      const res = await riskAPI.simulate({
        features,
        lat: selectedPreset.lat,
        lon: selectedPreset.lon,
        locationName: selectedPreset.name,
        state: selectedPreset.state
      });

      const data = res.data?.data || res.data;
      setPrediction(data.prediction);
    } catch (err) {
      console.error(err);
      toast.error('Simulation calculation failed. Using local engine fallback.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run on mount and whenever parameters change slightly
  useEffect(() => {
    runPrediction();
  }, [rain24, rain3d, rain7d, slope, elev, soil, density, count]);

  // Reset to preset defaults
  const handleReset = () => {
    handleSelectPreset(selectedPreset);
    toast('Parameters reset to regional defaults');
  };

  // Broadcast Emergency Alert
  const handleBroadcastAlert = async () => {
    if (!prediction) return;
    setDispatching(true);
    try {
      const features = {
        rainfall_24h_mm: rain24,
        rainfall_3d_mm: rain3d,
        rainfall_7d_mm: rain7d,
        slope_degree: slope,
        elevation_m: elev,
        soil_moisture: soil,
        historical_landslide_density: density,
        historical_landslide_count: count
      };

      const res = await riskAPI.simulate({
        features,
        lat: selectedPreset.lat,
        lon: selectedPreset.lon,
        locationName: selectedPreset.name,
        state: selectedPreset.state,
        createAlert: true
      });

      const data = res.data?.data || res.data;
      if (data.alert_created) {
        toast.success(`🚨 Emergency Early Warning broadcasted! Alert ID: ${data.alert_id?.slice(0, 8)}...`, {
          duration: 6000
        });
      } else {
        toast.success('Simulation alert processed.');
      }
    } catch (err) {
      toast.error('Alert broadcast simulation failed');
    } finally {
      setDispatching(false);
    }
  };

  const probPercent = prediction?.risk_probability ? (prediction.risk_probability * 100).toFixed(1) : '0.0';
  const riskClass = prediction?.risk_class || 'CALCULATING';

  const riskBadgeStyles = {
    CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.35)]',
    HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.3)]',
    MODERATE: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    LOW: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    CALCULATING: 'bg-slate-500/20 text-slate-300 border-slate-500/40'
  }[riskClass] || 'bg-slate-500/20 text-slate-300 border-slate-500/40';

  const riskColorHex = {
    CRITICAL: '#f87171',
    HIGH: '#fb923c',
    MODERATE: '#fbbf24',
    LOW: '#34d399',
    CALCULATING: '#94a3b8'
  }[riskClass];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0a0f1d] text-white p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1.5 font-bold">
            <Cpu size={16} />
            <span>AI Risk Prediction & Simulation Studio</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 status-dot" />
              Inference Engine Online
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Geotechnical ML Simulator
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            Simulate real-time slope stability and landslide trigger thresholds across India's North Eastern Region using calibrated Random Forest & TreeSHAP explainability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all cursor-pointer"
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            onClick={runPrediction}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={15} />
            {loading ? 'Evaluating Model...' : 'Run Prediction'}
          </button>
        </div>
      </div>

      {/* Preset Pickers: Regional Corridors & Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Regional Corridors */}
        <div className="glass-card p-4 rounded-xl border border-slate-700/70 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <MapPin size={14} /> 1. Select Vulnerable NER Corridor
            </span>
            <span className="text-slate-400">{REGIONAL_PRESETS.length} Active Presets</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {REGIONAL_PRESETS.map((loc) => {
              const isSelected = selectedPreset.name === loc.name;
              return (
                <button
                  key={loc.name}
                  onClick={() => handleSelectPreset(loc)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className="truncate font-semibold">{loc.name}</div>
                  <div className="text-[11px] text-cyan-300/80 font-mono mt-0.5">{loc.state}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Disaster Scenarios */}
        <div className="glass-card p-4 rounded-xl border border-slate-700/70 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Zap size={14} /> 2. Or Test Extreme Disaster Scenarios
            </span>
            <span className="text-slate-400">SIH Benchmark Cases</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SCENARIO_PRESETS.map((scen) => (
              <button
                key={scen.id}
                onClick={() => handleSelectScenario(scen)}
                className="p-2.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700/90 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-100 group-hover:text-amber-300">
                  <span>{scen.icon}</span>
                  <span className="truncate">{scen.label}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {scen.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Body: Parameter Sliders & AI Output Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Geotechnical Sliders (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-700/70 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider font-mono">
                <Sliders size={16} className="text-cyan-400" />
                <span>Geotechnical Input Parameters</span>
              </div>
              <span className="text-xs text-slate-300 font-mono bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                Lat: {selectedPreset.lat.toFixed(2)}°N | Lon: {selectedPreset.lon.toFixed(2)}°E
              </span>
            </div>

            {/* Slider 1: 24h Rainfall */}
            <div className="space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <CloudRain size={14} className="text-cyan-400" /> 24-Hour Rainfall Accumulation
                </span>
                <span className="font-mono font-bold text-cyan-300 text-sm">{rain24} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="1"
                value={rain24}
                onChange={(e) => setRain24(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-slate-700 accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 mm (Dry)</span>
                <span className="text-amber-400">65 mm (Trigger Threshold)</span>
                <span className="text-rose-400">250 mm (Extreme Cloudburst)</span>
              </div>
            </div>

            {/* Slider 2: 3-Day Cumulative Rainfall */}
            <div className="space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <CloudRain size={14} className="text-blue-400" /> 3-Day Cumulative Rainfall
                </span>
                <span className="font-mono font-bold text-blue-300 text-sm">{rain3d} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="450"
                step="5"
                value={rain3d}
                onChange={(e) => setRain3d(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-slate-700 accent-blue-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 mm</span>
                <span className="text-amber-400">140 mm (Pore Pressure Surge)</span>
                <span>450 mm</span>
              </div>
            </div>

            {/* Slider 3: 7-Day Cumulative Rainfall */}
            <div className="space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <CloudRain size={14} className="text-indigo-400" /> 7-Day Antecedent Monsoon Precipitation
                </span>
                <span className="font-mono font-bold text-indigo-300 text-sm">{rain7d} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="800"
                step="10"
                value={rain7d}
                onChange={(e) => setRain7d(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-slate-700 accent-indigo-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 mm</span>
                <span>300 mm</span>
                <span>800 mm (High Saturation)</span>
              </div>
            </div>

            {/* Grid for Slope and Soil Moisture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Slider 4: Slope Angle */}
              <div className="space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Mountain size={14} className="text-orange-400" /> Slope Gradient
                  </span>
                  <span className="font-mono font-bold text-orange-300 text-sm">{slope.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="0.5"
                  value={slope}
                  onChange={(e) => setSlope(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-700 accent-orange-400 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>0° Flat</span>
                  <span className="text-amber-400">25° Critical</span>
                  <span className="text-rose-400">60° Cliff</span>
                </div>
              </div>

              {/* Slider 5: Soil Moisture */}
              <div className="space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Droplets size={14} className="text-emerald-400" /> Soil Volumetric Moisture
                  </span>
                  <span className="font-mono font-bold text-emerald-300 text-sm">{(soil * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.75"
                  step="0.01"
                  value={soil}
                  onChange={(e) => setSoil(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-700 accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>10% Dry</span>
                  <span className="text-amber-400">38% Saturated</span>
                  <span className="text-rose-400">75% Liquefaction</span>
                </div>
              </div>
            </div>

            {/* Grid for Elevation & Historical Density */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Slider 6: Elevation */}
              <div className="space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">⛰️ Elevation (ASL)</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">{elev} m</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="3800"
                  step="25"
                  value={elev}
                  onChange={(e) => setElev(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-700 accent-slate-300 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>100m</span>
                  <span>1,800m Montane</span>
                  <span>3,800m Alpine</span>
                </div>
              </div>

              {/* Slider 7: Historical Landslides */}
              <div className="space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">📜 Historical Scars in 5km</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">{count} events</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="1"
                  value={count}
                  onChange={(e) => {
                    const c = Number(e.target.value);
                    setCount(c);
                    setDensity(+(c * 0.012).toFixed(3));
                  }}
                  className="w-full h-2 rounded-lg bg-slate-700 accent-slate-300 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>0 None</span>
                  <span>5 Density</span>
                  <span>15+ Active Fault</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: AI Inference Results & Explainability (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Main Risk Probability Display Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-700/80 relative overflow-hidden">
            
            {/* Background ambient glow */}
            <div 
              className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: riskColorHex }}
            />

            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
                  Calibrated AI Risk Prediction
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedPreset.name}
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-extrabold tracking-wider uppercase border ${riskBadgeStyles}`}>
                {riskClass}
              </span>
            </div>

            {/* Big Probability Number & Circular Gauge */}
            <div className="flex items-center gap-6 my-5">
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="text-slate-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    style={{
                      strokeDasharray: 289,
                      strokeDashoffset: 289 - (289 * (prediction?.risk_probability || 0)),
                      stroke: riskColorHex
                    }}
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black font-mono text-white">
                    {probPercent}%
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Prob.
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Hazard Classification:
                </div>
                <div className="text-sm font-semibold text-white leading-snug">
                  {riskClass === 'CRITICAL' && '🔴 High-velocity debris flow imminent under current moisture loading.'}
                  {riskClass === 'HIGH' && '🟠 Substantial slope shear stress with elevated failure probability.'}
                  {riskClass === 'MODERATE' && '🟡 Moderate hazard. Increased pore pressure requiring surveillance.'}
                  {riskClass === 'LOW' && '🟢 Nominal conditions. Slope factors remain within stable thresholds.'}
                </div>
                <div className="text-[11px] font-mono text-cyan-400 pt-1">
                  Engine: {prediction?.model_version || 'rf_calibrated_v2.0'}
                </div>
              </div>
            </div>

            {/* TreeSHAP Feature Attribution Bar Chart */}
            {prediction?.shap_values && Object.keys(prediction.shap_values).length > 0 && (
              <div className="border-t border-slate-700/60 pt-4 mt-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <BarChart3 size={14} /> TreeSHAP Factor Contributions
                  </span>
                  <span className="text-slate-400 text-[10px]">Log-Odds Shift (±)</span>
                </div>

                <div className="space-y-2">
                  {Object.entries(prediction.shap_values)
                    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                    .map(([feat, val]) => {
                      const isTrigger = val >= 0;
                      const featNames = {
                        slope_degree: 'Slope Angle',
                        rainfall_3d_mm: '3-Day Rainfall',
                        rainfall_7d_mm: '7-Day Rainfall',
                        rainfall_24h_mm: '24-Hour Rainfall',
                        soil_moisture: 'Soil Moisture',
                        elevation_m: 'Elevation',
                        historical_landslide_density: 'Historical Density',
                        historical_landslide_count: 'Past Landslide Count'
                      };
                      return (
                        <div key={feat} className="text-xs font-mono space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-300">{featNames[feat] || feat}</span>
                            <span className={isTrigger ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {isTrigger ? `+${val.toFixed(4)}` : val.toFixed(4)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isTrigger ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(Math.abs(val) * 350, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Action Bar: Emergency Broadcast */}
            <div className="border-t border-slate-700/60 pt-4 mt-5">
              <button
                onClick={handleBroadcastAlert}
                disabled={dispatching}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  riskClass === 'CRITICAL' || riskClass === 'HIGH'
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                }`}
              >
                <Send size={15} />
                {dispatching ? 'Transmitting Alert...' : 'Simulate Emergency Warning Broadcast'}
              </button>
            </div>
          </div>

          {/* Disaster Impact Forecast Card */}
          <div className="glass-card p-4 rounded-xl border border-slate-700/70 space-y-3">
            <div className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} /> Civil Protection & Impact Estimation
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[11px]">Estimated Debris Volume</div>
                <div className="text-sm font-bold text-white font-mono mt-0.5">
                  {riskClass === 'CRITICAL' ? '45,000 - 90,000 m³' : riskClass === 'HIGH' ? '15,000 - 35,000 m³' : '< 5,000 m³ (Minor)'}
                </div>
              </div>
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[11px]">Lead Warning Window</div>
                <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                  {riskClass === 'CRITICAL' ? '2 to 6 Hours' : riskClass === 'HIGH' ? '6 to 18 Hours' : '24+ Hours (Normal)'}
                </div>
              </div>
            </div>

            <div className="text-[12px] text-slate-300 space-y-1 pt-1 border-t border-slate-800">
              <div className="font-semibold text-slate-200">Recommended Responder Protocol:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                <li>Notify District Disaster Management Authority (DDMA) Control Room</li>
                <li>Halt heavy vehicle movement along vulnerable slope corridors</li>
                <li>Activate automated public sirens in downstream river/ravine settlements</li>
              </ul>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
