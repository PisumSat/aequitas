import React, { useState } from 'react';
import { ShiftsPayload, ShiftDefinition } from '../types';
import { SAMPLE_STUDENTS, SAMPLE_SHIFTS } from '../lib/sampleData';
import { cleanCandidatesList } from '../lib/allocators';
import {
  Calendar,
  Users,
  Moon,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';

interface ShiftConfigProps {
  payload: ShiftsPayload;
  onChange: (payload: ShiftsPayload) => void;
}

export const ShiftConfig: React.FC<ShiftConfigProps> = ({ payload, onChange }) => {
  const [candidatesText, setCandidatesText] = useState(payload.candidates.join('\n'));
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftCode, setNewShiftCode] = useState('');
  const [newShiftCategory, setNewShiftCategory] = useState<'night' | 'er' | 'icu' | 'ward' | 'general'>('night');

  // Parse text into candidates in real time (handles commas, tabs, newlines, and numbers)
  const parseAndSyncCandidates = (text: string) => {
    setCandidatesText(text);
    // Split by newlines or commas
    const rawItems = text
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const cleaned = cleanCandidatesList(rawItems);
    onChange({ ...payload, candidates: cleaned });
  };

  const handleLoadSample = () => {
    setCandidatesText(SAMPLE_STUDENTS.join('\n'));
    const today = new Date();
    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(addDays(today, 13), 'yyyy-MM-dd'); // 14-day schedule
    onChange({
      ...payload,
      candidates: SAMPLE_STUDENTS,
      startDate,
      endDate,
      shifts: SAMPLE_SHIFTS,
    });
  };

  const handleSetDuration = (days: number) => {
    const start = payload.startDate ? parseISO(payload.startDate) : new Date();
    const end = addDays(start, days - 1);
    onChange({
      ...payload,
      endDate: format(end, 'yyyy-MM-dd'),
    });
  };

  const handleStartDateChange = (newStart: string) => {
    let newEnd = payload.endDate;
    if (newStart && newEnd && newStart > newEnd) {
      newEnd = newStart;
    }
    onChange({
      ...payload,
      startDate: newStart,
      endDate: newEnd,
    });
  };

  const handleEndDateChange = (newEnd: string) => {
    let newStart = payload.startDate;
    if (newEnd && newStart && newEnd < newStart) {
      newStart = newEnd;
    }
    onChange({
      ...payload,
      startDate: newStart,
      endDate: newEnd,
    });
  };

  const handleAddShift = () => {
    if (!newShiftName.trim()) return;
    const code = newShiftCode.trim() || newShiftName.slice(0, 4).toUpperCase();
    const colors = ['#6366f1', '#ef4444', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];
    const randomColor = colors[payload.shifts.length % colors.length];

    const newDef: ShiftDefinition = {
      id: `shift-${Date.now()}`,
      name: newShiftName.trim(),
      code,
      color: randomColor,
      category: newShiftCategory,
      weight: newShiftCategory === 'night' ? 1.5 : 1.0,
      slotsPerDay: 1,
    };

    onChange({
      ...payload,
      shifts: [...payload.shifts, newDef],
    });

    setNewShiftName('');
    setNewShiftCode('');
  };

  const handleRemoveShift = (id: string) => {
    onChange({
      ...payload,
      shifts: payload.shifts.filter(s => s.id !== id),
    });
  };

  const handleUpdateSlots = (id: string, slots: number) => {
    onChange({
      ...payload,
      shifts: payload.shifts.map(s => (s.id === id ? { ...s, slotsPerDay: Math.max(1, slots) } : s)),
    });
  };

  // Calculate schedule duration in days
  const startD = parseISO(payload.startDate);
  const endD = parseISO(payload.endDate);
  const durationDays = Math.max(
    1,
    Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  return (
    <div className="space-y-6">
      {/* Student Roster Section */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" />
            <h4 className="text-sm font-semibold text-white">Student Roster Pool</h4>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-mono font-semibold border border-teal-500/20">
              {payload.candidates.length} active students
            </span>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-colors self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load 12 Medical Students Sample</span>
          </button>
        </div>

        <textarea
          rows={5}
          value={candidatesText}
          onChange={e => parseAndSyncCandidates(e.target.value)}
          placeholder="Paste student names (separated by newlines or commas)...&#10;1. Alice Chen&#10;2. Somchai Prasert&#10;3. David Kim"
          className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono transition-colors"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span>Smart auto-cleaner strips numbering (e.g. "1.", "-") and deduplicates automatically.</span>
          <span className="font-mono text-slate-400">{payload.candidates.length} parsed</span>
        </div>
      </div>

      {/* Schedule Period & Dates */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400" />
            <h4 className="text-sm font-semibold text-white">Schedule Date Range</h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {durationDays} {durationDays === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Preset Duration Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSetDuration(7)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                durationDays === 7
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              1 Week
            </button>
            <button
              type="button"
              onClick={() => handleSetDuration(14)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                durationDays === 14
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              2 Weeks
            </button>
            <button
              type="button"
              onClick={() => handleSetDuration(30)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                durationDays === 30
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
            <input
              type="date"
              value={payload.startDate}
              onChange={e => handleStartDateChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">End Date</label>
            <input
              type="date"
              value={payload.endDate}
              onChange={e => handleEndDateChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Shift Duties & Slots */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-teal-400" />
            <h4 className="text-sm font-semibold text-white">Hospital Shifts & On-Call Duties</h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {payload.shifts.length} duties
            </span>
          </div>
        </div>

        {/* Existing Shifts List */}
        <div className="space-y-2 mb-4">
          {payload.shifts.map(shift => (
            <div
              key={shift.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-slate-800"
                  style={{ backgroundColor: shift.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{shift.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                      {shift.code}
                    </span>
                    {shift.category === 'night' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                        🌙 Night Duty
                      </span>
                    )}
                    {shift.category === 'er' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                        🚨 ER
                      </span>
                    )}
                    {shift.category === 'icu' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                        🏥 ICU
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Slots/day:</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={shift.slotsPerDay || 1}
                    onChange={e => handleUpdateSlots(shift.id, parseInt(e.target.value) || 1)}
                    className="w-12 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-center text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                {payload.shifts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveShift(shift.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                    title="Remove shift"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Shift Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3 border-t border-slate-800/60">
          <input
            type="text"
            placeholder="Shift Name (e.g., Surgery Night Call)"
            value={newShiftName}
            onChange={e => setNewShiftName(e.target.value)}
            className="sm:col-span-5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
          />
          <input
            type="text"
            placeholder="Code (e.g., SURG)"
            value={newShiftCode}
            onChange={e => setNewShiftCode(e.target.value)}
            className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono"
          />
          <select
            value={newShiftCategory}
            onChange={e => setNewShiftCategory(e.target.value as any)}
            className="sm:col-span-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="night">🌙 Night Shift</option>
            <option value="er">🚨 Emergency Dept</option>
            <option value="icu">🏥 ICU On-Call</option>
            <option value="ward">📋 Day Ward</option>
            <option value="general">🔹 General</option>
          </select>
          <button
            type="button"
            onClick={handleAddShift}
            className="sm:col-span-2 flex items-center justify-center gap-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 rounded-xl px-3 py-2 text-xs font-semibold border border-teal-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Shift</span>
          </button>
        </div>
      </div>

      {/* Medical Rota Fairness Rules */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>Medical Workload Equity & Protection Rules</span>
        </h4>
        <div className="space-y-3 text-xs text-slate-300">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={payload.preventConsecutiveNights ?? true}
              onChange={e => onChange({ ...payload, preventConsecutiveNights: e.target.checked })}
              className="mt-0.5 rounded border-slate-700 text-teal-500 focus:ring-teal-400/20 bg-slate-900"
            />
            <div>
              <span className="font-medium text-slate-200">Avoid consecutive night duties & post-call daytime shifts</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Protects medical students from back-to-back night shifts and day-shifts immediately following a night on-call.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={payload.balanceWeekends ?? true}
              onChange={e => onChange({ ...payload, balanceWeekends: e.target.checked })}
              className="mt-0.5 rounded border-slate-700 text-teal-500 focus:ring-teal-400/20 bg-slate-900"
            />
            <div>
              <span className="font-medium text-slate-200">Equalize weekend (Saturday / Sunday) duties</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Distributes weekend shifts evenly so that no peer is unfairly burdened with weekend hospital coverage.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
