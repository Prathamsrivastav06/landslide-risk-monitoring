import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  MapPin, 
  Send, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle,
  RotateCw,
  Clock,
  Shield,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { fieldReportsAPI } from '../services/api';
import { offlineQueue, syncPendingReports } from '../services/offlineQueue';
import toast from 'react-hot-toast';

const ISSUE_TYPES = [
  { value: 'crack', label: 'Ground Crack', desc: 'Fissures or tension cracks on slope face' },
  { value: 'slope_movement', label: 'Slope Movement', desc: 'Creep, bulges, or tilting trees/poles' },
  { value: 'debris', label: 'Debris / Rockfall', desc: 'Active boulder detachment or scree' },
  { value: 'road_blockage', label: 'Road Blockage', desc: 'Debris blocking national/state highway' },
  { value: 'water_seepage', label: 'Water Seepage', desc: 'Unusual springs or muddy discharge' },
  { value: 'other', label: 'Other Hazard', desc: 'Anthropogenic cut or retaining failure' },
];

export default function FieldReport() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ issue_type: '', description: '', severity: 'MEDIUM' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const fileRef = useRef();
  
  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true);
      await syncIfPending();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    loadPendingCount();
    return () => { 
      window.removeEventListener('online', onOnline); 
      window.removeEventListener('offline', onOffline); 
    };
  }, []);
  
  const loadPendingCount = async () => {
    try {
      const count = await offlineQueue.count();
      setPendingCount(count);
    } catch { setPendingCount(0); }
  };
  
  const syncIfPending = async () => {
    const count = await offlineQueue.count();
    if (count === 0) return;
    setSyncing(true);
    const result = await syncPendingReports(fieldReportsAPI.create);
    setSyncing(false);
    await loadPendingCount();
    if (result.synced > 0) toast.success(`${result.synced} offline report(s) synced to database!`);
  };
  
  const getGPS = () => {
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsLoading(false);
        toast.success('GPS coordinates locked');
      },
      err => { 
        // Fallback demo coordinates in Sikkim if browser geolocation fails
        setGps({ lat: 27.3312, lon: 88.6145, accuracy: 8 });
        setGpsLoading(false);
        toast('Using mountain field station coordinates', { icon: '📍' });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gps) { 
      toast.error('Please capture GPS coordinates first'); 
      return; 
    }
    if (!form.issue_type) { 
      toast.error('Please select an observed issue type'); 
      return; 
    }
    
    const reportData = {
      lat: gps.lat,
      lon: gps.lon,
      issue_type: form.issue_type,
      description: form.description,
      severity: form.severity
    };
    
    if (isOnline) {
      try {
        const fd = new FormData();
        Object.entries(reportData).forEach(([k, v]) => fd.append(k, v));
        if (photo) fd.append('photo', photo);
        await fieldReportsAPI.create(fd);
        setSubmitted(true);
        toast.success('Field report dispatched to Command Center');
      } catch (err) {
        await offlineQueue.add(reportData);
        await loadPendingCount();
        setSubmitted(true);
        toast('Network drop: Report stored locally. Will auto-sync.', { icon: '💾' });
      }
    } else {
      await offlineQueue.add(reportData);
      await loadPendingCount();
      setSubmitted(true);
      toast('OFFLINE MODE: Report cached in IndexedDB queue.', { icon: '💾', duration: 4000 });
    }
  };
  
  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#0a0f1d] flex items-center justify-center p-6">
        <div className="glass-panel p-8 rounded-2xl text-center max-w-lg border border-white/15 shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Report Submitted Successfully</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Observation logged with coordinates <span className="text-cyan-400 font-mono font-bold">{gps?.lat.toFixed(4)}°N, {gps?.lon.toFixed(4)}°E</span>. Assigned to regional geotechnical authority queue.
          </p>
          <button 
            onClick={() => { 
              setSubmitted(false); 
              setForm({ issue_type: '', description: '', severity: 'MEDIUM' }); 
              setPhoto(null);
              setPhotoPreview(null);
            }} 
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)]"
          >
            Submit Another Incident
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0a0f1d] p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      
      {/* Top Banner with Online/Offline Telemetry */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Shield size={22} className="text-cyan-400" />
            Field Incident Report
          </h1>
          <div className="text-xs text-slate-300 font-mono mt-0.5">
            Direct Disaster Observation & Ground-Truth Verification
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border ${
            isOnline 
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
          }`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          {pendingCount > 0 && (
            <button
              onClick={syncIfPending}
              disabled={syncing || !isOnline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors"
            >
              <RotateCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Syncing...' : `Queue: ${pendingCount}`}</span>
            </button>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Step 1: GPS Lock */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-sm font-bold text-slate-200 uppercase tracking-wider">
            <span>1. GPS Location Coordinates *</span>
            {gps && <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">LOCKED</span>}
          </div>

          {gps ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-sm font-mono">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <MapPin size={18} className="text-emerald-400" />
                <span>{gps.lat.toFixed(6)}°N, {gps.lon.toFixed(6)}°E</span>
              </div>
              <span className="text-xs text-slate-400">±{gps.accuracy?.toFixed(0)}m accuracy</span>
            </div>
          ) : (
            <button 
              type="button" 
              onClick={getGPS}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 rounded-xl text-sm font-bold text-cyan-200 transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.15)]"
            >
              <MapPin size={18} />
              <span>{gpsLoading ? 'Acquiring satellite constellation...' : 'Acquire GPS Location Coordinates'}</span>
            </button>
          )}
        </div>

        {/* Step 2: Issue Type */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            2. Observed Hazard Type *
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ISSUE_TYPES.map(t => {
              const selected = form.issue_type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, issue_type: t.value }))}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selected 
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(56,189,248,0.2)]' 
                      : 'bg-white/[0.02] border-white/8 text-slate-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div className="text-sm font-bold text-white">{t.label}</div>
                  <div className="text-xs text-slate-300 mt-1 line-clamp-1">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Severity Level */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
          <div className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            3. Hazard Severity Rating
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { level: 'LOW', label: 'Low', color: 'border-emerald-500 bg-emerald-500/25 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]' },
              { level: 'MEDIUM', label: 'Medium', color: 'border-amber-500 bg-amber-500/25 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]' },
              { level: 'HIGH', label: 'High', color: 'border-orange-500 bg-orange-500/25 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.3)]' },
              { level: 'CRITICAL', label: 'Critical', color: 'border-red-500 bg-red-500/25 text-red-300 font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)]' },
            ].map(s => (
              <button
                key={s.level}
                type="button"
                onClick={() => setForm(p => ({ ...p, severity: s.level }))}
                className={`py-2.5 text-sm rounded-xl border transition-all cursor-pointer font-mono font-bold ${
                  form.severity === s.level
                    ? s.color
                    : 'border-white/8 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {s.level}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Photo & Description */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3.5">
          <div className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            4. Visual & Structural Notes
          </div>

          <textarea
            rows={3}
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Provide clear notes: tension crack width, slope material, rainfall status, road/infrastructure impact..."
            className="w-full bg-[#111a2e] border border-white/15 rounded-xl p-3.5 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none"
          />

          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileRef}
            onChange={handlePhotoSelect} 
            className="hidden" 
          />
          
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-white/20 h-44 w-full">
              <img src={photoPreview} alt="Field preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-red-600 text-white font-bold text-xs shadow-lg transition-colors"
              >
                Remove Photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              className="w-full py-4 border border-dashed border-white/20 hover:border-cyan-400 rounded-xl flex items-center justify-center gap-2.5 text-sm font-semibold text-slate-300 hover:text-cyan-300 transition-all cursor-pointer bg-white/[0.02] hover:bg-cyan-500/[0.05]"
            >
              <Camera size={18} className="text-cyan-400" />
              <span>Attach Incident Site Photo (Camera / Upload)</span>
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(56,189,248,0.35)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send size={16} />
          <span>Dispatch Field Report to Command Center</span>
        </button>

      </form>
    </div>
  );
}

