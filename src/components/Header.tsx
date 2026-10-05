import React from 'react';
import { ShieldCheck, HelpCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { NistPulse } from '../types';

interface HeaderProps {
  latestPulse: NistPulse | null;
  onOpenHowItWorks: () => void;
  onReset: () => void;
  isViewingCommitment: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  latestPulse,
  onOpenHowItWorks,
  onReset,
  isViewingCommitment,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#070b16]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={onReset}
          className="flex items-center gap-3 cursor-pointer group"
          title="Return to home / create new allocation"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1px] shadow-lg shadow-teal-500/15 group-hover:shadow-teal-500/30 transition-all">
            <div className="w-full h-full bg-[#080d1a] rounded-[15px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white font-sans">
                Aequitas
              </span>
              <span className="text-[10px] uppercase font-mono font-semibold tracking-widest px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/25">
                Beacon 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Verifiable Public Randomness for Medical Allocations
            </p>
          </div>
        </div>

        {/* Live Beacon Status & Actions */}
        <div className="flex items-center gap-2.5">
          {/* NIST Beacon Status Pill */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono"
            title="Live pulse synchronization from NIST Randomness Beacon 2.0"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 hidden xs:inline">NIST:</span>
            <span className="text-emerald-400 font-semibold">
              {latestPulse ? `#${latestPulse.pulseIndex}` : 'Live'}
            </span>
            <a
              href="https://beacon.nist.gov/beacon/2.0/pulse/last"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 ml-0.5 hidden sm:inline"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* How It Works Button */}
          <button
            onClick={onOpenHowItWorks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">How it Works</span>
          </button>

          {/* New Allocation Button if in commitment view */}
          {isViewingCommitment && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-300 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/35 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Create New</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
