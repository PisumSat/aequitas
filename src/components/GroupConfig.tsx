import React, { useState } from 'react';
import { GroupsPayload } from '../types';
import { SAMPLE_STUDENTS, SAMPLE_GROUPS } from '../lib/sampleData';
import { cleanCandidatesList } from '../lib/allocators';
import { Users, Sparkles, Plus, Trash2 } from 'lucide-react';

interface GroupConfigProps {
  payload: GroupsPayload;
  onChange: (payload: GroupsPayload) => void;
}

export const GroupConfig: React.FC<GroupConfigProps> = ({ payload, onChange }) => {
  const [candidatesText, setCandidatesText] = useState(payload.candidates.join('\n'));
  const [newGroupName, setNewGroupName] = useState('');

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
      groupNames: SAMPLE_GROUPS,
    });
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    onChange({
      ...payload,
      groupNames: [...payload.groupNames, newGroupName.trim()],
    });
    setNewGroupName('');
  };

  const handleRemoveGroup = (idx: number) => {
    onChange({
      ...payload,
      groupNames: payload.groupNames.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6">
      {/* Student Roster Section */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" />
            <h4 className="text-sm font-semibold text-white">Student Candidates</h4>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-mono font-semibold border border-teal-500/20">
              {payload.candidates.length} students
            </span>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-colors self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Medical Clerkship Sample</span>
          </button>
        </div>

        <textarea
          rows={5}
          value={candidatesText}
          onChange={e => parseAndSyncCandidates(e.target.value)}
          placeholder="Paste student names (one per line or comma-separated)..."
          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span>Strips leading numbers and deduplicates names automatically.</span>
          <span className="font-mono text-slate-400">
            ~{Math.ceil(payload.candidates.length / Math.max(1, payload.groupNames.length))} per group
          </span>
        </div>
      </div>

      {/* Target Groups / Wards */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">
            Clinical Groups / Wards ({payload.groupNames.length})
          </h4>
        </div>

        <div className="space-y-2 mb-4">
          {payload.groupNames.map((name, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 font-mono text-xs flex items-center justify-center font-bold border border-teal-500/20">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-slate-200">{name}</span>
              </div>
              {payload.groupNames.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(idx)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                  title="Remove group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New Group Name (e.g., Team Pediatrics)"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddGroup())}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
          />
          <button
            type="button"
            onClick={handleAddGroup}
            className="flex items-center gap-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 rounded-xl px-4 py-2 text-xs font-semibold border border-teal-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};
