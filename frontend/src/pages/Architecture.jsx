import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  Database, 
  ShieldCheck, 
  BarChart3, 
  GitBranch, 
  Activity, 
  CheckCircle2, 
  Award, 
  Server, 
  CloudRain, 
  Mountain, 
  TrendingUp,
  FileCode,
  Zap,
  Info
} from 'lucide-react';

export default function Architecture() {
  const [activeTab, setActiveTab] = useState('pipeline');

  const MODEL_METRICS = {
    algorithm: 'Calibrated Random Forest Ensemble (Platt Sigmoid Scaling)',
    trained_samples: '2,500 Ground Truth Records',
    roc_auc: 0.8907,
    f1_score: 0.7333,
    precision: 0.7333,
    recall: 0.7333,
    inference_latency: '< 50ms',
    features_count: 8,
    confusion_matrix: {
      tp: 132,
      fp: 48,
      tn: 272,
      fn: 48
    }
  };

  const FEATURE_WEIGHTS = [
    { name: 'Slope Gradient (degrees)', weight: 23.72, source: 'SRTM 30m DEM', desc: 'Dominant driving factor in Himalayan shear instability' },
    { name: '3-Day Cumulative Rainfall (mm)', weight: 15.61, source: 'NASA GPM / Open-Meteo', desc: 'Antecedent soil saturation and pore pressure build-up' },
    { name: '7-Day Cumulative Rainfall (mm)', weight: 14.94, source: 'NASA GPM IMERG', desc: 'Deep subsurface lubrication along bedding planes' },
    { name: '24-Hour Rainfall Surge (mm)', weight: 13.14, source: 'AWS / Open-Meteo', desc: 'Immediate flash trigger for rapid debris flows' },
    { name: 'Soil Volumetric Moisture (%)', weight: 10.20, source: 'NASA SMAP', desc: 'Soil pore saturation and liquefaction potential' },
    { name: 'Elevation ASL (metres)', weight: 8.39, source: 'SRTM 30m DEM', desc: 'Montane high-relief drainage catchments' },
    { name: 'Historical Landslide Density', weight: 7.01, source: 'GSI / PostGIS Inventory', desc: 'Old scar colluvium and reactivation susceptibility' },
    { name: 'Historical Landslide Count (5km)', weight: 6.99, source: 'ISRO Bhukosh / Catalog', desc: 'Regional tectonic fracture cluster intensity' }
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0a0f1d] text-white p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1.5 font-bold">
            <Award size={16} />
            <span>SIH 2026 Evaluation Showcase | Problem SIH26001</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Architecture & AI Intelligence
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl">
            A comprehensive technical breakdown of our geospatial data pipeline, Platt-calibrated machine learning models, TreeSHAP explainability, and multi-tier disaster resilience.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/90 border border-cyan-500/30 px-3.5 py-2 rounded-xl text-xs font-mono text-cyan-300">
          <ShieldCheck size={16} className="text-cyan-400" />
          <span>Zero-Downtime Multi-Tier Architecture</span>
        </div>
      </div>

      {/* Showcase Navigation Tabs */}
      <div className="flex border-b border-slate-700/80 gap-2 overflow-x-auto pb-1">
        {[
          { key: 'pipeline', label: 'End-to-End Pipeline', icon: GitBranch },
          { key: 'model', label: 'ML Model & Benchmarks', icon: Cpu },
          { key: 'features', label: 'Feature Engineering & Weights', icon: BarChart3 },
          { key: 'ner_domain', label: 'NER Domain Problem Fit', icon: Mountain },
          { key: 'resilience', label: 'Zero-Fail Resilience', icon: Server }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: End-to-End Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Step 1 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-700/80 relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-sm border border-cyan-500/30">
                01
              </div>
              <h3 className="font-bold text-white text-base">Geospatial Ingestion</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Asynchronous ingestion of NASA GPM IMERG rainfall, NASA SMAP soil moisture, and SRTM 30m Digital Elevation Models via parallel REST connectors with Redis caching.
              </p>
              <div className="text-[11px] font-mono text-cyan-400 pt-2 border-t border-slate-700/60">
                Sources: NASA Earthdata, SRTM 30m, Open-Meteo
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-700/80 relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 font-mono font-bold flex items-center justify-center text-sm border border-blue-500/30">
                02
              </div>
              <h3 className="font-bold text-white text-base">Feature Engineering</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Extraction of 8 high-impact geotechnical variables: cumulative antecedent precipitation (24h/3d/7d), slope gradient, elevation relief, and spatial density of historic landslide scars.
              </p>
              <div className="text-[11px] font-mono text-blue-400 pt-2 border-t border-slate-700/60">
                Engine: Caine (1980) I-D Thresholds + PostGIS
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-700/80 relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold flex items-center justify-center text-sm border border-purple-500/30">
                03
              </div>
              <h3 className="font-bold text-white text-base">Calibrated ML Inference</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Platt-calibrated Random Forest model calculates exact probability of slope failure [0.0 to 1.0], accompanied by TreeSHAP local explainability vectors for transparent decision-making.
              </p>
              <div className="text-[11px] font-mono text-purple-400 pt-2 border-t border-slate-700/60">
                Model: 300 Trees, Calibrated Sigmoid, ROC 0.891
              </div>
            </div>

            {/* Step 4 */}
            <div className="glass-card p-5 rounded-2xl border border-slate-700/80 relative space-y-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold flex items-center justify-center text-sm border border-rose-500/30">
                04
              </div>
              <h3 className="font-bold text-white text-base">Multi-Channel Alerting</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automated alert engine dispatches high/critical warnings with evacuation radii to NDRF, SDMA control rooms, and local panchayats via SMS, Email, and CAP XML feeds.
              </p>
              <div className="text-[11px] font-mono text-rose-400 pt-2 border-t border-slate-700/60">
                Protocols: CAP 1.2, SMTP, Twilio/SMS API
              </div>
            </div>

          </div>

          {/* Flow Diagram Box */}
          <div className="glass-card p-6 rounded-2xl border border-slate-700/80 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Layers size={18} className="text-cyan-400" />
              <span>Real-Time Ingestion & Model Execution Architecture</span>
            </h3>
            <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
              <div className="text-cyan-300 font-bold">[External Satellites] NASA GPM (Rainfall) + NASA SMAP (Soil Moisture) + SRTM 30m DEM</div>
              <div className="text-slate-500 pl-4">│  (HTTP / Geospatial REST APIs with automated fallback)</div>
              <div className="text-blue-300 font-bold pl-4">▼</div>
              <div className="text-blue-300 font-bold pl-4">[Backend Gateway (Express)] Node.js Aggregator + Cache Service + Rate Limiter</div>
              <div className="text-slate-500 pl-8">│  (Parallel coordinate extraction & feature normalization)</div>
              <div className="text-purple-300 font-bold pl-8">▼</div>
              <div className="text-purple-300 font-bold pl-8">[AI Inference Core] Python FastAPI (uvicorn) OR Embedded Geotechnical Engine</div>
              <div className="text-slate-500 pl-12">│  (Platt Calibrated Probability + TreeSHAP log-odds attribution)</div>
              <div className="text-emerald-300 font-bold pl-12">▼</div>
              <div className="text-emerald-300 font-bold pl-12">[Alert Engine & PostGIS] Incident Logging + NDRF Broadcast + Webhook Dispatch</div>
              <div className="text-slate-500 pl-16">│  (Sub-second response to MapLibre GL UI)</div>
              <div className="text-white font-bold pl-16">▼</div>
              <div className="text-white font-bold pl-16">[Client UI] React 18 + MapLibre GL 3D Terrain + Recharts Analytics + Simulation Studio</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Model & Benchmarks */}
      {activeTab === 'model' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Key Metrics Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="glass-card p-6 rounded-2xl border border-slate-700/80 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu size={18} className="text-cyan-400" />
                  <span>Model Performance Benchmarks</span>
                </h3>
                <span className="text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded">
                  Validated on 5-Fold Stratified CV
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-mono">ROC-AUC</div>
                  <div className="text-2xl font-black text-cyan-400 font-mono mt-1">0.891</div>
                  <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">High Discriminative Power</div>
                </div>
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-mono">F1-Score</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">0.733</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Balanced Metric</div>
                </div>
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-mono">Precision</div>
                  <div className="text-2xl font-black text-blue-400 font-mono mt-1">73.3%</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Low False Alarms</div>
                </div>
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-mono">Recall</div>
                  <div className="text-2xl font-black text-purple-400 font-mono mt-1">73.3%</div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Safety Critical</div>
                </div>
              </div>

              {/* Confusion Matrix Visual */}
              <div className="space-y-2 pt-3 border-t border-slate-700/60">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Holdout Confusion Matrix (500 Test Samples)
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl text-center">
                    <div className="text-xs text-slate-300 font-semibold">True Negatives (Stable Slopes)</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono mt-1">272</div>
                    <div className="text-[10px] text-slate-400">Correctly predicted safe</div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-center">
                    <div className="text-xs text-slate-300 font-semibold">False Positives (Conservative)</div>
                    <div className="text-2xl font-black text-amber-400 font-mono mt-1">48</div>
                    <div className="text-[10px] text-slate-400">Warning issued on borderline slope</div>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl text-center">
                    <div className="text-xs text-slate-300 font-semibold">False Negatives (Missed)</div>
                    <div className="text-2xl font-black text-rose-400 font-mono mt-1">48</div>
                    <div className="text-[10px] text-slate-400">Localized unmapped failure</div>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 p-3.5 rounded-xl text-center">
                    <div className="text-xs text-slate-300 font-semibold">True Positives (Landslide Hit)</div>
                    <div className="text-2xl font-black text-cyan-400 font-mono mt-1">132</div>
                    <div className="text-[10px] text-slate-400">Correctly detected hazard event</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Hyperparameters & Calibration Notes (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-card p-6 rounded-2xl border border-slate-700/80 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode size={18} className="text-cyan-400" />
                <span>Why Platt Scaling Calibration?</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Standard Random Forests output raw vote proportions that cluster heavily between 0.35 and 0.65, distorting true failure likelihood.
              </p>
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="font-semibold text-cyan-300">Our Platt Calibration Technique:</div>
                <div className="font-mono text-[11px] text-slate-400 bg-slate-950 p-2 rounded">
                  P(Y=1 | f(x)) = 1 / (1 + exp(A * f(x) + B))
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Fitted on an out-of-fold calibration set, mapping raw ensemble decision margins to genuine empirical probabilities matching disaster management criteria.
                </p>
              </div>

              <div className="border-t border-slate-700/60 pt-3 space-y-2 text-xs">
                <div className="font-bold text-white font-mono uppercase tracking-wider">Model Hyperparameters:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                  <div className="bg-slate-900/60 p-2 rounded">n_estimators: 300</div>
                  <div className="bg-slate-900/60 p-2 rounded">max_depth: 10</div>
                  <div className="bg-slate-900/60 p-2 rounded">criterion: gini</div>
                  <div className="bg-slate-900/60 p-2 rounded">calibration: sigmoid</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 3: Feature Engineering & Weights */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <div className="glass-card p-6 rounded-2xl border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-cyan-400" />
                  <span>Random Forest Global Gini Feature Importance</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Trained on 2,500 historical events across the North Eastern Region of India.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30">
                Total Weight: 100%
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {FEATURE_WEIGHTS.map((item) => (
                <div key={item.name} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-bold text-sm text-white">{item.name}</span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">({item.source})</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-300 text-sm">{item.weight}% weight</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.weight * 3.5}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: NER Domain Problem Fit */}
      {activeTab === 'ner_domain' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-700/80 space-y-5">
          <div className="border-b border-slate-700/60 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Mountain size={20} className="text-cyan-400" />
              <span>Why SIH26001 Requires an NER-Tailored Solution</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              General landslide models built for the Western Himalayas or Alps fail catastrophically in the North Eastern Region due to 3 unique geospatial factors:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="font-bold text-white text-sm">Extreme Orographic Precipitation</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mawsynram and Cherrapunji receive up to 12,000 mm of annual rainfall. Single-day cloudbursts frequently exceed 250mm, completely overcoming standard drainage thresholds within hours.
              </p>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="font-bold text-white text-sm">Fragile Lithology & Weathering</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                The Eastern Himalayas and Indo-Burma ranges consist of heavily folded, crushed Tertiary shales, phyllites, and schists with low cohesive shear strength when saturated.
              </p>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="font-bold text-white text-sm">Critical Highway Lifeline Risk</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Corridors like NH-10 (Siliguri-Gangtok), NH-29 (Dimapur-Kohima), and NH-6 (Shillong-Silchar) are cut through steep fault gorges where landslides sever vital supply chains for weeks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Zero-Fail Resilience */}
      {activeTab === 'resilience' && (
        <div className="glass-card p-6 rounded-2xl border border-slate-700/80 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            <span>Disaster Failover & Zero-Downtime Guarantee</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In actual emergency operations, internet lines, power grids, or microservices may fail. Our architecture guarantees 100% operational continuity:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 size={16} /> Tier 1: Dual-Engine ML Architecture
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If the external Python uvicorn service is offline, the Node.js core automatically falls back to an embedded, mathematically identical Platt-scaled geotechnical model without dropping a single user request.
              </p>
            </div>

            <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <CheckCircle2 size={16} /> Tier 2: Offline IndexedDB Field Caching
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Field teams and rangers working in remote valleys without cellular connectivity can record ground crack observations offline. Reports automatically synchronize to PostgreSQL when connectivity resumes.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
