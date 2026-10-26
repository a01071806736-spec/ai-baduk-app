import { BoardState, GamePreset, GoMove, Player, Point } from '../types/go';

export const BOARD_SIZE = 19;

export const COL_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
  'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'
];

export const STAR_POINTS: Point[] = [
  { x: 3, y: 3 },   // D16
  { x: 9, y: 3 },   // K16
  { x: 15, y: 3 },  // Q16
  { x: 3, y: 9 },   // D10
  { x: 9, y: 9 },   // K10 (Tengen)
  { x: 15, y: 9 },  // Q10
  { x: 3, y: 15 },  // D4
  { x: 9, y: 15 },  // K4
  { x: 15, y: 15 }, // Q4
];

export function isStarPoint(x: number, y: number): boolean {
  return STAR_POINTS.some(p => p.x === x && p.y === y);
}

// Convert 0-indexed x, y to Go coordinate (e.g. x=3, y=15 -> "D4")
export function pointToCoord(x: number, y: number): string {
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return 'PASS';
  const col = COL_LETTERS[x];
  const row = BOARD_SIZE - y;
  return `${col}${row}`;
}

// Convert Go coordinate (e.g. "R14", "D4", "PASS") to 0-indexed Point
export function coordToPoint(coordStr: string): Point | null {
  if (!coordStr) return null;
  const clean = coordStr.trim().toUpperCase();
  if (clean === 'PASS' || clean === 'RESIGN') return null;

  const colLetter = clean.charAt(0);
  const colIndex = COL_LETTERS.indexOf(colLetter);
  if (colIndex === -1) return null;

  const rowNum = parseInt(clean.slice(1), 10);
  if (isNaN(rowNum) || rowNum < 1 || rowNum > BOARD_SIZE) return null;

  const y = BOARD_SIZE - rowNum;
  return { x: colIndex, y };
}

// Convert SGF coordinate (e.g. "pd", "dp") to Point
export function sgfCoordToPoint(sgfCoord: string): Point | null {
  if (!sgfCoord || sgfCoord.length < 2) return null;
  const colChar = sgfCoord.charAt(0).toLowerCase();
  const rowChar = sgfCoord.charAt(1).toLowerCase();

  const x = colChar.charCodeAt(0) - 97; // 'a' = 97 -> 0
  const y = rowChar.charCodeAt(0) - 97;

  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return null;
  return { x, y };
}

// Convert Point to SGF coordinate
export function pointToSgfCoord(x: number, y: number): string {
  const colChar = String.fromCharCode(97 + x);
  const rowChar = String.fromCharCode(97 + y);
  return `${colChar}${rowChar}`;
}

export function createEmptyBoard(): BoardState {
  const board: BoardState = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    const row: (Player | null)[] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      row.push(null);
    }
    board.push(row);
  }
  return board;
}

export function cloneBoard(board: BoardState): BoardState {
  return board.map(row => [...row]);
}

export function boardsEqual(a: BoardState, b: BoardState): boolean {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (a[y][x] !== b[y][x]) return false;
    }
  }
  return true;
}

export function getNeighbors(x: number, y: number): Point[] {
  const neighbors: Point[] = [];
  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < BOARD_SIZE - 1) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < BOARD_SIZE - 1) neighbors.push({ x, y: y + 1 });
  return neighbors;
}

export function getGroupAndLiberties(
  board: BoardState,
  startX: number,
  startY: number
): { color: Player; stones: Point[]; liberties: Point[] } | null {
  const color = board[startY][startX];
  if (!color) return null;

  const stones: Point[] = [];
  const libertiesSet = new Set<string>();
  const visited = new Set<string>();
  const queue: Point[] = [{ x: startX, y: startY }];

  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    stones.push(curr);

    const neighbors = getNeighbors(curr.x, curr.y);
    for (const nb of neighbors) {
      const neighborColor = board[nb.y][nb.x];
      const key = `${nb.x},${nb.y}`;

      if (neighborColor === null) {
        libertiesSet.add(key);
      } else if (neighborColor === color && !visited.has(key)) {
        visited.add(key);
        queue.push(nb);
      }
    }
  }

  const liberties: Point[] = Array.from(libertiesSet).map(key => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  });

  return { color, stones, liberties };
}

