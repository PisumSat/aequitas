import React from 'react';
import { CalendarDays, Users, ArrowDown10, Trophy, Hash } from 'lucide-react';
import { AllocationMode } from '../types';

interface ModeSelectorProps {
  selectedMode: AllocationMode;
  onSelectMode: (mode: AllocationMode) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
  disabled = false,
}) => {
  const modes: {
    id: AllocationMode;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'shifts',
      label: 'Night Shifts & Rota',
      description: 'Allocate hospital duties, night calls, and on-call weekends fairly',
      icon: <CalendarDays className="w-4 h-4" />,
      badge: 'Popular',
    },
    {
      id: 'groups',
      label: 'Ward & Clinical Groups',
      description: 'Split student cohort into balanced medical rotations or dissection tables',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'order',
      label: 'Presentation Order',
      description: 'Generate unbiased speaking queue and viva exam time slots',
      icon: <ArrowDown10 className="w-4 h-4" />,
    },
    {
      id: 'lottery',
      label: 'Duty Lottery / Pick K',
      description: 'Randomly choose K students for holiday coverage or elective spots',
      icon: <Trophy className="w-4 h-4" />,
    },
    {
      id: 'range',
      label: 'Number Range',
      description: 'Draw cryptographically verifiable random numbers',
      icon: <Hash className="w-4 h-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
      {modes.map(mode => {
        const isSelected = selectedMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectMode(mode.id)}
            className={`p-3.5 rounded-xl text-left transition-all relative border flex flex-col justify-between ${
              isSelected
                ? 'bg-teal-500/10 border-teal-500/50 shadow-md shadow-teal-500/5 text-white'
                : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`p-2 rounded-lg ${
                    isSelected
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {mode.icon}
                </span>
                {mode.badge && (
                  <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {mode.badge}
                  </span>
                )}
              </div>
              <h3
                className={`text-sm font-semibold tracking-tight ${
                  isSelected ? 'text-white' : 'text-slate-200'
                }`}
              >
                {mode.label}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {mode.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
