import React, { useState, useEffect, useCallback } from 'react';
import {
  BoardState,
  CandidateMove,
  GamePreset,
  GoAnalysisResponse,
  GoMove,
  Player,
} from './types/go';
import {
  boardToAscii,
  coordToPoint,
  createEmptyBoard,
  executeMove,
  movesToSgf,
  playStoneSound,
  pointToCoord,
  FAMOUS_PRESETS,
} from './utils/goEngine';
import { GoBoard } from './components/GoBoard';
import { WinRateBar } from './components/WinRateBar';
import { ControlToolbar } from './components/ControlToolbar';
import { AnalysisPanel } from './components/AnalysisPanel';
import { SgfAsciiModal } from './components/SgfAsciiModal';
import { PresetSelector } from './components/PresetSelector';
import { Cpu, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  const [moves, setMoves] = useState<GoMove[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
  const [board, setBoard] = useState<BoardState>(createEmptyBoard());
  const [playerToMove, setPlayerToMove] = useState<Player>('B');
  const [captures, setCaptures] = useState<{ B: number; W: number }>({ B: 0, W: 0 });

  // AI & Analysis state
  const [analysis, setAnalysis] = useState<GoAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [vsAiMode, setVsAiMode] = useState<boolean>(false);

  // View Options
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [showMoveNumbers, setShowMoveNumbers] = useState<boolean>(false);
  const [showAiOverlay, setShowAiOverlay] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals & Presets
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'analysis' | 'presets'>('analysis');

  // Replay board from move history up to a specific index
  const replayMovesUpTo = useCallback(
    (targetIndex: number, moveList: GoMove[]) => {
      let currentBoard = createEmptyBoard();
      let bCaptures = 0;
      let wCaptures = 0;
      let nextPlayer: Player = 'B';
      let prevBoard: BoardState | null = null;

      for (let i = 0; i < targetIndex; i++) {
        const m = moveList[i];
        if (!m.pass && m.x >= 0 && m.y >= 0) {
          const res = executeMove(currentBoard, m.x, m.y, m.color, prevBoard);
          if (res.success) {
            prevBoard = currentBoard;
            currentBoard = res.newBoard;
            bCaptures += res.capturedCount.B;
            wCaptures += res.capturedCount.W;
          }
        }
        nextPlayer = m.color === 'B' ? 'W' : 'B';
      }

      setBoard(currentBoard);
      setCaptures({ B: bCaptures, W: wCaptures });
      setCurrentMoveIndex(targetIndex);
      setPlayerToMove(nextPlayer);
    },
    []
  );

  // Run KataGo AI position analysis via backend /api/analyze
  const runAnalysis = useCallback(
    async (
      customPrompt?: string,
      targetBoard?: BoardState,
      targetPlayer?: Player,
      targetMoves?: GoMove[]
    ) => {
      const activeBoard = targetBoard || board;
      const activePlayer = targetPlayer || playerToMove;
      const activeMoves = targetMoves || moves.slice(0, currentMoveIndex);

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const boardAscii = boardToAscii(activeBoard, activePlayer);
        const sgf = movesToSgf(activeMoves);
        const movesHistory = activeMoves.map(
          (m) => `${m.color}: ${m.coordinate}`
        );

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            boardAscii,
            sgf,
            movesHistory,
            playerToMove: activePlayer,
            userPrompt: customPrompt,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to analyze position`);
        }

        const data: GoAnalysisResponse = await response.json();
        setAnalysis(data);
        return data;
      } catch (err: any) {
        console.error('Analysis request error:', err);
        setAnalysisError(err?.message || 'Failed to reach Go Grandmaster AI');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [board, playerToMove, moves, currentMoveIndex]
  );

  // Place a stone on intersection (x, y)
  const handleIntersectionClick = useCallback(
    async (x: number, y: number) => {
      // Check if move is legal
      const prevBoard =
        currentMoveIndex > 0 ? createEmptyBoard() : null; // simplified prevBoard
      const result = executeMove(board, x, y, playerToMove, prevBoard);

      if (!result.success) {
        // Show audio/visual feedback on illegal move
        if (result.reason) {
          setAnalysisError(`Illegal move: ${result.reason}`);
          setTimeout(() => setAnalysisError(null), 3000);
        }
        return;
      }

      if (soundEnabled) {
        playStoneSound();
      }

      const newMove: GoMove = {
        x,
        y,
        color: playerToMove,
        moveNumber: currentMoveIndex + 1,
        coordinate: pointToCoord(x, y),
        capturedByMove: result.capturedCount,
      };

      const updatedMoves = [...moves.slice(0, currentMoveIndex), newMove];
      const nextPlayer: Player = playerToMove === 'B' ? 'W' : 'B';

      setBoard(result.newBoard);
      setCaptures((prev) => ({
        B: prev.B + result.capturedCount.B,
        W: prev.W + result.capturedCount.W,
      }));
      setMoves(updatedMoves);
      setCurrentMoveIndex(updatedMoves.length);
      setPlayerToMove(nextPlayer);
      setSelectedPresetId(undefined);

      // If Play vs AI mode is enabled, immediately trigger AI response
      if (vsAiMode) {
        const aiData = await runAnalysis(
          'Play optimal next response against human move',
          result.newBoard,
          nextPlayer,
          updatedMoves
        );

        if (aiData && aiData.next_move && aiData.next_move !== 'PASS') {
          const aiPoint = coordToPoint(aiData.next_move);
          if (aiPoint) {
            const aiResult = executeMove(
              result.newBoard,
              aiPoint.x,
              aiPoint.y,
              nextPlayer
            );
            if (aiResult.success) {
              if (soundEnabled) {
                setTimeout(playStoneSound, 350);
              }
              const aiMove: GoMove = {
                x: aiPoint.x,
                y: aiPoint.y,
                color: nextPlayer,
                moveNumber: updatedMoves.length + 1,
                coordinate: aiData.next_move,
                capturedByMove: aiResult.capturedCount,
              };

              const withAiMoves = [...updatedMoves, aiMove];
              const afterAiPlayer: Player = nextPlayer === 'B' ? 'W' : 'B';

              setBoard(aiResult.newBoard);
              setCaptures((prev) => ({
                B: prev.B + aiResult.capturedCount.B,
                W: prev.W + aiResult.capturedCount.W,
              }));
              setMoves(withAiMoves);
              setCurrentMoveIndex(withAiMoves.length);
              setPlayerToMove(afterAiPlayer);
            }
          }
        }
      }
    },
    [
      board,
      playerToMove,
      currentMoveIndex,
      moves,
      soundEnabled,
      vsAiMode,
      runAnalysis,
    ]
  );

  // Play a candidate move suggested by KataGo
  const handlePlayCandidate = useCallback(
    (candidate: CandidateMove) => {
      const pt = coordToPoint(candidate.move);
      if (pt) {
        handleIntersectionClick(pt.x, pt.y);
      }
    },
    [handleIntersectionClick]
  );

  // Pass current turn
  const handlePass = useCallback(() => {
    const nextPlayer: Player = playerToMove === 'B' ? 'W' : 'B';
    const passMove: GoMove = {
      x: -1,
      y: -1,
      color: playerToMove,
      pass: true,
      moveNumber: currentMoveIndex + 1,
      coordinate: 'PASS',
    };

    const updatedMoves = [...moves.slice(0, currentMoveIndex), passMove];
    setMoves(updatedMoves);
    setCurrentMoveIndex(updatedMoves.length);
    setPlayerToMove(nextPlayer);
  }, [currentMoveIndex, moves, playerToMove]);

  // Undo last move
  const handleUndo = useCallback(() => {
    if (currentMoveIndex > 0) {
      replayMovesUpTo(currentMoveIndex - 1, moves);
    }
  }, [currentMoveIndex, moves, replayMovesUpTo]);

  // Reset board
  const handleReset = useCallback(() => {
    setBoard(createEmptyBoard());
    setMoves([]);
    setCurrentMoveIndex(0);
    setPlayerToMove('B');
    setCaptures({ B: 0, W: 0 });
    setAnalysis(null);
    setSelectedPresetId(undefined);
  }, []);

  // Load a preset game
  const handleSelectPreset = useCallback(
    (preset: GamePreset) => {
      setSelectedPresetId(preset.id);
      setMoves(preset.moves);
      replayMovesUpTo(preset.moves.length, preset.moves);
      setPlayerToMove(preset.playerToMove);
      // Run analysis on preset
      runAnalysis(undefined, undefined, preset.playerToMove, preset.moves);
    },
    [replayMovesUpTo, runAnalysis]
  );

  // Load ASCII grid from modal
  const handleLoadAscii = useCallback((newBoard: BoardState, player: Player) => {
    setBoard(newBoard);
    setPlayerToMove(player);
    setMoves([]);
    setCurrentMoveIndex(0);
    setSelectedPresetId(undefined);
    setAnalysis(null);
  }, []);

  // Load SGF from modal
  const handleLoadSgfMoves = useCallback(
    (newMoves: GoMove[]) => {
      setMoves(newMoves);
      replayMovesUpTo(newMoves.length, newMoves);
      setSelectedPresetId(undefined);
      runAnalysis(undefined, undefined, undefined, newMoves);
    },
    [replayMovesUpTo, runAnalysis]
  );

  // Initial analysis on first mount
  useEffect(() => {
    runAnalysis();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-900/30">
              <Cpu className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-100">
                  KataGo Grandmaster AI
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
                  19x19 Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Professional Baduk & Weiqi Position Evaluation, Win Rate & Candidates
              </p>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'analysis' ? 'presets' : 'analysis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                activeTab === 'presets'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeTab === 'presets' ? 'Back to Analysis' : 'Famous Games'}</span>
            </button>

            <button
              onClick={() => setIsDataModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors shadow-sm"
              title="View or edit 19x19 ASCII, SGF, and strict JSON format"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>SGF / ASCII / JSON</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-5 flex flex-col gap-4">
        {/* Win Rate & Score Lead Banner */}
        <WinRateBar
          winRateStr={analysis?.win_rate_estimate}
          scoreLeadStr={analysis?.score_lead_estimate}
          playerToMove={playerToMove}
          isAnalyzing={isAnalyzing}
        />

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Goban Board & Control Toolbar (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <GoBoard
              board={board}
              moves={moves.slice(0, currentMoveIndex)}
              playerToMove={playerToMove}
              onIntersectionClick={handleIntersectionClick}
              showCoordinates={showCoordinates}
              showMoveNumbers={showMoveNumbers}
              showAiOverlay={showAiOverlay}
              aiRecommendedMove={analysis?.next_move}
              aiCandidates={analysis?.top_3_candidates}
              onSelectCandidate={handlePlayCandidate}
            />

            <ControlToolbar
              currentMoveIndex={currentMoveIndex}
              totalMoves={moves.length}
              onGoToMove={(idx) => replayMovesUpTo(idx, moves)}
              onUndo={handleUndo}
              onPass={handlePass}
              onReset={handleReset}
              playerToMove={playerToMove}
              onTogglePlayerToMove={() =>
                setPlayerToMove((prev) => (prev === 'B' ? 'W' : 'B'))
              }
              captures={captures}
              showCoordinates={showCoordinates}
              onToggleCoordinates={() => setShowCoordinates((prev) => !prev)}
              showMoveNumbers={showMoveNumbers}
              onToggleMoveNumbers={() => setShowMoveNumbers((prev) => !prev)}
              showAiOverlay={showAiOverlay}
              onToggleAiOverlay={() => setShowAiOverlay((prev) => !prev)}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
            />
          </div>

          {/* Right Column: AI Analysis Panel or Preset Selector (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {activeTab === 'analysis' ? (
              <AnalysisPanel
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                onRunAnalysis={(prompt) => runAnalysis(prompt)}
                playerToMove={playerToMove}
                onPlayCandidate={handlePlayCandidate}
                vsAiMode={vsAiMode}
                onToggleVsAi={() => setVsAiMode((prev) => !prev)}
                onOpenJsonModal={() => setIsDataModalOpen(true)}
                analysisError={analysisError}
              />
            ) : (
              <PresetSelector
                onSelectPreset={handleSelectPreset}
                selectedPresetId={selectedPresetId}
              />
            )}
          </div>
        </div>
      </main>

      {/* SGF / ASCII / JSON Format Modal */}
      <SgfAsciiModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        board={board}
        moves={moves.slice(0, currentMoveIndex)}
        playerToMove={playerToMove}
        analysis={analysis}
        onLoadAscii={handleLoadAscii}
        onLoadSgfMoves={handleLoadSgfMoves}
      />
    </div>
  );
}
