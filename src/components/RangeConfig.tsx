import React from 'react';
import { RangePayload } from '../types';
import { Hash } from 'lucide-react';

interface RangeConfigProps {
  payload: RangePayload;
  onChange: (payload: RangePayload) => void;
}

export const RangeConfig: React.FC<RangeConfigProps> = ({ payload, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-teal-400" />
          <h4 className="text-sm font-semibold text-white">Integer Range Bounds</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Minimum Value</label>
            <input
              type="number"
              value={payload.min}
              onChange={e => onChange({ ...payload, min: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500/60 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Maximum Value</label>
            <input
              type="number"
              value={payload.max}
              onChange={e => onChange({ ...payload, max: parseInt(e.target.value) || 100 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500/60 font-mono"
            />
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">How Many Numbers</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={payload.count}
              onChange={e => onChange({ ...payload, count: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500/60 font-mono"
            />
          </div>
          <div className="pt-4 sm:pt-0">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={payload.unique}
                onChange={e => onChange({ ...payload, unique: e.target.checked })}
                className="rounded border-slate-700 text-teal-500 focus:ring-teal-400/20 bg-slate-900"
              />
              <span>Generate unique numbers only (no duplicates)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
