import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  BrainCircuit,
  MessageSquare,
  Play,
  RotateCcw,
  FileCode,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CandidateMove, GoAnalysisResponse, Player } from '../types/go';

interface AnalysisPanelProps {
  analysis: GoAnalysisResponse | null;
  isAnalyzing: boolean;
  onRunAnalysis: (customPrompt?: string) => void;
  playerToMove: Player;
  onPlayCandidate: (candidate: CandidateMove) => void;
  vsAiMode: boolean;
  onToggleVsAi: () => void;
  onOpenJsonModal: () => void;
  analysisError?: string | null;
}

const QUICK_PROMPTS = [
  'Where to play next?',
  'Analyze overall board strategy',
  'Is 3-3 corner invasion optimal here?',
  'Evaluate life and death status',
  'Compare center influence vs territory',
];

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  isAnalyzing,
  onRunAnalysis,
  playerToMove,
  onPlayCandidate,
  vsAiMode,
  onToggleVsAi,
  onOpenJsonModal,
  analysisError,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');

  const handleSubmitCustomPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      onRunAnalysis(customPrompt.trim());
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Grandmaster AI Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                KataGo Grandmaster AI
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Engine Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Evaluating position for {playerToMove === 'B' ? 'Black (X)' : 'White (O)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Play vs AI Toggle */}
            <button
              onClick={onToggleVsAi}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
                vsAiMode
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 ring-2 ring-amber-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
              title="Toggle automatic AI response when placing a stone"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{vsAiMode ? 'Play vs AI: ON' : 'Play vs AI: OFF'}</span>
            </button>

            {/* Inspect JSON Output */}
            <button
              onClick={onOpenJsonModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Inspect raw JSON output format"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">JSON Format</span>
            </button>
          </div>
        </div>

        {/* Action Button: Run Analysis */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRunAnalysis(customPrompt || undefined)}
            disabled={isAnalyzing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Evaluating 1,600 Playouts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Evaluate Current Position</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {analysisError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysis && (
        <div className="flex flex-col gap-4">
          {/* Best Next Move Card */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Optimal Next Move
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Win Rate:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {analysis.win_rate_estimate}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">Lead:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {analysis.score_lead_estimate}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white font-mono font-black text-xl shadow-lg shadow-cyan-900/40 border border-cyan-400/50">
                  {analysis.next_move}
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Recommended Point</div>
                  <div className="text-sm font-semibold text-slate-100">
                    {analysis.top_3_candidates[0]?.reason || 'Main line variation with highest win expectancy'}
                  </div>
                </div>
              </div>

              {analysis.next_move !== 'PASS' && (
                <button
                  onClick={() =>
                    onPlayCandidate(
                      analysis.top_3_candidates[0] || {
                        move: analysis.next_move,
                        reason: 'Optimal next move',
                      }
                    )
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 flex items-center gap-1 transition-all"
                  title="Play this move directly on board"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </button>
              )}
            </div>
          </div>

          {/* Top 3 Candidates */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Top 3 Candidate Moves
            </h3>

            <div className="flex flex-col gap-2.5">
              {analysis.top_3_candidates.map((cand, idx) => {
                const rank = idx + 1;
                const badgeColor =
                  rank === 1
                    ? 'bg-amber-500 text-slate-950'
                    : rank === 2
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-purple-500 text-white';

                return (
                  <div
                    key={`cand-item-${cand.move}-${idx}`}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${badgeColor}`}
                      >
                        {rank}
                      </span>
                      <div>
                        <div className="font-mono font-bold text-sm text-slate-200">
                          {cand.move}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {cand.reason}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onPlayCandidate(cand)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 shrink-0 transition-colors flex items-center gap-1"
                      title={`Play ${cand.move}`}
                    >
                      <Play className="w-3 h-3" />
                      <span>Try</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tactical Commentary Card */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-300 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Grandmaster Commentary & Tactics
            </h3>
            <p className="text-xs leading-relaxed text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 font-sans whitespace-pre-line">
              {analysis.commentary}
            </p>
          </div>
        </div>
      )}

      {/* Ask Grandmaster Custom Tactical Question */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-300 mb-2 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          Ask Grandmaster AI
        </h3>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {QUICK_PROMPTS.map((promptText, i) => (
            <button
              key={`qp-${i}`}
              onClick={() => {
                setCustomPrompt(promptText);
                onRunAnalysis(promptText);
              }}
              disabled={isAnalyzing}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmitCustomPrompt} className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Is Black R14 invasion safe or overplay?"
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isAnalyzing || !customPrompt.trim()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-all shadow-md shrink-0"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
};
