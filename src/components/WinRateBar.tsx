import React from 'react';
import { Player } from '../types/go';

interface WinRateBarProps {
  winRateStr?: string; // e.g. "62.5%"
  scoreLeadStr?: string; // e.g. "B+2.5" or "W+1.0"
  playerToMove: Player;
  isAnalyzing: boolean;
}

export const WinRateBar: React.FC<WinRateBarProps> = ({
  winRateStr = '50.0%',
  scoreLeadStr = 'Even',
  playerToMove,
  isAnalyzing,
}) => {
  // Parse win rate percentage for current player
  let currentPlayerWinRate = 50.0;
  if (winRateStr) {
    const parsed = parseFloat(winRateStr.replace('%', '').trim());
    if (!isNaN(parsed)) {
      currentPlayerWinRate = Math.min(Math.max(parsed, 1), 99);
    }
  }

  // Calculate Black's absolute win rate
  const blackWinRate = playerToMove === 'B' ? currentPlayerWinRate : 100 - currentPlayerWinRate;
  const whiteWinRate = 100 - blackWinRate;

  // Determine lead styling
  const isBlackLeading = scoreLeadStr.startsWith('B+');
  const isWhiteLeading = scoreLeadStr.startsWith('W+');

  return (
    <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-600 shadow-sm"></span>
          <span className="text-slate-200">Black</span>
          <span className="text-emerald-400 font-mono text-sm ml-1">{blackWinRate.toFixed(1)}%</span>
        </div>

        <div className="flex items-center gap-2">
          {isAnalyzing ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              KataGo Evaluating...
            </span>
          ) : (
            <span
              className={`px-2.5 py-0.5 rounded-md font-mono text-xs font-bold border ${
                isBlackLeading
                  ? 'bg-slate-950 text-slate-100 border-slate-600'
                  : isWhiteLeading
                  ? 'bg-slate-100 text-slate-900 border-slate-300'
                  : 'bg-slate-800 text-slate-300 border-slate-600'
              }`}
            >
              Lead: {scoreLeadStr}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-cyan-300 font-mono text-sm mr-1">{whiteWinRate.toFixed(1)}%</span>
          <span className="text-slate-200">White</span>
          <span className="inline-block w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-300 shadow-sm"></span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/60 shadow-inner">
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-slate-950 via-slate-800 to-slate-700 transition-all duration-700 ease-out"
          style={{ width: `${blackWinRate}%` }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-slate-100 via-slate-200 to-cyan-100 transition-all duration-700 ease-out"
          style={{ width: `${whiteWinRate}%` }}
        />
        {/* Center 50% Divider Marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-cyan-400/80 -translate-x-1/2 z-10" />
      </div>
    </div>
  );
};
