import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Layers, 
  MapPin, 
  Flame, 
  FileText, 
  ShieldAlert, 
  Compass, 
  ChevronLeft,
  ChevronRight,
  Eye,
  Crosshair,
  Sliders,
  Activity,
  Radio
} from 'lucide-react';
import MapView from '../components/map/MapView';
import LocationRiskPanel from '../components/panels/LocationRiskPanel';
import AlertPanel from '../components/panels/AlertPanel';
import DataSourceHealth from '../components/panels/DataSourceHealth';
import SystemStatus from '../components/panels/SystemStatus';
import StatsBar from '../components/panels/StatsBar';
import { riskAPI, alertsAPI, landslidesAPI, dataSourcesAPI, aiAnalysisAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('layers'); // 'layers' | 'feed'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [activeLayers, setActiveLayers] = useState({
    historicalLandslides: true,
    riskHeatmap: false,
    fieldReports: true,
    criticalZones: true
  });
  
  // Queries with robust response unwrapping
  const { data: rawAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsAPI.getAll({ limit: 20 })
      .then(r => r.data?.data || r.data)
      .catch(err => {
        if (err.response?.status === 401) return [];
        return [];
      }),
    refetchInterval: 30000,
    retry: false
  });
  const alertsList = useMemo(() => {
    if (Array.isArray(rawAlerts)) return rawAlerts;
    return rawAlerts?.alerts || rawAlerts?.data || [];
  }, [rawAlerts]);
  
  const { data: rawLandslides } = useQuery({
    queryKey: ['landslides-ner'],
    queryFn: () => landslidesAPI.bbox('88,20,98,30').then(r => r.data?.data || r.data),
    staleTime: 5 * 60 * 1000
  });
  const landslidesList = useMemo(() => {
    if (Array.isArray(rawLandslides)) return rawLandslides;
    return rawLandslides?.landslides || [];
  }, [rawLandslides]);
  const landslideTotal = useMemo(() => {
    return rawLandslides?.total || landslidesList.length || 50;
  }, [rawLandslides, landslidesList]);
  
  const { data: rawHealth } = useQuery({
    queryKey: ['data-sources-health'],
    queryFn: () => dataSourcesAPI.health().then(r => r.data?.data || r.data),
    refetchInterval: 30000
  });
  const healthData = useMemo(() => {
    return rawHealth?.system ? rawHealth : (rawHealth?.data || rawHealth);
  }, [rawHealth]);
  
  const handleMapClick = useCallback(async (lat, lon, label) => {
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      toast.error('Invalid coordinates selected');
      return;
    }

    const locLabel = label || `${parsedLat.toFixed(3)}°N, ${parsedLon.toFixed(3)}°E`;
    setSelectedLocation({ lat: parsedLat, lon: parsedLon, label: locLabel });
    setRiskData(null);
    setRiskLoading(true);
    setAiAnalysis(null);
    setAiLoading(true);

    try {
      const res = await riskAPI.analyze(parsedLat, parsedLon);
      const payload = res.data?.data || res.data;
      setRiskData(payload);

      if (payload?.prediction?.risk_class === 'CRITICAL') {
        toast.error(`CRITICAL risk at ${parsedLat.toFixed(3)}°N, ${parsedLon.toFixed(3)}°E`, { duration: 5000 });
      } else if (payload?.prediction?.risk_class === 'HIGH') {
        toast(`HIGH risk at ${parsedLat.toFixed(3)}°N, ${parsedLon.toFixed(3)}°E`, { icon: '⚠️', duration: 4000 });
      }
    } catch (err) {
      console.error('Risk analysis error:', err);
      setRiskData({
        available: false,
        reason: err.response?.data?.message || 'Geotechnical telemetry unavailable for these coordinates.'
      });
    } finally {
      setRiskLoading(false);
    }

    // Groq AI Deep Analysis
    aiAnalysisAPI.analyze(parsedLat, parsedLon, locLabel)
      .then(r => setAiAnalysis(r.data?.data || r.data))
      .catch(err => {
        console.warn('AI analysis fallback:', err);
        setAiAnalysis({ available: false, summary: 'AI narrative synthesis unavailable.' });
      })
      .finally(() => setAiLoading(false));
  }, []);
  
  const DEMO_LOCATIONS = [
    { name: 'East Sikkim', state: 'Sikkim', lat: 27.33, lon: 88.62, tag: 'High Density', elev: '1586m', slope: '28.5°' },
    { name: 'West Kameng', state: 'Arunachal', lat: 27.05, lon: 92.40, tag: 'NH-13 Corridor', elev: '1850m', slope: '31.2°' },
    { name: 'Tamenglong', state: 'Manipur', lat: 24.99, lon: 93.50, tag: 'High Rainfall', elev: '1240m', slope: '26.8°' },
    { name: 'East Khasi Hills', state: 'Meghalaya', lat: 25.50, lon: 91.88, tag: 'Cherrapunji Zone', elev: '1420m', slope: '24.1°' },
    { name: 'Lunglei Ridge', state: 'Mizoram', lat: 22.89, lon: 92.73, tag: 'Southern Ridge', elev: '1180m', slope: '27.4°' },
    { name: 'Kohima Bypass', state: 'Nagaland', lat: 25.67, lon: 94.11, tag: 'Fault Line', elev: '1440m', slope: '29.5°' },
    { name: 'Champhai Slopes', state: 'Mizoram', lat: 23.47, lon: 93.32, tag: 'Border Sector', elev: '1320m', slope: '28.0°' },
    { name: 'Dima Hasao', state: 'Assam', lat: 25.18, lon: 93.02, tag: 'Railway Cutting', elev: '950m', slope: '25.3°' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0a0f1d] overflow-hidden select-none">
      {/* Subheader status ribbon */}
      <header className="flex-shrink-0 border-b border-slate-700/80 px-4 py-2 flex items-center justify-between bg-[#111a2e]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isSidebarOpen ? 'Collapse Controls Panel' : 'Expand Controls Panel'}
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 status-dot" />
            <span className="text-sm font-extrabold text-white tracking-wider uppercase">
              Command Center
            </span>
          </div>
          <span className="text-slate-600 text-sm font-mono hidden sm:inline">|</span>
          <span className="text-xs font-semibold text-slate-300 hidden sm:flex items-center gap-1.5">
            <Compass size={14} className="text-cyan-400" />
            NER Geospatial Intelligence
          </span>
        </div>

        <div className="flex items-center gap-4">
          <SystemStatus healthData={healthData} />
          <div className="text-xs text-slate-400 font-mono hidden md:block">
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
          </div>
        </div>
      </header>
      
      {/* Telemetry Stats Bar */}
      <StatsBar alerts={alertsList} landslideCount={landslideTotal} />
      
      {/* Main Workspace: Left Controls + Center Map + Right Risk Panel */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Command Sidebar */}
        {isSidebarOpen ? (
          <aside className="w-72 sm:w-80 flex-shrink-0 border-r border-slate-700/80 flex flex-col overflow-hidden bg-[#111a2e]/98 backdrop-blur-md z-10">
            
            {/* Quick Corridor Selection (Dropdown + 4 Quick Chips) */}
            <div className="p-3 border-b border-slate-700/80 bg-[#0d1424]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <MapPin size={13} className="text-cyan-400" />
                  Corridor Quick-Jump
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                  8 HOTSPOTS
                </span>
              </div>

              {/* Corridor Dropdown */}
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const [lat, lon, ...nameParts] = val.split(':');
                  handleMapClick(parseFloat(lat), parseFloat(lon), nameParts.join(':'));
                }}
                defaultValue=""
                className="w-full bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-2 outline-none focus:border-cyan-400 font-medium cursor-pointer mb-2.5 transition-colors"
              >
                <option value="" disabled>Select corridor preset...</option>
                {DEMO_LOCATIONS.map(loc => (
                  <option key={loc.name} value={`${loc.lat}:${loc.lon}:${loc.name} (${loc.state})`}>
                    {loc.name}, {loc.state} · Slope {loc.slope}
                  </option>
                ))}
              </select>

              {/* 4 Quick 1-Click Hotspot Chips */}
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_LOCATIONS.slice(0, 4).map(loc => (
                  <button
                    key={loc.name}
                    onClick={() => handleMapClick(loc.lat, loc.lon, `${loc.name} (${loc.state})`)}
                    className="text-left p-2 rounded-lg bg-slate-900/80 hover:bg-cyan-500/15 border border-slate-700/70 hover:border-cyan-400/50 transition-all text-xs group cursor-pointer"
                  >
                    <div className="text-white font-semibold truncate group-hover:text-cyan-300 transition-colors">
                      {loc.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-0.5">
                      <span>{loc.state}</span>
                      <span className="text-amber-400 font-bold">{loc.slope}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Tabs for Clean Organization */}
            <div className="flex border-b border-slate-700/80 bg-[#0a0f1d]">
              <button
                onClick={() => setActiveTab('layers')}
                className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'layers'
                    ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers size={13} /> Geospatial Layers
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-2 text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'feed'
                    ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders size={13} /> Data Sync
              </button>
            </div>

            {/* Tab 1: Map Layers Toggle */}
            {activeTab === 'layers' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {[
                  { key: 'historicalLandslides', label: 'Historical Landslides', icon: Flame, count: `${landslideTotal} events`, color: 'text-orange-400' },
                  { key: 'riskHeatmap', label: 'AI Risk Heatmap', icon: Crosshair, count: 'Predictive', color: 'text-cyan-400' },
                  { key: 'fieldReports', label: 'Ground Truth Reports', icon: FileText, count: 'Live sync', color: 'text-emerald-400' },
                  { key: 'criticalZones', label: 'NER Regional Boundary', icon: ShieldAlert, count: '8 states', color: 'text-blue-400' },
                ].map(layer => {
                  const Icon = layer.icon;
                  const active = activeLayers[layer.key];

                  return (
                    <label 
                      key={layer.key} 
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        active 
                          ? 'bg-cyan-500/15 border-cyan-400/50 text-white' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={layer.color} />
                        <div>
                          <div className="text-xs font-semibold text-white">{layer.label}</div>
                          <div className="text-[10px] font-mono text-slate-400">{layer.count}</div>
                        </div>
                      </div>
                      
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => setActiveLayers(prev => ({ ...prev, [layer.key]: !prev[layer.key] }))}
                        className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Data Ingestion Feeds */}
            {activeTab === 'feed' && (
              <div className="flex-1 overflow-y-auto">
                <DataSourceHealth data={healthData} />
              </div>
            )}

            {/* Sidebar Footer telemetry */}
            <div className="p-2.5 border-t border-slate-700/80 bg-[#0a0f1d] text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>MAPLIBRE GL · 3D READY</span>
              <span className="text-cyan-300 font-bold">EPSG:4326</span>
            </div>
          </aside>
        ) : (
          /* Slim Collapsed Icon Rail */
          <aside className="w-12 flex-shrink-0 border-r border-slate-700/80 flex flex-col items-center py-3 bg-[#111a2e]/98 z-10 gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 hover:text-white transition-colors cursor-pointer"
              title="Expand Controls"
            >
              <ChevronRight size={16} />
            </button>
            <div className="w-6 h-px bg-slate-800 my-1" />
            <button
              onClick={() => { setIsSidebarOpen(true); setActiveTab('layers'); }}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Layers"
            >
              <Layers size={16} />
            </button>
            <button
              onClick={() => { setIsSidebarOpen(true); setActiveTab('feed'); }}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Data Feeds"
            >
              <Sliders size={16} />
            </button>
          </aside>
        )}
        
        {/* Map Center Canvas */}
        <div className="flex-1 relative">
          <MapView
            onMapClick={handleMapClick}
            selectedLocation={selectedLocation}
            landslides={landslidesList}
            riskPrediction={riskData?.prediction}
            activeLayers={activeLayers}
          />
          
          {/* Subtle floating hint banner */}
          {!selectedLocation && !riskLoading && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel px-3.5 py-1.5 text-xs text-slate-300 rounded-full border border-cyan-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.6)] pointer-events-none flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Click any terrain location or select a corridor preset to inspect</span>
            </div>
          )}
        </div>
        
        {/* Right Location Risk Dossier Panel */}
        {(selectedLocation || riskLoading) && (
          <LocationRiskPanel
            location={selectedLocation}
            riskData={riskData}
            loading={riskLoading}
            aiAnalysis={aiAnalysis}
            aiLoading={aiLoading}
            onClose={() => { 
              setSelectedLocation(null); 
              setRiskData(null); 
              setAiAnalysis(null); 
            }}
          />
        )}
      </div>
      
      {/* Bottom Emergency Incident Ticker */}
      <AlertPanel 
        alerts={alertsList} 
        onAlertClick={(lat, lon, label) => handleMapClick(lat, lon, label)}
      />
    </div>
  );
}