export interface MoveExecutionResult {
  success: boolean;
  newBoard: BoardState;
  capturedCount: { B: number; W: number }; // stones captured in this move
  reason?: string;
  koPoint?: Point | null;
}

export function executeMove(
  board: BoardState,
  x: number,
  y: number,
  color: Player,
  previousBoardState?: BoardState | null
): MoveExecutionResult {
  // 1. Boundary & occupied check
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return { success: false, newBoard: board, capturedCount: { B: 0, W: 0 }, reason: 'Out of bounds' };
  }
  if (board[y][x] !== null) {
    return { success: false, newBoard: board, capturedCount: { B: 0, W: 0 }, reason: 'Intersection already occupied' };
  }

  const opponentColor: Player = color === 'B' ? 'W' : 'B';
  const newBoard = cloneBoard(board);
  newBoard[y][x] = color;

  // 2. Capture adjacent opponent groups with 0 liberties
  const neighbors = getNeighbors(x, y);
  let capturedStonesCount = 0;
  const capturedPoints: Point[] = [];

  for (const nb of neighbors) {
    if (newBoard[nb.y][nb.x] === opponentColor) {
      const opponentGroup = getGroupAndLiberties(newBoard, nb.x, nb.y);
      if (opponentGroup && opponentGroup.liberties.length === 0) {
        // Group has 0 liberties -> remove
        for (const st of opponentGroup.stones) {
          if (newBoard[st.y][st.x] !== null) {
            newBoard[st.y][st.x] = null;
            capturedPoints.push(st);
            capturedStonesCount++;
          }
        }
      }
    }
  }

  // 3. Check own group liberties (suicide rule)
  const ownGroup = getGroupAndLiberties(newBoard, x, y);
  if (!ownGroup || ownGroup.liberties.length === 0) {
    return {
      success: false,
      newBoard: board,
      capturedCount: { B: 0, W: 0 },
      reason: 'Suicide move is prohibited in Go rules',
    };
  }

  // 4. Check Ko rule: position cannot repeat previous turn
  if (previousBoardState && boardsEqual(newBoard, previousBoardState)) {
    return {
      success: false,
      newBoard: board,
      capturedCount: { B: 0, W: 0 },
      reason: 'Ko rule violation: cannot recreate immediately preceding board state',
    };
  }

  // Identify potential Ko point: 1 stone captured and placed stone has exactly 1 liberty
  let koPoint: Point | null = null;
  if (capturedStonesCount === 1 && ownGroup.stones.length === 1 && ownGroup.liberties.length === 1) {
    koPoint = capturedPoints[0];
  }

  const capturedByPlayer = {
    B: color === 'B' ? capturedStonesCount : 0,
    W: color === 'W' ? capturedStonesCount : 0,
  };

  return {
    success: true,
    newBoard,
    capturedCount: capturedByPlayer,
    koPoint,
  };
}

// Convert board state to 19x19 ASCII representation (KataGo / GTP format)
export function boardToAscii(board: BoardState, playerToMove: Player = 'B'): string {
  const lines: string[] = [];
  const headerCols = '   ' + COL_LETTERS.join(' ');
  lines.push(headerCols);

  for (let y = 0; y < BOARD_SIZE; y++) {
    const rowNum = BOARD_SIZE - y;
    const rowNumStr = rowNum < 10 ? ` ${rowNum}` : `${rowNum}`;
    const rowChars: string[] = [];

    for (let x = 0; x < BOARD_SIZE; x++) {
      const stone = board[y][x];
      if (stone === 'B') {
        rowChars.push('X');
      } else if (stone === 'W') {
        rowChars.push('O');
      } else if (isStarPoint(x, y)) {
        rowChars.push('+');
      } else {
        rowChars.push('.');
      }
    }

    lines.push(`${rowNumStr} ${rowChars.join(' ')} ${rowNumStr}`);
  }

  lines.push(headerCols);
  lines.push(`To Move: ${playerToMove === 'B' ? 'Black (X)' : 'White (O)'}`);
  return lines.join('\n');
}

