import React, { useState } from 'react';
import { BoardState, CandidateMove, GoMove, Player, Point } from '../types/go';
import {
  BOARD_SIZE,
  COL_LETTERS,
  coordToPoint,
  isStarPoint,
  pointToCoord,
  STAR_POINTS,
} from '../utils/goEngine';

interface GoBoardProps {
  board: BoardState;
  moves: GoMove[];
  playerToMove: Player;
  onIntersectionClick: (x: number, y: number) => void;
  showCoordinates?: boolean;
  showMoveNumbers?: boolean;
  showAiOverlay?: boolean;
  aiRecommendedMove?: string;
  aiCandidates?: CandidateMove[];
  onSelectCandidate?: (candidate: CandidateMove) => void;
  interactive?: boolean;
}

export const GoBoard: React.FC<GoBoardProps> = ({
  board,
  moves,
  playerToMove,
  onIntersectionClick,
  showCoordinates = true,
  showMoveNumbers = false,
  showAiOverlay = true,
  aiRecommendedMove,
  aiCandidates = [],
  onSelectCandidate,
  interactive = true,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);

  // SVG coordinate setup
  // Total viewBox 1000x1000
  // Margin 50px, Grid size 900x900, Step 50px (18 intervals)
  const MARGIN = 50;
  const STEP = 50;

  const getSvgCoord = (gridCoord: number) => MARGIN + gridCoord * STEP;

  const lastMove = moves.length > 0 ? moves[moves.length - 1] : null;

  // Build a map of move numbers for stones on the board
  const moveNumberMap = new Map<string, number>();
  moves.forEach((m) => {
    if (!m.pass && m.x >= 0 && m.y >= 0) {
      moveNumberMap.set(`${m.x},${m.y}`, m.moveNumber);
    }
  });

  // Parse AI recommendation points
  const recommendedPoint = aiRecommendedMove ? coordToPoint(aiRecommendedMove) : null;

  // Parse candidate moves
  const candidatePoints = aiCandidates
    .map((c, index) => ({
      ...c,
      rank: index + 1,
      point: coordToPoint(c.move),
    }))
    .filter(
      (c): c is typeof c & { point: Point } =>
        c.point !== null && c.point.x >= 0 && c.point.y >= 0
    );

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert screen coordinates to SVG viewBox coords
    const svgX = (clientX / rect.width) * 1000;
    const svgY = (clientY / rect.height) * 1000;

    // Calculate nearest grid point
    const gridX = Math.round((svgX - MARGIN) / STEP);
    const gridY = Math.round((svgY - MARGIN) / STEP);

    if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE) {
      setHoveredPoint({ x: gridX, y: gridY });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = (x: number, y: number) => {
    if (!interactive) return;
    onIntersectionClick(x, y);
  };

  return (
    <div className="relative w-full max-w-[650px] mx-auto select-none">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl p-1 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 border border-amber-600/40">
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-auto cursor-pointer block rounded-xl"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Rich Kaya Wood Gradient */}
            <linearGradient id="kaya-wood" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eec77f" />
              <stop offset="35%" stopColor="#e2b467" />
              <stop offset="70%" stopColor="#d5a556" />
              <stop offset="100%" stopColor="#c59243" />
            </linearGradient>

            {/* Wood Grain Lines Subtle Pattern */}
            <pattern id="wood-grain" width="1000" height="20" patternUnits="userSpaceOnUse">
              <line x1="0" y1="5" x2="1000" y2="5" stroke="#be8637" strokeWidth="0.75" opacity="0.35" />
              <line x1="0" y1="14" x2="1000" y2="14" stroke="#d59f4d" strokeWidth="0.5" opacity="0.25" />
            </pattern>

            {/* Black Stone 3D Gradient */}
            <radialGradient id="black-stone" cx="36%" cy="34%" r="66%">
              <stop offset="0%" stopColor="#52525b" />
              <stop offset="30%" stopColor="#27272a" />
              <stop offset="75%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
            </radialGradient>

            {/* White Stone 3D Clam-shell Gradient */}
            <radialGradient id="white-stone" cx="33%" cy="31%" r="67%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="85%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </radialGradient>

            {/* Drop Shadow for Stones */}
            <filter id="stone-shadow" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="3" dy="4" stdDeviation="3.5" floodColor="#1e1b18" floodOpacity="0.65" />
            </filter>

            {/* Glow for KataGo recommended move */}
            <filter id="halo-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Board Background */}
          <rect width="1000" height="1000" fill="url(#kaya-wood)" />
          <rect width="1000" height="1000" fill="url(#wood-grain)" />

          {/* Outer Border Inset Shadow & Line */}
          <rect
            x={MARGIN - 15}
            y={MARGIN - 15}
            width={900 + 30}
            height={900 + 30}
            fill="none"
            stroke="#63390c"
            strokeWidth="3.5"
            opacity="0.85"
            rx="4"
          />

          {/* Coordinate Labels */}
          {showCoordinates && (
            <g className="font-mono text-xs font-bold" fill="#58310c" textAnchor="middle" dominantBaseline="middle">
              {COL_LETTERS.map((letter, i) => {
                const xPos = getSvgCoord(i);
                return (
                  <React.Fragment key={`col-${letter}`}>
                    <text x={xPos} y={MARGIN - 28} fontSize="17">
                      {letter}
                    </text>
                    <text x={xPos} y={MARGIN + 900 + 28} fontSize="17">
                      {letter}
                    </text>
                  </React.Fragment>
                );
              })}
              {Array.from({ length: BOARD_SIZE }).map((_, i) => {
                const yPos = getSvgCoord(i);
                const rowNum = BOARD_SIZE - i;
                return (
                  <React.Fragment key={`row-${rowNum}`}>
                    <text x={MARGIN - 28} y={yPos} fontSize="17">
                      {rowNum}
                    </text>
                    <text x={MARGIN + 900 + 28} y={yPos} fontSize="17">
                      {rowNum}
                    </text>
                  </React.Fragment>
                );
              })}
            </g>
          )}

          {/* Grid Lines */}
          <g stroke="#3a1e05" strokeWidth="1.6" opacity="0.88">
            {/* Horizontal Lines */}
            {Array.from({ length: BOARD_SIZE }).map((_, i) => {
              const y = getSvgCoord(i);
              return (
                <line
                  key={`h-${i}`}
                  x1={MARGIN}
                  y1={y}
                  x2={MARGIN + 900}
                  y2={y}
                  strokeWidth={i === 0 || i === BOARD_SIZE - 1 ? 2.6 : 1.6}
                />
              );
            })}

            {/* Vertical Lines */}
            {Array.from({ length: BOARD_SIZE }).map((_, i) => {
              const x = getSvgCoord(i);
              return (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1={MARGIN}
                  x2={x}
                  y2={MARGIN + 900}
                  strokeWidth={i === 0 || i === BOARD_SIZE - 1 ? 2.6 : 1.6}
                />
              );
            })}
          </g>

          {/* Star Points (Hoshi) */}
          <g fill="#3a1e05">
            {STAR_POINTS.map((pt, i) => (
              <circle
                key={`star-${i}`}
                cx={getSvgCoord(pt.x)}
                cy={getSvgCoord(pt.y)}
                r="4.6"
              />
            ))}
          </g>

          {/* Stones Placed on Board */}
          {board.map((row, y) =>
            row.map((stone, x) => {
              if (!stone) return null;
              const cx = getSvgCoord(x);
              const cy = getSvgCoord(y);
              const isLast = lastMove && !lastMove.pass && lastMove.x === x && lastMove.y === y;
              const moveNum = moveNumberMap.get(`${x},${y}`);

              return (
                <g key={`stone-${x}-${y}`} filter="url(#stone-shadow)">
                  <circle
                    cx={cx}
                    cy={cy}
                    r="23"
                    fill={stone === 'B' ? 'url(#black-stone)' : 'url(#white-stone)'}
                  />

                  {/* Last Move Ring Indicator */}
                  {isLast && !showMoveNumbers && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="9"
                      fill="none"
                      stroke={stone === 'B' ? '#38bdf8' : '#e11d48'}
                      strokeWidth="3.2"
                      className="animate-pulse"
                    />
                  )}

                  {/* Move Number Overlay */}
                  {showMoveNumbers && moveNum !== undefined && (
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={moveNum > 99 ? '13' : '15'}
                      fontWeight="bold"
                      fill={stone === 'B' ? '#f1f5f9' : '#0f172a'}
                      className="font-mono"
                    >
                      {moveNum}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* AI Recommended Best Move (Halo Ring) */}
          {showAiOverlay && recommendedPoint && board[recommendedPoint.y][recommendedPoint.x] === null && (
            <g
              transform={`translate(${getSvgCoord(recommendedPoint.x)}, ${getSvgCoord(recommendedPoint.y)})`}
              filter="url(#halo-glow)"
              onClick={() => {
                if (onSelectCandidate && aiCandidates[0]) {
                  onSelectCandidate(aiCandidates[0]);
                } else {
                  handleClick(recommendedPoint.x, recommendedPoint.y);
                }
              }}
              className="cursor-pointer"
            >
              {/* Pulsing Target Halo */}
              <circle r="27" fill="none" stroke="#06b6d4" strokeWidth="3" opacity="0.85" className="animate-ping" />
              <circle r="24" fill="#06b6d4" fillOpacity="0.25" stroke="#22d3ee" strokeWidth="2.5" />
              <circle r="6" fill="#22d3ee" />
            </g>
          )}

          {/* AI Top 3 Candidate Badges */}
          {showAiOverlay &&
            candidatePoints.map((c) => {
              if (board[c.point.y][c.point.x] !== null) return null;
              const cx = getSvgCoord(c.point.x);
              const cy = getSvgCoord(c.point.y);

              const badgeColors =
                c.rank === 1
                  ? { bg: '#eab308', text: '#000000', border: '#fef08a' } // Gold
                  : c.rank === 2
                  ? { bg: '#06b6d4', text: '#ffffff', border: '#a5f3fc' } // Cyan
                  : { bg: '#a855f7', text: '#ffffff', border: '#e9d5ff' }; // Purple

              return (
                <g
                  key={`cand-${c.move}-${c.rank}`}
                  transform={`translate(${cx}, ${cy})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectCandidate) {
                      onSelectCandidate(c);
                    } else {
                      handleClick(c.point.x, c.point.y);
                    }
                  }}
                  className="cursor-pointer group"
                >
                  <circle
                    r="19"
                    fill={badgeColors.bg}
                    stroke={badgeColors.border}
                    strokeWidth="2.5"
                    filter="url(#stone-shadow)"
                    className="transition-transform duration-200 group-hover:scale-115"
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={badgeColors.text}
                    fontWeight="800"
                    fontSize="16"
                    fontFamily="sans-serif"
                  >
                    {c.rank}
                  </text>

                  {/* Coordinate Tag */}
                  <rect
                    x="-20"
                    y="-34"
                    width="40"
                    height="16"
                    rx="4"
                    fill="#0f172a"
                    stroke={badgeColors.border}
                    strokeWidth="1"
                    opacity="0.95"
                  />
                  <text
                    x="0"
                    y="-25"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#f8fafc"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {c.move}
                  </text>
                </g>
              );
            })}

          {/* Ghost Stone on Hover */}
          {hoveredPoint &&
            interactive &&
            board[hoveredPoint.y][hoveredPoint.x] === null && (
              <g
                transform={`translate(${getSvgCoord(hoveredPoint.x)}, ${getSvgCoord(hoveredPoint.y)})`}
                opacity="0.55"
                onClick={() => handleClick(hoveredPoint.x, hoveredPoint.y)}
              >
                <circle
                  r="23"
                  fill={playerToMove === 'B' ? 'url(#black-stone)' : 'url(#white-stone)'}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
              </g>
            )}

          {/* Clickable transparent target area for intersections */}
          {Array.from({ length: BOARD_SIZE }).map((_, y) =>
            Array.from({ length: BOARD_SIZE }).map((_, x) => (
              <rect
                key={`click-${x}-${y}`}
                x={getSvgCoord(x) - 24}
                y={getSvgCoord(y) - 24}
                width="48"
                height="48"
                fill="transparent"
                onClick={() => handleClick(x, y)}
              />
            ))
          )}
        </svg>

        {/* Hover Coordinate Floating Pill */}
        {hoveredPoint && (
          <div className="absolute top-3 left-3 bg-slate-900/90 text-cyan-300 font-mono text-xs px-2.5 py-1 rounded-md border border-slate-700/80 shadow-md backdrop-blur-sm pointer-events-none">
            {pointToCoord(hoveredPoint.x, hoveredPoint.y)}
            {board[hoveredPoint.y][hoveredPoint.x] && (
              <span className="text-slate-400 ml-1.5 font-sans">
                ({board[hoveredPoint.y][hoveredPoint.x] === 'B' ? 'Black' : 'White'})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
