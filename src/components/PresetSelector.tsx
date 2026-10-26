import React from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { FAMOUS_PRESETS } from '../utils/goEngine';
import { GamePreset } from '../types/go';

interface PresetSelectorProps {
  onSelectPreset: (preset: GamePreset) => void;
  selectedPresetId?: string;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  onSelectPreset,
  selectedPresetId,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-200">
          Famous Grandmaster Positions & Problems
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FAMOUS_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    {preset.name}
                  </span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
                <div className="text-[11px] font-medium text-amber-400/90 mb-1">
                  {preset.subtitle}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {preset.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>{preset.moves.length} moves</span>
                <span className="font-semibold text-cyan-400">
                  {preset.playerToMove === 'B' ? 'Black to Play' : 'White to Play'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
