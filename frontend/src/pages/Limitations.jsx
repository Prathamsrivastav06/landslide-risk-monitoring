import React from 'react';
import { 
  AlertOctagon, 
  Target, 
  GitBranch, 
  Satellite, 
  Layers, 
  Radio, 
  Plane, 
  FileCheck,
  ShieldAlert,
  Info
} from 'lucide-react';

const LIMITATIONS = [
  {
    title: 'Satellite Precipitation vs Ground Reality',
    tag: 'NASA POWER / MERRA-2',
    icon: Satellite,
    impact: 'Coarse Spatial Resolution (~50km)',
    desc: 'Satellite precipitation estimates are derived from reanalysis and radar grids. Rapid micro-climatic cloudbursts common in Himalayan terrain may be spatially averaged out before ground rainfall gauges register them.',
    mitigation: 'System incorporates multi-day antecedent rainfall (3-day and 7-day cumulative sums) and regional slope trigger equations to buffer against single-station discrepancies.'
  },
  {
    title: 'Soil Moisture Coarse Gridding',
    tag: 'NASA SMAP L3/L4',
    icon: Layers,
    impact: '36km Grid Averaging',
    desc: 'NASA SMAP provides regional topsoil volumetric moisture (0-5cm) at 36km resolution. This captures macro antecedent saturation but cannot measure local pore water pressure on an individual 30-degree slope face.',
    mitigation: 'Used strictly as a regional saturation weighting factor (10.2% feature importance) rather than a deterministic single-slope safety factor.'
  },
  {
    title: 'SRTM Static Topography (Mission 2000)',
    tag: 'SRTM 30m DEM',
    icon: Target,
    impact: 'Static Morphometry',
    desc: 'Shuttle Radar Topography Mission data reflects year 2000 terrain. Recent road cuts, highway widening (e.g. NH-10/NH-15), quarrying, or debris deposits from recent monsoons are not captured.',
    mitigation: 'Infused with live Crowdsourced & Field Officer Ground Truth reporting to flag active toe erosion, fresh tension cracks, and man-made cuts.'
  },
  {
    title: 'Historical Catalog Reporting Bias',
    tag: 'ISRO / GSI Atlas',
    icon: ShieldAlert,
    impact: 'Population-Centric Bias',
    desc: 'Historical inventories naturally reflect landslides near arterial roads, border posts, and settlements. Remote uninhabited ridge failures frequently go unrecorded in government catalogs.',
    mitigation: 'Model trains on physical infinite slope geotechnical mechanics in addition to catalog events, ensuring steep unpopulated terrain is still flagged as hazardous.'
  }
];

const ROADMAP_PHASES = [
  {
    phase: 'Phase 1',
    status: 'ACTIVE PROTOTYPE',
    statusColor: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    title: 'Geospatial AI & Satellite Early Warning Command Center',
    timeline: 'SIH 2026 Deliverable',
    desc: 'Full-stack PostGIS database, Calibrated Random Forest model (89% ROC-AUC), SHAP explainable AI, automated SRTM slope engine, and offline field PWA sync.'
  },
  {
    phase: 'Phase 2',
    status: 'PLANNED Q3 2026',
    statusColor: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
    title: 'Ground IoT Sensor Mesh & LoRaWAN Relays',
    timeline: 'Pilot Corridors (East Sikkim & West Kameng)',
    desc: 'Deployment of solar-powered MEMS tiltmeters, in-situ piezometers (pore pressure), and tipping-bucket rain gauges feeding sub-minute telemetry via LoRaWAN hill relays.'
  },
  {
    phase: 'Phase 3',
    status: 'RESEARCH STAGE',
    statusColor: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
    title: 'Sentinel-1 InSAR Millimeter Surface Deformation',
    timeline: '2027 Integration',
    desc: 'Persistent Scatterer Interferometry (PS-InSAR) processing to measure millimetric slope pre-failure creep along railway lines and national highway bypasses months before catastrophic collapse.'
  },
  {
    phase: 'Phase 4',
    status: 'FUTURE CAPABILITY',
    statusColor: 'bg-slate-700 border-slate-600 text-slate-400',
    title: 'Autonomous UAV / Drone Rapid Reconnaissance Tasking',
    timeline: '2027-2028 Horizon',
    desc: 'Automated alert trigger API that tasks autonomous surveying drones to generate high-resolution photogrammetry 3D point clouds of high-threat zones ahead of field patrols.'
  }
];

export default function Limitations() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0a0f1d] p-6 space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="pb-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-sm mb-1 uppercase tracking-widest font-semibold">
          <AlertOctagon size={16} />
          Engineering Transparency & Scientific Rigor
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          System Limitations & Roadmap
        </h1>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
          As required by Smart India Hackathon problem statement SIH26001, we provide full transparency regarding satellite sensor physics, latency windows, and spatial discretization limitations alongside engineered mitigations.
        </p>
      </div>

      {/* Limitations Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
          <Info size={16} className="text-cyan-400" />
          <span>Model & Sensor Limitations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {LIMITATIONS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3.5 hover:border-white/20 transition-all shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <span className="text-xs font-mono text-cyan-400 font-semibold">{item.tag}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 whitespace-nowrap">
                    {item.impact}
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed">
                  {item.desc}
                </p>

                <div className="pt-3 border-t border-white/10 text-xs text-slate-300 leading-relaxed">
                  <span className="text-emerald-400 font-bold font-mono">Engineered Mitigation: </span>
                  {item.mitigation}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roadmap Section */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
          <GitBranch size={16} className="text-cyan-400" />
          <span>Future Roadmap & Deployment Matrix</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ROADMAP_PHASES.map((r, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3 hover:border-cyan-500/40 transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-cyan-400">{r.phase}</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border ${r.statusColor}`}>
                  {r.status}
                </span>
              </div>

              <h4 className="text-base font-bold text-white">{r.title}</h4>
              <div className="text-xs font-mono text-cyan-300/80 font-semibold">{r.timeline}</div>

              <p className="text-sm text-slate-200 leading-relaxed pt-1">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
