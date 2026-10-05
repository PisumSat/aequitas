import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-[#050811] py-10 mt-20 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Purpose */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span>Aequitas</span>
                <span className="text-[10px] font-mono text-slate-500">v1.1.0</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Tamper-proof, reproducible public randomness for medical clerkships & rotas.
              </p>
            </div>
          </div>

          {/* User & Inspiration Attribution */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <span>Crafted by</span>
              <span className="text-teal-400 font-bold px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/25">
                Pisum
              </span>
            </div>
            <div className="text-slate-400 text-[11px] flex items-center gap-1">
              <span>Heavily inspired by</span>
              <span className="text-indigo-400 font-medium hover:underline cursor-default">
                keenthekeen
              </span>
            </div>
          </div>
        </div>

        {/* Bottom divider and crypto disclaimer */}
        <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Entropy Source: NIST Randomness Beacon 2.0 (Quantum-Photonic Generator)</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://csrc.nist.gov/Projects/interoperable-randomness-beacons/beacon-20"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-teal-400 transition-colors"
            >
              NIST Beacon Documentation
            </a>
            <span>•</span>
            <span className="text-slate-500 font-mono">100% Client-Side Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
