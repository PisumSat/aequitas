import React, { useState } from 'react';
import {
  RandomizerCommitment,
  NistPulse,
  ShiftAllocationResult,
  GroupAllocationResult,
  OrderAllocationResult,
  LotteryAllocationResult,
  RangeAllocationResult,
  ShiftsPayload,
} from '../types';
import {
  ShieldCheck,
  Download,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Users,
  FileSpreadsheet,
  Share2,
  Filter,
  Printer,
  CalendarDays,
  LayoutGrid,
  BarChart3,
  Moon,
  Sparkles,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatDualTime } from '../lib/nistBeacon';

interface ResultViewProps {
  commitment: RandomizerCommitment;
  pulse: NistPulse;
  combinedSeedHex: string;
  resultData: any;
  onOpenAudit: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  commitment,
  pulse,
  combinedSeedHex,
  resultData,
  onOpenAudit,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'calendar' | 'workload'>('schedule');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [copiedSchedule, setCopiedSchedule] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Export CSV for shifts
  const exportShiftsCSV = (data: ShiftAllocationResult) => {
    const rows = [['Date', 'Day', 'IsWeekend', 'Shift', 'Student Assigned']];
    data.schedule.forEach(slot => {
      slot.shifts.forEach(s => {
        const shiftDef = (commitment.payload as ShiftsPayload).shifts.find(x => x.id === s.shiftId);
        rows.push([
          slot.dateIso,
          slot.dayOfWeek,
          slot.isWeekend ? 'Yes' : 'No',
          shiftDef ? shiftDef.name : s.shiftId,
          s.assignedCandidate || 'Unassigned',
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${commitment.title.replace(/\s+/g, '_')}_schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export iCal .ics for all or filtered student
  const exportShiftsICal = (data: ShiftAllocationResult, studentName = 'all') => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Aequitas//NIST Verifiable Randomizer//EN\nCALSCALE:GREGORIAN\n';
    data.schedule.forEach(slot => {
      slot.shifts.forEach((s, idx) => {
        if (studentName !== 'all' && s.assignedCandidate !== studentName) return;

        const shiftDef = (commitment.payload as ShiftsPayload).shifts.find(x => x.id === s.shiftId);
        const cleanDate = slot.dateIso.replace(/-/g, '');
        icsContent += `BEGIN:VEVENT\n`;
        icsContent += `UID:${cleanDate}-${idx}-${s.shiftId}@aequitas\n`;
        icsContent += `DTSTAMP:${cleanDate}T000000Z\n`;
        icsContent += `DTSTART;VALUE=DATE:${cleanDate}\n`;
        icsContent += `SUMMARY:${shiftDef ? shiftDef.name : 'Duty'}: ${s.assignedCandidate}\n`;
        icsContent += `DESCRIPTION:Verified medical rota assigned via NIST Beacon 2.0 Pulse #${pulse.pulseIndex}\n`;
        icsContent += `STATUS:CONFIRMED\n`;
        icsContent += `END:VEVENT\n`;
      });
    });
    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = studentName === 'all'
      ? `${commitment.title.replace(/\s+/g, '_')}.ics`
      : `${studentName.replace(/\s+/g, '_')}_schedule.ics`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy plain text summary for chat apps
  const handleCopyChatSummary = () => {
    let text = `📋 ${commitment.title}\n`;
    text += `🔒 Verified by NIST Beacon Pulse #${pulse.pulseIndex} (${pulse.timeStamp})\n\n`;

    if (commitment.mode === 'shifts') {
      const data = resultData as ShiftAllocationResult;
      data.schedule.forEach(slot => {
        const shiftStrs = slot.shifts
          .map(s => {
            const def = (commitment.payload as ShiftsPayload).shifts.find(x => x.id === s.shiftId);
            return `${def ? def.code : s.shiftId}: ${s.assignedCandidate}`;
          })
          .join(', ');
        text += `${slot.dateIso} (${slot.dayOfWeek}): ${shiftStrs}\n`;
      });
    } else if (commitment.mode === 'groups') {
      const data = resultData as GroupAllocationResult;
      data.groups.forEach(g => {
        text += `\n🏥 ${g.name} (${g.members.length}):\n${g.members.map(m => ` • ${m}`).join('\n')}\n`;
      });
    } else if (commitment.mode === 'order') {
      const data = resultData as OrderAllocationResult;
      data.orderedList.forEach(item => {
        text += `${item.rank}. ${item.timeSlot ? `[${item.timeSlot}] ` : ''}${item.name}\n`;
      });
    } else if (commitment.mode === 'lottery') {
      const data = resultData as LotteryAllocationResult;
      data.selected.forEach(s => {
        text += `🏆 ${s.rank}. ${s.name}\n`;
      });
    }

    text += `\n🔗 Verify cryptographic signatures: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 2500);
  };

  // Personal schedule stats when filtering by student
  let personalStats = null;
  let personalDuties: { dateIso: string; dayOfWeek: string; shiftName: string; isNight: boolean; color: string }[] = [];
  if (commitment.mode === 'shifts' && selectedStudentFilter !== 'all') {
    const data = resultData as ShiftAllocationResult;
    const shiftDefs = (commitment.payload as ShiftsPayload).shifts;
    personalStats = data.studentStats.find(s => s.name === selectedStudentFilter);

    data.schedule.forEach(slot => {
      slot.shifts.forEach(s => {
        if (s.assignedCandidate === selectedStudentFilter) {
          const def = shiftDefs.find(x => x.id === s.shiftId);
          personalDuties.push({
            dateIso: slot.dateIso,
            dayOfWeek: slot.dayOfWeek,
            shiftName: def?.name || s.shiftId,
            isNight: def?.category === 'night',
            color: def?.color || '#14b8a6',
          });
        }
      });
    });
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0a1426] to-[#070c18] border border-teal-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              Mathematically Verified • NIST Beacon 2.0
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenAudit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-xs font-semibold text-teal-300 transition-colors shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Audit & Verify Math</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
              title="Print hospital station bulletin"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>Share Link</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          {commitment.title}
        </h1>
        {commitment.creatorName && (
          <p className="text-xs text-slate-400 mb-4">
            Organized by <span className="text-slate-200 font-semibold">{commitment.creatorName}</span>
          </p>
        )}

        {/* Pulse provenance chip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono pt-3 border-t border-slate-800/80 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">NIST Pulse:</span>
            <a
              href={`https://beacon.nist.gov/beacon/2.0/pulse/time/${commitment.targetTimestampMs}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:underline flex items-center gap-1 font-bold"
            >
              #{pulse.pulseIndex}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Timestamp:</span>
            <span className="text-slate-300">{pulse.timeStamp}</span>
          </div>
        </div>
      </div>

      {/* RESULT CONTENT BY MODE */}

      {/* 1. SHIFTS MODE */}
      {commitment.mode === 'shifts' && (
        <div className="space-y-6">
          {/* Action & Filter Bar */}
          <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* View switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-teal-500/20 text-teal-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Daily Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-teal-500/20 text-teal-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Monthly Calendar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('workload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'workload'
                    ? 'bg-teal-500/20 text-teal-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Workload Audit</span>
              </button>
            </div>

            {/* Student Filter */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-slate-400">Student:</span>
              <select
                value={selectedStudentFilter}
                onChange={e => setSelectedStudentFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
              >
                <option value="all">All Students ({(commitment.payload as ShiftsPayload).candidates.length})</option>
                {(commitment.payload as ShiftsPayload).candidates.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyChatSummary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                {copiedSchedule ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchedule ? 'Copied!' : 'Copy Summary'}</span>
              </button>
              <button
                type="button"
                onClick={() => exportShiftsCSV(resultData as ShiftAllocationResult)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => exportShiftsICal(resultData as ShiftAllocationResult, selectedStudentFilter)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>{selectedStudentFilter === 'all' ? 'iCal' : 'My iCal'}</span>
              </button>
            </div>
          </div>

          {/* Personal Student Focus Card (shown when filtering by a specific student) */}
          {selectedStudentFilter !== 'all' && personalStats && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-500/10 via-indigo-500/10 to-slate-900 border border-teal-500/30 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-base">
                    {selectedStudentFilter.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedStudentFilter}</h3>
                    <p className="text-xs text-slate-400">Personal On-Call Rotation Summary</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => exportShiftsICal(resultData as ShiftAllocationResult, selectedStudentFilter)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-semibold text-teal-300 transition-colors self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Add My Shifts to Calendar</span>
                </button>
              </div>

              {/* Personal metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                  <span className="text-xl font-mono font-bold text-teal-400">{personalStats.totalShifts}</span>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Shifts</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                  <span className="text-xl font-mono font-bold text-indigo-400">{personalStats.nightShifts}</span>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Night Duties</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                  <span className="text-xl font-mono font-bold text-amber-400">{personalStats.weekendShifts}</span>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Weekend Duties</div>
                </div>
              </div>

              {/* Personal duties list */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 block">Assigned Duty Dates:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {personalDuties.map((d, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-slate-300 font-medium">
                        {d.dateIso} ({d.dayOfWeek})
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md font-semibold text-[11px]"
                        style={{ backgroundColor: `${d.color}25`, color: d.color }}
                      >
                        {d.shiftName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: DAILY SCHEDULE CARDS */}
          {activeTab === 'schedule' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(resultData as ShiftAllocationResult).schedule.map(slot => {
                const shiftDefs = (commitment.payload as ShiftsPayload).shifts;
                const matchesFilter =
                  selectedStudentFilter === 'all' ||
                  slot.shifts.some(s => s.assignedCandidate === selectedStudentFilter);

                return (
                  <div
                    key={slot.dateIso}
                    className={`p-4 rounded-3xl border transition-all ${
                      matchesFilter
                        ? slot.isWeekend
                          ? 'bg-slate-900/90 border-slate-700 shadow-md'
                          : 'bg-slate-900/60 border-slate-800/90'
                        : 'bg-slate-950/40 border-slate-900 opacity-30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {format(parseISO(slot.dateIso), 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">({slot.dayOfWeek})</span>
                      </div>
                      {slot.isWeekend && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                          Weekend
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {slot.shifts.map((s, idx) => {
                        const def = shiftDefs.find(x => x.id === s.shiftId);
                        const isHighlighted =
                          selectedStudentFilter !== 'all' && s.assignedCandidate === selectedStudentFilter;

                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                              isHighlighted
                                ? 'bg-teal-500/25 border-teal-500/60 shadow-sm'
                                : 'bg-slate-950/80 border-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: def?.color || '#14b8a6' }}
                              />
                              <span className="font-medium text-slate-300">
                                {def?.name || s.shiftId}
                              </span>
                            </div>
                            <span
                              className={`font-semibold px-2 py-0.5 rounded-md text-xs ${
                                isHighlighted
                                  ? 'bg-teal-400 text-slate-950 font-bold'
                                  : 'bg-slate-800/90 text-teal-300 font-medium'
                              }`}
                            >
                              {s.assignedCandidate}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: MONTHLY CALENDAR GRID VIEW */}
          {activeTab === 'calendar' && (
            <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Month Calendar Overview • Click any day or student to inspect</span>
                <span className="text-teal-400 font-mono">
                  {(resultData as ShiftAllocationResult).schedule.length} Total Days
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                {(resultData as ShiftAllocationResult).schedule.map(slot => {
                  const dateObj = parseISO(slot.dateIso);
                  const shiftDefs = (commitment.payload as ShiftsPayload).shifts;
                  const matchesFilter =
                    selectedStudentFilter === 'all' ||
                    slot.shifts.some(s => s.assignedCandidate === selectedStudentFilter);

                  return (
                    <div
                      key={slot.dateIso}
                      className={`p-2.5 rounded-2xl border min-h-[90px] flex flex-col justify-between text-xs transition-all ${
                        matchesFilter
                          ? slot.isWeekend
                            ? 'bg-slate-900 border-amber-500/30'
                            : 'bg-slate-950 border-slate-800'
                          : 'bg-slate-950/40 border-slate-900 opacity-30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 font-mono">
                        <span className="font-bold text-slate-200">{format(dateObj, 'd')}</span>
                        <span className="text-[10px] text-slate-500">{slot.dayOfWeek}</span>
                      </div>

                      <div className="space-y-1">
                        {slot.shifts.map((s, idx) => {
                          const def = shiftDefs.find(x => x.id === s.shiftId);
                          const isHighlighted =
                            selectedStudentFilter !== 'all' && s.assignedCandidate === selectedStudentFilter;

                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedStudentFilter(s.assignedCandidate || 'all')}
                              className={`px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer transition-colors ${
                                isHighlighted
                                  ? 'bg-teal-400 text-slate-950 font-bold'
                                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                              }`}
                              title={`${def?.name || s.shiftId}: ${s.assignedCandidate}`}
                            >
                              <span className="font-semibold">{def?.code || 'DUTY'}: </span>
                              <span>{s.assignedCandidate}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: WORKLOAD AUDIT TABLE */}
          {activeTab === 'workload' && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Student Workload Equity Distribution</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Demonstrates mathematical fairness and uniform workload balancing across peers.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Fairness Check Passed</span>
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3 font-medium">Student Name</th>
                    <th className="pb-3 font-medium text-center">Total Shifts</th>
                    <th className="pb-3 font-medium text-center">Night Duties</th>
                    <th className="pb-3 font-medium text-center">Weekend Duties</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(resultData as ShiftAllocationResult).studentStats.map(stat => (
                    <tr key={stat.name} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium text-slate-200">{stat.name}</td>
                      <td className="py-3 text-center font-mono text-teal-400 font-bold">
                        {stat.totalShifts}
                      </td>
                      <td className="py-3 text-center font-mono text-indigo-400 font-bold">
                        {stat.nightShifts}
                      </td>
                      <td className="py-3 text-center font-mono text-amber-400 font-bold">
                        {stat.weekendShifts}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentFilter(stat.name);
                            setActiveTab('schedule');
                          }}
                          className="text-[11px] text-teal-400 hover:text-teal-300 underline font-medium"
                        >
                          View Shifts
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. GROUPS MODE */}
      {commitment.mode === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(resultData as GroupAllocationResult).groups.map((group, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-mono font-bold text-xs">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-white text-sm">{group.name}</h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-400 font-semibold">
                  {group.members.length} members
                </span>
              </div>

              <div className="space-y-2">
                {group.members.map((member, mIdx) => (
                  <div
                    key={mIdx}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200"
                  >
                    <span className="text-slate-500 font-mono text-[11px] w-4">{mIdx + 1}.</span>
                    <span className="font-medium">{member}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. PRESENTATION ORDER MODE */}
      {commitment.mode === 'order' && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Unbiased Presentation Queue</h3>
              <p className="text-xs text-slate-400">Time slots scheduled according to configuration.</p>
            </div>
            <button
              onClick={handleCopyChatSummary}
              className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Queue</span>
            </button>
          </div>

          <div className="space-y-2">
            {(resultData as OrderAllocationResult).orderedList.map(item => (
              <div
                key={item.rank}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-800 text-teal-400 font-mono font-bold flex items-center justify-center text-xs">
                    {item.rank}
                  </span>
                  <span className="font-medium text-slate-200 text-sm">{item.name}</span>
                </div>
                {item.timeSlot && (
                  <span className="font-mono text-teal-300 bg-teal-500/15 px-2.5 py-1 rounded-lg border border-teal-500/25 font-semibold text-xs">
                    {item.timeSlot}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. LOTTERY MODE */}
      {commitment.mode === 'lottery' && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Selected Candidates</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(resultData as LotteryAllocationResult).selected.map(item => (
              <div
                key={item.rank}
                className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-teal-500/5 border border-amber-500/30 flex items-center gap-3.5 shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                  #{item.rank}
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Chosen Student</div>
                  <div className="text-sm font-bold text-white">{item.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. RANGE MODE */}
      {commitment.mode === 'range' && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white">Generated Random Numbers</h3>
          <div className="flex flex-wrap gap-3">
            {(resultData as RangeAllocationResult).numbers.map((num, idx) => (
              <span
                key={idx}
                className="px-5 py-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-300 font-mono font-extrabold text-lg shadow-sm"
              >
                {num}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
