import React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center p-6 text-white select-none">
          <div className="glass-panel p-8 rounded-2xl border border-rose-500/40 max-w-lg w-full text-center space-y-4 shadow-[0_0_50px_rgba(244,63,94,0.15)]">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
              <AlertOctagon size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-white tracking-tight">
              Interface Restored
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              A temporary telemetry or render issue was intercepted safely. The system has prevented an application crash.
            </p>

            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-rose-300 font-mono text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reload Command Center</span>
              </button>

              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <Home size={14} />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