// Parse 19x19 ASCII board representation
export function asciiToBoard(asciiStr: string): { board: BoardState; playerToMove: Player } {
  const board = createEmptyBoard();
  let playerToMove: Player = 'B';

  const lines = asciiStr.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines) {
    if (line.toLowerCase().includes('to move:')) {
      if (line.toLowerCase().includes('white') || line.includes('(o)')) {
        playerToMove = 'W';
      } else {
        playerToMove = 'B';
      }
      continue;
    }

    // Match line starting with row number 1..19
    const match = line.match(/^(\d{1,2})\s+(.+?)(?:\s+\d{1,2})?$/);
    if (match) {
      const rowNum = parseInt(match[1], 10);
      if (rowNum >= 1 && rowNum <= BOARD_SIZE) {
        const y = BOARD_SIZE - rowNum;
        const tokens = match[2].split(/\s+/).filter(t => t.length > 0);
        for (let x = 0; x < Math.min(tokens.length, BOARD_SIZE); x++) {
          const char = tokens[x].toUpperCase();
          if (char === 'X' || char === 'B') {
            board[y][x] = 'B';
          } else if (char === 'O' || char === 'W') {
            board[y][x] = 'W';
          } else {
            board[y][x] = null;
          }
        }
      }
    }
  }

  return { board, playerToMove };
}

// Convert move history to SGF string
export function movesToSgf(
  moves: GoMove[],
  options?: { blackPlayer?: string; whitePlayer?: string; komi?: number }
): string {
  const bPlayer = options?.blackPlayer || 'KataGo AI';
  const wPlayer = options?.whitePlayer || 'KataGo AI';
  const komi = options?.komi ?? 6.5;

  let sgf = `(;GM[1]FF[4]CA[UTF-8]AP[KataGo-Grandmaster-AI]SZ[19]KM[${komi}]RU[Japanese]PW[${wPlayer}]PB[${bPlayer}]`;

  for (const move of moves) {
    if (move.pass) {
      sgf += `;${move.color}[]`;
    } else {
      const sgfCoord = pointToSgfCoord(move.x, move.y);
      sgf += `;${move.color}[${sgfCoord}]`;
    }
  }

  sgf += ')';
  return sgf;
}

// Parse basic SGF string into moves
export function sgfToMoves(sgfStr: string): { moves: GoMove[]; initialPlayer: Player } {
  const moves: GoMove[] = [];
  const regex = /;([BW])\[([a-s]{0,2})\]/gi;
  let match: RegExpExecArray | null;
  let moveNum = 1;

  while ((match = regex.exec(sgfStr)) !== null) {
    const color = match[1].toUpperCase() as Player;
    const coordStr = match[2].toLowerCase();

    if (!coordStr || coordStr === 'tt' || coordStr === '') {
      moves.push({
        x: -1,
        y: -1,
        color,
        pass: true,
        moveNumber: moveNum++,
        coordinate: 'PASS',
      });
    } else {
      const pt = sgfCoordToPoint(coordStr);
      if (pt) {
        moves.push({
          x: pt.x,
          y: pt.y,
          color,
          pass: false,
          moveNumber: moveNum++,
          coordinate: pointToCoord(pt.x, pt.y),
        });
      }
    }
  }

  const initialPlayer: Player = moves.length > 0 && moves[moves.length - 1].color === 'B' ? 'W' : 'B';
  return { moves, initialPlayer };
}

