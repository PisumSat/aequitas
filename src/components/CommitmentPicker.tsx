import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  CalendarClock,
  ChevronRight,
  RefreshCw,
  Clock,
  Zap,
} from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { snapToNistMinute, formatDualTime } from '../lib/nistBeacon';

interface CommitmentPickerProps {
  title: string;
  onTitleChange: (title: string) => void;
  creatorName: string;
  onCreatorNameChange: (name: string) => void;
  targetTimestampMs: number;
  onTargetTimestampChange: (ms: number) => void;
  onSubmitCommitment: () => void;
  isValid: boolean;
  validationError?: string;
}

export const CommitmentPicker: React.FC<CommitmentPickerProps> = ({
  title,
  onTitleChange,
  creatorName,
  onCreatorNameChange,
  targetTimestampMs,
  onTargetTimestampChange,
  onSubmitCommitment,
  isValid,
  validationError,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(15);
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());

  // Keep a 1-second ticker to track real-time drift
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update target time when preset changes
  const applyPreset = (minutes: number) => {
    setSelectedPreset(minutes);
    const futureDate = addMinutes(new Date(), minutes);
    const snapped = snapToNistMinute(futureDate.getTime());
    onTargetTimestampChange(snapped);
  };

  const handleCustomChange = (val: string) => {
    setCustomDateTime(val);
    setSelectedPreset('custom');
    if (val) {
      const parsed = new Date(val).getTime();
      if (!isNaN(parsed)) {
        onTargetTimestampChange(snapToNistMinute(parsed));
      }
    }
  };

  // Re-sync preset to now if selected
  const refreshPreset = () => {
    if (typeof selectedPreset === 'number') {
      applyPreset(selectedPreset);
    }
  };

  // Set initial preset to +15 mins if not set
  useEffect(() => {
    if (!targetTimestampMs) {
      applyPreset(15);
    }
  }, []);

  const diffMs = targetTimestampMs - currentTimeMs;
  const isExpired = diffMs <= 0;
  const diffMinutes = Math.max(0, Math.ceil(diffMs / 60000));
  const diffSeconds = Math.max(0, Math.floor((diffMs % 60000) / 1000));
  const targetDate = new Date(targetTimestampMs);

  const canSubmit = isValid && !isExpired;

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-[#0b1122] border border-slate-800 shadow-2xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Target Pulse Commitment</h3>
            <p className="text-xs text-slate-400">
              Locks configuration to a future NIST Beacon 2.0 pulse.
            </p>
          </div>
        </div>

        {typeof selectedPreset === 'number' && (
          <button
            type="button"
            onClick={refreshPreset}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-teal-400 transition-colors text-xs flex items-center gap-1"
            title="Re-sync target pulse to future time from this second"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[10px]">Re-sync</span>
          </button>
        )}
      </div>

      {/* Allocation Title & Organizer */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Allocation Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="e.g., October 2026 Night Shift Rotation"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Organizer / Class Representative (Optional)
          </label>
          <input
            type="text"
            value={creatorName}
            onChange={e => onCreatorNameChange(e.target.value)}
            placeholder="e.g., Clinical Year 5 Class Reps"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Target Pulse Presets */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center justify-between">
          <span>Future Reveal Time (Snaps to NIST 60s pulse)</span>
          <span className="text-[11px] text-teal-400 font-mono">
            {!isExpired ? `In ~${diffMinutes}m ${diffSeconds}s` : '⚠️ Time passed!'}
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { mins: 2, label: '+2 min (Demo)' },
            { mins: 5, label: '+5 min' },
            { mins: 15, label: '+15 min' },
            { mins: 30, label: '+30 min' },
            { mins: 60, label: '+1 hour' },
          ].map(preset => (
            <button
              key={preset.mins}
              type="button"
              onClick={() => applyPreset(preset.mins)}
              className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all text-center border ${
                selectedPreset === preset.mins
                  ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-semibold shadow-sm shadow-teal-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom time picker */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-slate-500">Custom:</span>
          <input
            type="datetime-local"
            value={customDateTime}
            onChange={e => handleCustomChange(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Target Confirmation Card */}
      <div
        className={`p-4 rounded-2xl border transition-colors ${
          isExpired
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-slate-950/80 border-slate-800/80'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl mt-0.5 ${
                isExpired
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}
            >
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Scheduled NIST Pulse Output:</div>
              <div className="text-sm font-mono font-bold text-white mt-0.5">
                {format(targetDate, 'HH:mm:00')} Local
                <span className="text-xs text-slate-400 font-normal ml-2 font-mono">
                  ({targetDate.toUTCString().slice(17, 25)} UTC)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Date: {format(targetDate, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
          </div>
        </div>

        {isExpired && (
          <div className="mt-3 pt-3 border-t border-red-500/20 text-xs text-red-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Target time is in the past. Click a future preset above (e.g. +15 min).</span>
          </div>
        )}
      </div>

      {validationError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        disabled={!canSubmit}
        onClick={onSubmitCommitment}
        className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
          canSubmit
            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 shadow-teal-500/20 cursor-pointer'
            : 'bg-slate-800/80 text-slate-500 border border-slate-800 cursor-not-allowed'
        }`}
      >
        <Lock className="w-4 h-4" />
        <span>Generate Verifiable Commitment Link</span>
        <ChevronRight className="w-4 h-4" />
      </button>

      <p className="text-[11px] text-slate-500 text-center leading-relaxed">
        The parameters and target minute will be cryptographically locked in the URL hash. Share it with your peers before the clock strikes—no one can tamper with the names, and no one can know the seed in advance.
      </p>
    </div>
  );
};
