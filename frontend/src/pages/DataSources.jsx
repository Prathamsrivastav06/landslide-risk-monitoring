import React, { useMemo } from 'react';
import { 
  Database, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  Radio, 
  HardDrive, 
  Cpu, 
  ShieldCheck,
  Layers
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dataSourcesAPI } from '../services/api';
import toast from 'react-hot-toast';

const SOURCES_METADATA = [
  { 
    id: 'gpm', 
    matchKey: 'NASA_GPM',
    typeTag: 'rainfall',
    name: 'NASA GPM IMERG (POWER)', 
    category: 'Satellite Precipitation', 
    resolution: '0.5° (~55km) / MERRA-2', 
    updateFreq: 'Daily Cadence', 
    license: 'NASA Open Data (Public Domain)', 
    desc: 'Provides near real-time and reanalysis precipitation estimates (PRECTOTCORR) calibrated for regional meteorological triggers.', 
    url: 'https://power.larc.nasa.gov/' 
  },
  { 
    id: 'srtm', 
    matchKey: 'SRTM',
    typeTag: 'dem',
    name: 'SRTM Terrain & Elevation Model (30m)', 
    category: 'Terrain Topography & Slope', 
    resolution: '30m (1 arc-second)', 
    updateFreq: 'Static (Mission 2000)', 
    license: 'NASA / USGS Open Data', 
    desc: '30m spatial resolution elevation data. Slope and aspect computed dynamically via 5-point finite difference numerical differentiation.', 
    url: 'https://www2.jpl.nasa.gov/srtm/' 
  },
  { 
    id: 'smap', 
    matchKey: 'SMAP',
    typeTag: 'soil',
    name: 'NASA SMAP Soil Moisture', 
    category: 'Antecedent Soil Saturation', 
    resolution: '9km - 36km L3/L4', 
    updateFreq: 'Daily Revisit', 
    license: 'NASA Earthdata Open', 
    desc: 'Measures volumetric top-layer moisture (m³/m³) to evaluate slope saturation and pore water pressure build-up.', 
    url: 'https://smap.jpl.nasa.gov/' 
  },
  { 
    id: 'isro', 
    matchKey: 'ISRO',
    typeTag: 'historical_landslides',
    name: 'ISRO NRSC Bhuvan & GSI Inventory', 
    category: 'Historical Ground Truth', 
    resolution: 'Point Spatial Inventory', 
    updateFreq: 'Multi-decade Atlas', 
    license: 'Govt of India (Restricted Open)', 
    desc: 'Historical inventory of verified landslide events across Sikkim, Arunachal Pradesh, Manipur, Meghalaya, and Mizoram with PostGIS spatial triggers.', 
    url: 'https://bhuvan.nrsc.gov.in/' 
  }
];

export default function DataSources() {
  const { data: rawData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['data-sources-health'],
    queryFn: () => dataSourcesAPI.health().then(r => r.data?.data || r.data),
    refetchInterval: 60000
  });

  const health = useMemo(() => {
    if (!rawData) return null;
    return rawData.system ? rawData : (rawData.data || rawData);
  }, [rawData]);

  const sourcesList = health?.sources || [];
  const system = health?.system || {};

  const getSourceStatus = (matchKey, typeTag) => {
    const s = sourcesList.find(item => 
      item.name?.toUpperCase().includes(matchKey) || item.source_type === typeTag
    );
    if (s?.status) return s.status;
    if (health?.[typeTag]?.status) return health[typeTag].status;
    return 'CONNECTED';
  };

  const handleManualRefresh = async () => {
    await refetch();
    toast.success('Telemetry feeds refreshed');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0a0f1d] p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm mb-1 uppercase tracking-widest font-semibold">
            <Radio size={16} className="animate-pulse" />
            Sensor & Satellite Telemetry Matrix
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Data Sources Integration & Satellite Telemetry
          </h1>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200 text-sm font-bold font-mono transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.15)]"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          <span>{isFetching ? 'Pinging Feeds...' : 'Refresh Diagnostics'}</span>
        </button>
      </div>

      {/* Core Infrastructure Pipeline Status Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider font-semibold">Spatial Database</span>
            <div className="text-lg font-bold text-white mt-1">PostgreSQL / PostGIS</div>
            <div className="text-xs text-emerald-400 font-mono mt-1.5 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 status-dot" />
              STATUS: {system.database || 'CONNECTED'}
            </div>
          </div>
          <HardDrive size={34} className="text-emerald-400/60" />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider font-semibold">AI Inference Engine</span>
            <div className="text-lg font-bold text-white mt-1">Dual-Engine Geotechnical AI</div>
            <div className="text-xs text-cyan-300 font-mono mt-1.5 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 status-dot" />
              STATUS: {system.ml_service || 'ONLINE'} (Platt Calibrated)
            </div>
          </div>
          <Cpu size={34} className="text-cyan-400/60" />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider font-semibold">API Gateway</span>
            <div className="text-lg font-bold text-white mt-1">Express Node.js Cluster</div>
            <div className="text-xs text-emerald-400 font-mono mt-1.5 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 status-dot" />
              STATUS: {system.api_server || 'ONLINE'} (Port 3001)
            </div>
          </div>
          <Layers size={34} className="text-blue-400/60" />
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SOURCES_METADATA.map(source => {
          const status = getSourceStatus(source.matchKey, source.typeTag);
          const isConnected = status === 'CONNECTED' || status === 'ONLINE' || status === 'OK' || status === 'AVAILABLE';

          return (
            <div key={source.id} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-xl">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{source.name}</h3>
                    <span className="text-sm text-cyan-400 font-mono font-semibold">{source.category}</span>
                  </div>

                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase border ${
                    isConnected
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.25)]'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}>
                    {isConnected ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                    {status}
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed mb-5">
                  {source.desc}
                </p>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-4 py-3.5 border-t border-b border-white/10 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Spatial Resolution</span>
                    <span className="text-white font-bold">{source.resolution}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Update Cadence</span>
                    <span className="text-white font-bold">{source.updateFreq}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-xs font-semibold uppercase tracking-wider mb-0.5">Access License</span>
                    <span className="text-slate-300">{source.license}</span>
                  </div>
                </div>

                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 rounded-xl text-sm font-bold text-slate-200 hover:text-white transition-all shadow-sm"
                >
                  <ExternalLink size={15} />
                  <span>Inspect Provider Portal & Metadata</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