// Web Audio API stone click synthesizer
let audioCtx: AudioContext | null = null;

export function playStoneSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    // Authentic crisp wooden clack frequency profile
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.045);

    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.055);
  } catch {
    // Graceful silent fallback
  }
}

// Famous Go Presets
export const FAMOUS_PRESETS: GamePreset[] = [
  {
    id: 'lee-sedol-move-78',
    name: 'AlphaGo vs Lee Sedol (Game 4)',
    subtitle: 'The Divine Move 78 (신의 한 수)',
    description: 'March 13, 2016. Lee Sedol (White) plays Move 78 at L11, a miraculous wedge into AlphaGo center framework that turned the game around.',
    playerToMove: 'W',
    focusPoint: { x: 10, y: 8 }, // L11: col L=10, row 11 -> y=8
    moves: [
      { x: 15, y: 3, color: 'B', coordinate: 'Q16', moveNumber: 1 },
      { x: 3, y: 15, color: 'W', coordinate: 'D4', moveNumber: 2 },
      { x: 15, y: 15, color: 'B', coordinate: 'Q4', moveNumber: 3 },
      { x: 3, y: 3, color: 'W', coordinate: 'D16', moveNumber: 4 },
      { x: 16, y: 16, color: 'B', coordinate: 'R3', moveNumber: 5 },
      { x: 16, y: 14, color: 'W', coordinate: 'R5', moveNumber: 6 },
      { x: 14, y: 15, color: 'B', coordinate: 'P4', moveNumber: 7 },
      { x: 16, y: 11, color: 'W', coordinate: 'R8', moveNumber: 8 },
      { x: 2, y: 13, color: 'B', coordinate: 'C6', moveNumber: 9 },
      { x: 5, y: 16, color: 'W', coordinate: 'F3', moveNumber: 10 },
      { x: 2, y: 5, color: 'B', coordinate: 'C14', moveNumber: 11 },
      { x: 5, y: 2, color: 'W', coordinate: 'F17', moveNumber: 12 },
      { x: 16, y: 5, color: 'B', coordinate: 'R14', moveNumber: 13 },
      { x: 14, y: 2, color: 'W', coordinate: 'P17', moveNumber: 14 },
      { x: 14, y: 3, color: 'B', coordinate: 'P16', moveNumber: 15 },
      { x: 13, y: 2, color: 'W', coordinate: 'O17', moveNumber: 16 },
      { x: 13, y: 3, color: 'B', coordinate: 'O16', moveNumber: 17 },
      { x: 12, y: 2, color: 'W', coordinate: 'N17', moveNumber: 18 },
      { x: 12, y: 3, color: 'B', coordinate: 'N16', moveNumber: 19 },
      { x: 11, y: 2, color: 'W', coordinate: 'M17', moveNumber: 20 },
      { x: 10, y: 6, color: 'B', coordinate: 'L13', moveNumber: 21 },
      { x: 9, y: 7, color: 'W', coordinate: 'K12', moveNumber: 22 },
      { x: 10, y: 7, color: 'B', coordinate: 'L12', moveNumber: 23 },
    ],
  },
  {
    id: 'shusaku-ear-reddening',
    name: 'Honinbo Shusaku Ear-Reddening Game',
    subtitle: 'The legendary Move 127 (耳赤の一手)',
    description: '1846. Kuwahara Shusaku (Black) vs Gennan Inseki (White). At move 127, Shusaku placed D10 in the center. Gennan ears turned red, sensing the masterstroke.',
    playerToMove: 'B',
    focusPoint: { x: 3, y: 9 }, // D10
    moves: [
      { x: 15, y: 3, color: 'B', coordinate: 'Q16', moveNumber: 1 },
      { x: 3, y: 15, color: 'W', coordinate: 'D4', moveNumber: 2 },
      { x: 16, y: 15, color: 'B', coordinate: 'R4', moveNumber: 3 },
      { x: 2, y: 3, color: 'W', coordinate: 'C16', moveNumber: 4 },
      { x: 3, y: 4, color: 'B', coordinate: 'D15', moveNumber: 5 },
      { x: 4, y: 2, color: 'W', coordinate: 'E17', moveNumber: 6 },
      { x: 2, y: 4, color: 'B', coordinate: 'C15', moveNumber: 7 },
      { x: 2, y: 5, color: 'W', coordinate: 'C14', moveNumber: 8 },
      { x: 1, y: 4, color: 'B', coordinate: 'B15', moveNumber: 9 },
      { x: 1, y: 5, color: 'W', coordinate: 'B14', moveNumber: 10 },
      { x: 14, y: 15, color: 'B', coordinate: 'P4', moveNumber: 11 },
      { x: 16, y: 13, color: 'W', coordinate: 'R6', moveNumber: 12 },
      { x: 16, y: 8, color: 'B', coordinate: 'R11', moveNumber: 13 },
      { x: 15, y: 10, color: 'W', coordinate: 'Q9', moveNumber: 14 },
    ],
  },
  {
    id: 'modern-ai-3-3',
    name: 'Modern AI 3-3 Invasion Joseki',
    subtitle: 'Early 3-3 Invasion Revolution',
    description: 'The defining hallmark of modern AI Go: an immediate 3-3 invasion under Black star-point, evaluating the trade-off between corner profit and outside thickness.',
    playerToMove: 'B',
    focusPoint: { x: 2, y: 2 }, // C17
    moves: [
      { x: 15, y: 3, color: 'B', coordinate: 'Q16', moveNumber: 1 },
      { x: 3, y: 15, color: 'W', coordinate: 'D4', moveNumber: 2 },
      { x: 15, y: 15, color: 'B', coordinate: 'Q4', moveNumber: 3 },
      { x: 3, y: 3, color: 'W', coordinate: 'D16', moveNumber: 4 },
      { x: 2, y: 2, color: 'B', coordinate: 'C17', moveNumber: 5 }, // 3-3 invasion!
      { x: 3, y: 2, color: 'W', coordinate: 'D17', moveNumber: 6 },
      { x: 2, y: 3, color: 'B', coordinate: 'C16', moveNumber: 7 },
      { x: 1, y: 3, color: 'W', coordinate: 'B16', moveNumber: 8 },
      { x: 2, y: 4, color: 'B', coordinate: 'C15', moveNumber: 9 },
      { x: 3, y: 4, color: 'W', coordinate: 'D15', moveNumber: 10 },
    ],
  },
  {
    id: 'tsumego-corner-life-death',
    name: 'Corner Life & Death (Tsumego)',
    subtitle: 'L-Group Status in the Corner',
    description: 'A classic tactical corner problem where living or killing hinges on capturing liberties and shape vital points (2-2 vs 2-1 points).',
    playerToMove: 'B',
    focusPoint: { x: 1, y: 1 }, // B18
    moves: [
      { x: 0, y: 0, color: 'B', coordinate: 'A19', moveNumber: 1 },
      { x: 1, y: 0, color: 'B', coordinate: 'B19', moveNumber: 2 },
      { x: 2, y: 0, color: 'B', coordinate: 'C19', moveNumber: 3 },
      { x: 0, y: 1, color: 'B', coordinate: 'A18', moveNumber: 4 },
      { x: 0, y: 2, color: 'B', coordinate: 'A17', moveNumber: 5 },
      { x: 3, y: 0, color: 'W', coordinate: 'D19', moveNumber: 6 },
      { x: 2, y: 1, color: 'W', coordinate: 'C18', moveNumber: 7 },
      { x: 1, y: 2, color: 'W', coordinate: 'B17', moveNumber: 8 },
      { x: 0, y: 3, color: 'W', coordinate: 'A16', moveNumber: 9 },
    ],
  },
];
