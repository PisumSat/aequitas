import React, { useState } from 'react';
import { OrderPayload } from '../types';
import { SAMPLE_TOPICS } from '../lib/sampleData';
import { cleanCandidatesList } from '../lib/allocators';
import { ArrowDown10, Clock, Sparkles } from 'lucide-react';

interface SequenceConfigProps {
  payload: OrderPayload;
  onChange: (payload: OrderPayload) => void;
}

export const SequenceConfig: React.FC<SequenceConfigProps> = ({ payload, onChange }) => {
  const [itemsText, setItemsText] = useState(payload.items.join('\n'));

  const parseAndSyncItems = (text: string) => {
    setItemsText(text);
    const rawItems = text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const cleaned = cleanCandidatesList(rawItems);
    onChange({ ...payload, items: cleaned });
  };

  const handleLoadSample = () => {
    setItemsText(SAMPLE_TOPICS.join('\n'));
    onChange({
      ...payload,
      items: SAMPLE_TOPICS,
      startTime: '08:30',
      intervalMinutes: 15,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <ArrowDown10 className="w-4 h-4 text-teal-400" />
            <h4 className="text-sm font-semibold text-white">Presentations / Students to Sequence</h4>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-mono font-semibold border border-teal-500/20">
              {payload.items.length} items
            </span>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-colors self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load PBL Case Presentation Topics</span>
          </button>
        </div>

        <textarea
          rows={6}
          value={itemsText}
          onChange={e => parseAndSyncItems(e.target.value)}
          placeholder="Enter names or presentation topics (one per line)..."
          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
        />
        <p className="text-[11px] text-slate-500 mt-2">
          Strips numbering automatically. Each item will be randomized into an unbiased presentation sequence.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-teal-400" />
          <h4 className="text-sm font-semibold text-white">Presentation Slot Schedule</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">First Presentation Time</label>
            <input
              type="time"
              value={payload.startTime || '08:30'}
              onChange={e => onChange({ ...payload, startTime: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Duration Per Slot (Minutes)</label>
            <input
              type="number"
              min={5}
              max={120}
              step={5}
              value={payload.intervalMinutes || 15}
              onChange={e => onChange({ ...payload, intervalMinutes: Math.max(5, parseInt(e.target.value) || 15) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
