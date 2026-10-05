import React, { useState } from 'react';
import { LotteryPayload } from '../types';
import { SAMPLE_STUDENTS } from '../lib/sampleData';
import { cleanCandidatesList } from '../lib/allocators';
import { Trophy, Sparkles } from 'lucide-react';

interface LotteryConfigProps {
  payload: LotteryPayload;
  onChange: (payload: LotteryPayload) => void;
}

export const LotteryConfig: React.FC<LotteryConfigProps> = ({ payload, onChange }) => {
  const [candidatesText, setCandidatesText] = useState(payload.candidates.join('\n'));

  const parseAndSyncCandidates = (text: string) => {
    setCandidatesText(text);
    const rawItems = text
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const cleaned = cleanCandidatesList(rawItems);
    onChange({ ...payload, candidates: cleaned });
  };

  const handleLoadSample = () => {
    setCandidatesText(SAMPLE_STUDENTS.join('\n'));
    onChange({
      ...payload,
      candidates: SAMPLE_STUDENTS,
      pickCount: 3,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-teal-400" />
            <h4 className="text-sm font-semibold text-white">Candidate Pool</h4>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-mono font-semibold border border-teal-500/20">
              {payload.candidates.length} candidates
            </span>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-colors self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Medical Student Pool</span>
          </button>
        </div>

        <textarea
          rows={6}
          value={candidatesText}
          onChange={e => parseAndSyncCandidates(e.target.value)}
          placeholder="Enter candidates (one per line or comma-separated)..."
          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
        />
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Number of Candidates to Select (K)
            </label>
            <p className="text-xs text-slate-500">
              How many distinct students will be chosen in this lottery
            </p>
          </div>
          <input
            type="number"
            min={1}
            max={Math.max(1, payload.candidates.length)}
            value={payload.pickCount}
            onChange={e => onChange({ ...payload, pickCount: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-24 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-sm font-mono text-white focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>
    </div>
  );
};
