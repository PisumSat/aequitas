import React from 'react';
import { ShieldCheck, X, ExternalLink } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1122] border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs text-slate-300">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">How Aequitas Works</h2>
              <p className="text-xs text-slate-400">
                Zero-trust public randomness for medical education & clinical teams.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: The Problem */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>🩺 The Medical Student Dilemma</span>
            </h3>
            <p className="leading-relaxed text-slate-300 text-xs">
              In clinical rotations, allocating difficult duties (like weekend night shifts or intensive care on-call) typically relies on one student using a randomizer app or drawing lots. Even with honest intentions, this requires blind peer trust and opens the door to accusations of cherry-picking or rerunning until a favorable schedule emerges.
            </p>
          </div>

          {/* Section 2: The Solution */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>🏛️ NIST Randomness Beacon 2.0</span>
            </h3>
            <p className="leading-relaxed text-slate-300 text-xs">
              The U.S. National Institute of Standards and Technology operates the <strong>Randomness Beacon 2.0</strong>, a public service generating a 512-bit random pulse every 60 seconds. Each pulse is derived from quantum-photonic entropy sources, digitally signed, and chained into an unalterable cryptographic ledger.
            </p>
            <a
              href="https://csrc.nist.gov/Projects/interoperable-randomness-beacons/beacon-20"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-teal-400 hover:underline pt-1 font-mono text-xs font-semibold"
            >
              Read NIST CSRC Beacon 2.0 Specification
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Section 3: The 3-Step Protocol */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm">The 3-Step Protocol</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-400 font-mono font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <div className="font-bold text-white text-xs">Pre-Commitment</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The schedule parameters are configured and locked in a URL hash with a future pulse time (e.g. +15 mins).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <div className="font-bold text-white text-xs">Public Sharing</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The URL is sent to the group chat. Everyone sees the exact same countdown and parameter fingerprint.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <div className="font-bold text-white text-xs">Public Reveal</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  At the target minute, the NIST Beacon pulse is fetched and combined with the parameters to render the final rota.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-medium transition-colors text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
