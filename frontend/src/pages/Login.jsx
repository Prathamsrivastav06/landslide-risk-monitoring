import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, User, Key, Activity, Radio, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('admin@landslide-sys.gov.in');
  const [password, setPassword] = useState('Admin@1234');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Clearance authorized — Welcome to Command Center');
      navigate('/');
    } catch (err) {
      toast.error('Invalid clearance credentials');
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4 shadow-[0_0_25px_rgba(0,240,255,0.2)]">
            <Shield className="text-cyan-400" size={32} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
              Secure Terminal Online
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase font-sans">
            Landslide <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">ICS</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-mono">
            Intelligence Command Center Authentication
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-panel p-7 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Top Cyan Strip */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={13} className="text-cyan-400" />
                Official ID / Operator Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="authority@landslide-sys.gov.in"
                className="w-full bg-[#0a101f]/80 border border-white/10 rounded-lg px-3.5 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono text-xs"
                required
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-mono font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Key size={13} className="text-cyan-400" />
                Security Clearance Key
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0a101f]/80 border border-white/10 rounded-lg px-3.5 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono text-xs"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>Validating Clearance...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Authenticate Session</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
          
          {/* Preset Roles Quick Fill */}
          <div className="mt-5 pt-4 border-t border-white/8 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="uppercase tracking-wider font-semibold">Demo Clearance Profiles</span>
              <span className="text-cyan-400/80">Click to autofill</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setDemoRole('admin@landslide-sys.gov.in', 'Admin@1234')}
                className="p-2 rounded bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-left transition-all text-slate-300 hover:text-cyan-300 cursor-pointer"
              >
                <div className="font-bold text-white">System Admin</div>
                <div className="text-slate-500 text-[9px]">Full Control</div>
              </button>

              <button
                type="button"
                onClick={() => setDemoRole('authority@landslide-sys.gov.in', 'Admin@1234')}
                className="p-2 rounded bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-left transition-all text-slate-300 hover:text-cyan-300 cursor-pointer"
              >
                <div className="font-bold text-white">Regional Officer</div>
                <div className="text-slate-500 text-[9px]">Alert Verification</div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="text-center mt-6 text-[10px] text-slate-500 font-mono tracking-wider flex items-center justify-center gap-2">
          <span>RESTRICTED GEOSPATIAL INTELLIGENCE ENVIRONMENT</span>
          <span>•</span>
          <span>SRTM / GPM INTEGRATED</span>
        </div>
      </div>
    </div>
  );
}
