import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Mountain, 
  BarChart3, 
  Radio, 
  Database, 
  ShieldAlert, 
  LogOut, 
  User, 
  HelpCircle,
  Activity,
  Cpu,
  Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  
  const navItemClass = ({ isActive }) => 
    `relative flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
      isActive 
        ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_15px_rgba(56,189,248,0.25)] font-bold' 
        : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
    }`;
    
  return (
    <nav className="h-16 border-b border-slate-700/80 bg-[#0a0f1d]/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
      {/* Brand & Mission Tag */}
      <div className="flex items-center gap-6">
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/25 to-blue-600/40 border border-cyan-400/50 flex items-center justify-center text-cyan-300 group-hover:border-cyan-300 group-hover:shadow-[0_0_18px_rgba(56,189,248,0.4)] transition-all">
            <Mountain size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider uppercase text-base bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
                Landslide ICS
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                NER-AI
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono tracking-wide">
              SIH 2026 · Problem SIH26001
            </div>
          </div>
        </NavLink>
        
        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 pl-4 border-l border-slate-700/80">
          <NavLink to="/" className={navItemClass}>
            <Mountain size={15} /> Dashboard
          </NavLink>
          <NavLink to="/predict" className={navItemClass}>
            <Cpu size={15} className="text-cyan-400" />
            <span>AI Predict</span>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/25 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-400/40">
              ML
            </span>
          </NavLink>
          <NavLink to="/alerts" className={navItemClass}>
            <ShieldAlert size={15} className="text-rose-400" /> Alerts
          </NavLink>
          <NavLink to="/analytics" className={navItemClass}>
            <BarChart3 size={15} className="text-blue-400" /> Analytics
          </NavLink>
          <NavLink to="/field" className={navItemClass}>
            <Radio size={15} className="text-emerald-400" /> Field Ops
          </NavLink>
          <NavLink to="/architecture" className={navItemClass}>
            <Award size={15} className="text-amber-400" />
            <span>Architecture</span>
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/40">
              Judges
            </span>
          </NavLink>
          <NavLink to="/data-sources" className={navItemClass}>
            <Database size={15} /> Data Feeds
          </NavLink>
          <NavLink to="/limitations" className={navItemClass}>
            <HelpCircle size={15} /> Limitations
          </NavLink>
        </div>
      </div>
      
      {/* Right User & Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-bold font-mono border border-cyan-500/40">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-white truncate max-w-[130px]">
                  {user.full_name || user.email}
                </div>
                <div className="text-[11px] font-mono text-cyan-300 font-bold tracking-wider">
                  {user.role}
                </div>
              </div>
            </div>
            <button 
              onClick={logout} 
              title="Sign out of command center"
              className="p-2 text-slate-300 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg border border-slate-700 hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <NavLink 
            to="/login" 
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/50 text-cyan-300 hover:text-white transition-all shadow-[0_0_12px_rgba(56,189,248,0.2)]"
          >
            <User size={14} /> Sign In
          </NavLink>
        )}
      </div>
    </nav>
  );
}
