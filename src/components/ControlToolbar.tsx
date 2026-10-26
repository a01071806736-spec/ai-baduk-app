import React from 'react';
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Undo2,
  RotateCcw,
  Volume2,
  VolumeX,
  Hash,
  Eye,
  Grid,
} from 'lucide-react';
import { Player } from '../types/go';

interface ControlToolbarProps {
  currentMoveIndex: number;
  totalMoves: number;
  onGoToMove: (index: number) => void;
  onUndo: () => void;
  onPass: () => void;
  onReset: () => void;
  playerToMove: Player;
  onTogglePlayerToMove: () => void;
  captures: { B: number; W: number };
  showCoordinates: boolean;
  onToggleCoordinates: () => void;
  showMoveNumbers: boolean;
  onToggleMoveNumbers: () => void;
  showAiOverlay: boolean;
  onToggleAiOverlay: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  currentMoveIndex,
  totalMoves,
  onGoToMove,
  onUndo,
  onPass,
  onReset,
  playerToMove,
  onTogglePlayerToMove,
  captures,
  showCoordinates,
  onToggleCoordinates,
  showMoveNumbers,
  onToggleMoveNumbers,
  showAiOverlay,
  onToggleAiOverlay,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 shadow-xl backdrop-blur-md flex flex-col gap-3">
      {/* Top Row: Turn Indicator, Captures, and Quick Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Active Turn Switch */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Turn:</span>
          <button
            onClick={onTogglePlayerToMove}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm border ${
              playerToMove === 'B'
                ? 'bg-slate-950 text-slate-100 border-slate-600 ring-1 ring-cyan-500/50'
                : 'bg-slate-100 text-slate-900 border-slate-300 ring-1 ring-cyan-500/50'
            }`}
            title="Click to toggle active player to move"
          >
            <span
              className={`w-3 h-3 rounded-full border ${
                playerToMove === 'B'
                  ? 'bg-black border-slate-400'
                  : 'bg-white border-slate-400'
              }`}
            />
            <span>{playerToMove === 'B' ? 'Black to Move' : 'White to Move'}</span>
          </button>
        </div>

        {/* Captures Pill */}
        <div className="flex items-center gap-3 text-xs font-mono bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-500" />
            <span className="text-slate-400">Captures:</span>
            <span className="text-emerald-400 font-bold">{captures.B}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-400" />
            <span className="text-slate-400">Captures:</span>
            <span className="text-cyan-300 font-bold">{captures.W}</span>
          </div>
        </div>

        {/* Pass and Reset Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPass}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Pass current turn"
          >
            Pass
          </button>
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors"
            title="Reset to empty board"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Middle Row: Move Navigation Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onGoToMove(0)}
            disabled={currentMoveIndex <= 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition-colors"
            title="Beginning (Move 0)"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onGoToMove(currentMoveIndex - 1)}
            disabled={currentMoveIndex <= 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition-colors"
            title="Previous Move"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onUndo}
            disabled={totalMoves === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs text-slate-200 transition-colors"
            title="Undo Last Move"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>
        </div>

        {/* Current Move Counter Display */}
        <div className="text-center font-mono">
          <span className="text-xs text-slate-400">Move: </span>
          <span className="text-sm font-bold text-cyan-300">{currentMoveIndex}</span>
          <span className="text-xs text-slate-500"> / {totalMoves}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onGoToMove(currentMoveIndex + 1)}
            disabled={currentMoveIndex >= totalMoves}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition-colors"
            title="Next Move"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onGoToMove(totalMoves)}
            disabled={currentMoveIndex >= totalMoves}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition-colors"
            title="End of Game"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Row: View Option Toggles */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Coordinates Toggle */}
          <button
            onClick={onToggleCoordinates}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              showCoordinates
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Coordinates A-T and 1-19"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Coords</span>
          </button>

          {/* Move Numbers Toggle */}
          <button
            onClick={onToggleMoveNumbers}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              showMoveNumbers
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Move Numbers on Stones"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Numbers</span>
          </button>

          {/* AI Overlay Badges Toggle */}
          <button
            onClick={onToggleAiOverlay}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
              showAiOverlay
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle KataGo Candidate Badges (1, 2, 3)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>AI Badges</span>
          </button>
        </div>

        {/* Audio Clack Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded-lg border transition-colors ${
            soundEnabled
              ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
              : 'bg-slate-900 text-slate-500 border-slate-800'
          }`}
          title={soundEnabled ? 'Stone Sound FX: Enabled' : 'Stone Sound FX: Muted'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
