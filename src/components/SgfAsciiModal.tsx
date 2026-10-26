import React, { useState } from 'react';
import { X, Copy, Check, Download, Upload, Terminal, FileText, Code2 } from 'lucide-react';
import { BoardState, GoAnalysisResponse, GoMove, Player } from '../types/go';
import {
  asciiToBoard,
  boardToAscii,
  movesToSgf,
  sgfToMoves,
} from '../utils/goEngine';

interface SgfAsciiModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: BoardState;
  moves: GoMove[];
  playerToMove: Player;
  analysis: GoAnalysisResponse | null;
  onLoadAscii: (newBoard: BoardState, player: Player) => void;
  onLoadSgfMoves: (moves: GoMove[]) => void;
}

export const SgfAsciiModal: React.FC<SgfAsciiModalProps> = ({
  isOpen,
  onClose,
  board,
  moves,
  playerToMove,
  analysis,
  onLoadAscii,
  onLoadSgfMoves,
}) => {
  const [activeTab, setActiveTab] = useState<'ascii' | 'sgf' | 'json'>('ascii');
  const [copied, setCopied] = useState(false);

  // Editable ASCII & SGF text states
  const currentAscii = boardToAscii(board, playerToMove);
  const currentSgf = movesToSgf(moves);

  const [inputAscii, setInputAscii] = useState(currentAscii);
  const [inputSgf, setInputSgf] = useState(currentSgf);

  // Synchronize when opened
  React.useEffect(() => {
    if (isOpen) {
      setInputAscii(boardToAscii(board, playerToMove));
      setInputSgf(movesToSgf(moves));
      setCopied(false);
    }
  }, [isOpen, board, moves, playerToMove]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyAscii = () => {
    try {
      const { board: parsedBoard, playerToMove: parsedPlayer } = asciiToBoard(inputAscii);
      onLoadAscii(parsedBoard, parsedPlayer);
      onClose();
    } catch {
      alert('Failed to parse ASCII board format. Ensure rows are 1..19 with 19 symbols each.');
    }
  };

  const handleApplySgf = () => {
    try {
      const { moves: parsedMoves } = sgfToMoves(inputSgf);
      if (parsedMoves.length === 0) {
        alert('No valid moves found in SGF string.');
        return;
      }
      onLoadSgfMoves(parsedMoves);
      onClose();
    } catch {
      alert('Invalid SGF format. Please check the SGF string syntax.');
    }
  };

  const handleDownloadSgf = () => {
    const blob = new Blob([currentSgf], { type: 'application/x-go-sgf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katago-game-${Date.now()}.sgf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Strict JSON payload as specified in user prompt
  const jsonPayload = analysis
    ? JSON.stringify(
        {
          next_move: analysis.next_move,
          win_rate_estimate: analysis.win_rate_estimate,
          score_lead_estimate: analysis.score_lead_estimate,
          top_3_candidates: analysis.top_3_candidates.map((c) => ({
            move: c.move,
            reason: c.reason,
          })),
          commentary: analysis.commentary,
        },
        null,
        2
      )
    : JSON.stringify(
        {
          message: 'Run analysis first to view generated Grandmaster JSON.',
          sample_contract: {
            next_move: 'R14',
            win_rate_estimate: '62.5%',
            score_lead_estimate: 'B+2.5',
            top_3_candidates: [
              { move: 'R14', reason: 'High approach maintaining sente' },
              { move: 'D10', reason: 'Large central territorial expansion' },
              { move: 'C6', reason: 'Standard low corner enclosure' },
            ],
            commentary: 'Brief summary of board situation and strategy',
          },
        },
        null,
        2
      );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">
              Board Data & AI Engine Formats
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('ascii')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'ascii'
                ? 'border-cyan-500 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>19x19 ASCII Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('sgf')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'sgf'
                ? 'border-cyan-500 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>SGF / Move History</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'json'
                ? 'border-cyan-500 text-cyan-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Engine JSON Output</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'ascii' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Standard 19x19 ASCII representation (X = Black, O = White, + = Star point, . = Empty)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(inputAscii)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy ASCII'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={inputAscii}
                onChange={(e) => setInputAscii(e.target.value)}
                rows={18}
                className="w-full font-mono text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 focus:outline-none focus:border-cyan-500 leading-tight whitespace-pre"
                spellCheck={false}
              />

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setInputAscii(currentAscii)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Reset to Current
                </button>
                <button
                  onClick={handleApplyAscii}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Load ASCII into Board</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'sgf' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Smart Game Format (SGF) tree string & move list:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSgf}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download .sgf</span>
                  </button>
                  <button
                    onClick={() => handleCopy(inputSgf)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy SGF'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={inputSgf}
                onChange={(e) => setInputSgf(e.target.value)}
                rows={10}
                className="w-full font-mono text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed whitespace-pre-wrap"
                placeholder="(;GM[1]SZ[19]...)"
                spellCheck={false}
              />

              {/* Move History Sequence */}
              <div className="mt-2">
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  Move History ({moves.length} moves):
                </span>
                <div className="max-h-28 overflow-y-auto bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex flex-wrap gap-2">
                  {moves.map((m, idx) => (
                    <span key={`mv-${idx}`} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {m.moveNumber}. {m.color}: {m.coordinate}
                    </span>
                  ))}
                  {moves.length === 0 && <span className="text-slate-600">No moves played yet.</span>}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setInputSgf(currentSgf)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Reset to Current
                </button>
                <button
                  onClick={handleApplySgf}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Load SGF into Board</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Strict JSON Output Schema (KataGo Grandmaster API Response):</span>
                <button
                  onClick={() => handleCopy(jsonPayload)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="font-mono text-xs p-4 bg-slate-950 border border-slate-800 rounded-xl text-amber-300 overflow-x-auto leading-relaxed">
                {jsonPayload}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
